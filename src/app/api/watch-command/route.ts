import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { episodeDateStatus, resolveEpisodeAirDate, riyadhToday } from '@/lib/episode-dates';
import { getSeasonEpisodes, getSeriesHeroExtras, getTitle, getYear, searchMovies, searchMulti, searchTV, type TMDBTrending } from '@/lib/tmdb';
import { parseWatchCommand } from '@/lib/watch-command';
import { interpretWatchCommand } from '@/lib/humain-watch-command';
import { analyticsConfigured, getRedis } from '@/lib/site-analytics';
import { isSameOrigin } from '@/lib/request-origin';
import { getWatchRecommendations, isRecommendationRequest } from '@/lib/watch-recommendations';

async function aiAccess(request: NextRequest): Promise<'allowed' | 'limited' | 'unavailable'> {
  if (!analyticsConfigured()) return 'unavailable';
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.HUMAIN_NODE_API_KEY || '';
    const id = createHmac('sha256', secret).update(ip).digest('hex').slice(0, 24);
    const key = `wm:ai:minute:${Math.floor(Date.now() / 60_000)}:${id}`;
    const redis = getRedis();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 90);
    return count > 12 ? 'limited' : 'allowed';
  } catch {
    return 'unavailable';
  }
}

function normalized(value: string) {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function score(item: TMDBTrending, title: string) {
  const target = normalized(title);
  const names = [getTitle(item), item.original_name, item.original_title].filter((name): name is string => Boolean(name));
  return Math.max(...names.map(name => {
    const value = normalized(name);
    if (value === target) return 100;
    if (value === `${target}s` || target === `${value}s`) return 90;
    if (value.startsWith(target)) return 78;
    if (value.includes(target)) return 58;
    const words = target.split(' ').filter(word => word.length > 1);
    return words.length ? Math.round(words.filter(word => value.includes(word)).length / words.length * 35) : 0;
  }));
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let input = '';
  let selectedId: number | undefined;
  let recommendationContext = '';
  let excludedIds: number[] = [];
  try {
    const body = await request.json() as { input?: unknown; selectedId?: unknown; recommendationContext?: unknown; excludedIds?: unknown };
    if (typeof body.input === 'string') input = body.input.trim().slice(0, 160);
    if (typeof body.selectedId === 'number' && Number.isSafeInteger(body.selectedId)) selectedId = body.selectedId;
    if (typeof body.recommendationContext === 'string') recommendationContext = body.recommendationContext.slice(0, 160);
    if (Array.isArray(body.excludedIds)) excludedIds = body.excludedIds.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id)).slice(0, 40);
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const access = await aiAccess(request);
  if (access === 'limited') {
    return NextResponse.json({ error: 'طلبات كثيرة الآن. جرّب بعد دقيقة.' }, { status: 429 });
  }
  if (isRecommendationRequest(input) || recommendationContext && /^(?:غيرها|غيرهم|شي ثاني|شي غير|زيد|بعد|more|another)$/i.test(input)) {
    try {
      const query = recommendationContext && /^(?:غيرها|غيرهم|شي ثاني|شي غير|زيد|بعد|more|another)$/i.test(input)
        ? recommendationContext : input;
      const result = await getWatchRecommendations(query, excludedIds);
      if (!result.recommendations.length) return NextResponse.json({ error: 'ما لقيت ترشيحات مناسبة حاليًا. جرّب نوعًا أو جوًا مختلفًا.' }, { status: 404 });
      return NextResponse.json({ ...result, recommendationQuery: query });
    } catch {
      return NextResponse.json({ error: 'الترشيحات غير متاحة الآن. حاول مرة ثانية.' }, { status: 502 });
    }
  }
  const command = access === 'allowed'
    ? await interpretWatchCommand(input) ?? parseWatchCommand(input)
    : parseWatchCommand(input);
  if (command.title.length < 2) return NextResponse.json({ error: 'اكتب اسم الفيلم أو المسلسل ورقم الحلقة.' }, { status: 400 });
  if (command.season !== undefined && (command.season < 0 || command.season > 99)
    || command.episode !== undefined && (command.episode < 1 || command.episode > 999)) {
    return NextResponse.json({ error: 'رقم الموسم أو الحلقة غير صحيح.' }, { status: 400 });
  }

  try {
    let results = command.type === 'tv' ? (await searchTV(command.title)).results
      : command.type === 'movie' ? (await searchMovies(command.title)).results
        : await searchMulti(command.title);
    if (command.personHint && command.type === 'tv' && /^[\p{L}\s]+$/u.test(command.title)) {
      const variant = command.title.endsWith('s') ? command.title.slice(0, -1) : `${command.title}s`;
      if (variant.length >= 2 && variant !== command.title) {
        const related = (await searchTV(variant)).results;
        const seen = new Set(results.map(item => item.id));
        results = [...results, ...related.filter(item => !seen.has(item.id))];
      }
    }
    let ranked = results.map(item => ({ item, rank: score(item, command.title) }))
      .filter(result => result.rank > 0)
      .sort((a, b) => b.rank - a.rank);
    if (!ranked.length) return NextResponse.json({ error: 'ما لقيت العمل. جرّب اسمه الإنجليزي أو اكتب الاسم كاملًا.' }, { status: 404 });

    if (command.personHint && command.type === 'tv') {
      const person = normalized(command.personHint);
      const strongCandidates = ranked.filter(result => result.item.media_type === 'tv' && result.rank >= 70);
      const candidates = (strongCandidates.length ? strongCandidates
        : ranked.filter(result => result.item.media_type === 'tv' && result.rank >= 50)).slice(0, 16);
      const withCast = await Promise.all(candidates.map(async result => {
        const { cast } = await getSeriesHeroExtras(result.item.id);
        return { ...result, matched: cast.some(actor => normalized(actor.name).includes(person)) };
      }));
      const matches = withCast.filter(result => result.matched);
      if (matches.length) ranked = matches.sort((a, b) => b.rank - a.rank);
      else if (!selectedId) return NextResponse.json({ choices: ranked.slice(0, 4).map(({ item }) => ({
        id: item.id, title: getTitle(item), year: getYear(item), type: item.media_type,
      })) });
    }

    const choice = selectedId ? ranked.find(result => result.item.id === selectedId) : ranked[0];
    if (!choice) return NextResponse.json({ error: 'اختر عملًا من النتائج.' }, { status: 400 });
    if (!selectedId && ranked.length > 1 && (choice.rank < 58
      || (ranked[1].rank === choice.rank && getYear(ranked[1].item) === getYear(choice.item)))) {
      return NextResponse.json({ choices: ranked.slice(0, 4).map(({ item }) => ({
        id: item.id, title: getTitle(item), year: getYear(item), type: item.media_type,
      })) });
    }

    const item = choice.item;
    if (item.media_type === 'movie') return NextResponse.json({ href: `/watch/movie/${item.id}`, title: getTitle(item) });
    if (!command.episode) return NextResponse.json({ href: `/series/${item.id}${command.season !== undefined ? `?season=${command.season}#episodes` : ''}`, title: getTitle(item) });

    const season = command.season ?? 1;
    const episodes = await getSeasonEpisodes(item.id, season).catch(() => []);
    const matched = episodes.find(entry => entry.episode_number === command.episode);
    if (!matched) return NextResponse.json({ error: `ما لقيت الحلقة ${command.episode} في الموسم ${season} من ${getTitle(item)}.` }, { status: 404 });
    const airDate = resolveEpisodeAirDate(item.id, season, matched.episode_number, matched.air_date);
    if (episodeDateStatus(airDate, riyadhToday()) === 'upcoming') {
      return NextResponse.json({ error: `الحلقة ${command.episode} من ${getTitle(item)} لم تصدر بعد.` }, { status: 404 });
    }
    return NextResponse.json({ href: `/watch/tv/${item.id}/${season}/${command.episode}`, title: getTitle(item) });
  } catch {
    return NextResponse.json({ error: 'البحث غير متاح الآن. حاول مرة ثانية.' }, { status: 502 });
  }
}
