import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { episodeDateStatus, resolveEpisodeAirDate, riyadhToday } from '@/lib/episode-dates';
import { getSeasonEpisodes, getTitle, getYear, searchMovies, searchMulti, searchTV, type TMDBTrending } from '@/lib/tmdb';
import { parseWatchCommand } from '@/lib/watch-command';
import { interpretWatchCommand } from '@/lib/humain-watch-command';
import { analyticsConfigured, getRedis } from '@/lib/site-analytics';
import { isSameOrigin } from '@/lib/request-origin';

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
    if (value.startsWith(`${target} `)) return 78;
    if (value.includes(target)) return 58;
    const words = target.split(' ').filter(word => word.length > 1);
    return words.length ? Math.round(words.filter(word => value.includes(word)).length / words.length * 35) : 0;
  }));
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let input = '';
  let selectedId: number | undefined;
  try {
    const body = await request.json() as { input?: unknown; selectedId?: unknown };
    if (typeof body.input === 'string') input = body.input.trim().slice(0, 160);
    if (typeof body.selectedId === 'number' && Number.isSafeInteger(body.selectedId)) selectedId = body.selectedId;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const access = await aiAccess(request);
  if (access === 'limited') {
    return NextResponse.json({ error: 'طلبات كثيرة الآن. جرّب بعد دقيقة.' }, { status: 429 });
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
    const results = command.type === 'tv' ? (await searchTV(command.title)).results
      : command.type === 'movie' ? (await searchMovies(command.title)).results
        : await searchMulti(command.title);
    const ranked = results.map(item => ({ item, rank: score(item, command.title) }))
      .filter(result => result.rank > 0)
      .sort((a, b) => b.rank - a.rank);
    if (!ranked.length) return NextResponse.json({ error: 'ما لقيت العمل. جرّب اسمه الإنجليزي أو اكتب الاسم كاملًا.' }, { status: 404 });

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
