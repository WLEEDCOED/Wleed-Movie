import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { episodeDateStatus, resolveEpisodeAirDate, riyadhToday } from '@/lib/episode-dates';
import { getSeasonEpisodes, getSeriesDetail, getSeriesHeroExtras, getTitle, getYear, searchMovies, searchMulti, searchTV, type TMDBTrending } from '@/lib/tmdb';
import { parseWatchCommand, type WatchCommand } from '@/lib/watch-command';
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

function choices(items: { item: TMDBTrending }[], command: WatchCommand) {
  return items.slice(0, 5).map(({ item }) => ({
    id: item.id, title: getTitle(item), year: getYear(item), type: item.media_type,
    ...(item.media_type === 'tv' ? { season: command.season, episode: command.episode } : {}),
  }));
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let input = '';
  let selectedId: number | undefined;
  let selectedType: 'tv' | 'movie' | undefined;
  let selectedSeason: number | undefined;
  let selectedEpisode: number | undefined;
  let recommendationContext = '';
  let excludedIds: number[] = [];
  let context: string[] = [];
  try {
    const body = await request.json() as { input?: unknown; selectedId?: unknown; selectedType?: unknown; season?: unknown; episode?: unknown; recommendationContext?: unknown; excludedIds?: unknown; context?: unknown };
    if (typeof body.input === 'string') input = body.input.trim().slice(0, 160);
    if (typeof body.selectedId === 'number' && Number.isSafeInteger(body.selectedId) && body.selectedId > 0) selectedId = body.selectedId;
    if (body.selectedType === 'tv' || body.selectedType === 'movie') selectedType = body.selectedType;
    if (typeof body.season === 'number' && Number.isInteger(body.season) && body.season >= 0 && body.season <= 99) selectedSeason = body.season;
    if (typeof body.episode === 'number' && Number.isInteger(body.episode) && body.episode >= 1 && body.episode <= 999) selectedEpisode = body.episode;
    if (typeof body.recommendationContext === 'string') recommendationContext = body.recommendationContext.slice(0, 160);
    if (Array.isArray(body.excludedIds)) excludedIds = body.excludedIds.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id)).slice(0, 40);
    if (Array.isArray(body.context)) context = body.context.filter((value): value is string => typeof value === 'string').slice(-3).map(value => value.slice(0, 160));
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (selectedId) {
    try {
      // A selected card already identifies the title. Re-running the AI search can change its spelling.
      const legacy = parseWatchCommand(input);
      const type = selectedType || (legacy.type !== 'all' ? legacy.type
        : await getSeriesDetail(selectedId).then(() => 'tv' as const).catch(() => 'movie' as const));
      if (type === 'movie') return NextResponse.json({ href: `/watch/movie/${selectedId}` });
      const season = selectedSeason ?? legacy.season ?? 1;
      const episode = selectedEpisode ?? legacy.episode;
      if (!episode) return NextResponse.json({ href: `/series/${selectedId}${selectedSeason !== undefined || legacy.season !== undefined ? `?season=${season}#episodes` : ''}` });
      const episodes = await getSeasonEpisodes(selectedId, season);
      const matched = episodes.find(entry => entry.episode_number === episode);
      if (!matched) return NextResponse.json({ message: `الحلقة ${episode} غير ظاهرة في الموسم ${season}. تأكد من رقمها وجرّب مرة ثانية.` });
      const airDate = resolveEpisodeAirDate(selectedId, season, episode, matched.air_date);
      if (episodeDateStatus(airDate, riyadhToday()) === 'upcoming') return NextResponse.json({ message: `الحلقة ${episode} ما صدرت بعد.` });
      return NextResponse.json({ href: `/watch/tv/${selectedId}/${season}/${episode}` });
    } catch {
      return NextResponse.json({ message: 'تعذّر فتح هذا الخيار الآن. جرّب الضغط عليه مرة ثانية.' });
    }
  }
  const access = await aiAccess(request);
  if (access === 'limited') {
    return NextResponse.json({ error: 'طلبات كثيرة الآن. جرّب بعد دقيقة.' }, { status: 429 });
  }
  const moreRecommendations = /^(?:غيرها|غيرهم|شي ثاني|شي غير|زيد|بعد|more|another)$/i.test(input);
  const recommend = isRecommendationRequest(input) || Boolean(recommendationContext && moreRecommendations);
  let command = recommend ? null : access === 'allowed'
    ? await interpretWatchCommand(input, context) ?? parseWatchCommand(input)
    : parseWatchCommand(input);
  if (command && command.title.length < 2 && command.episode !== undefined && context.length) {
    const previous = [...context].reverse().find(value => /(?:مسلسل|فيلم|series|show|movie|film)/i.test(value));
    const previousTitle = previous ? parseWatchCommand(previous).title : '';
    if (previousTitle.length >= 2) command = { ...command, title: previousTitle, type: 'tv', intent: 'watch' };
  }
  if (recommend || command?.intent === 'recommend') {
    try {
      const query = recommendationContext && moreRecommendations
        ? recommendationContext : input;
      const result = await getWatchRecommendations(query, excludedIds);
      if (!result.recommendations.length) return NextResponse.json({ message: 'قل لي وش جوّك أكثر: أكشن، كوميديا، رعب، أو شيء ثاني؟' });
      return NextResponse.json({ ...result, recommendationQuery: query });
    } catch {
      return NextResponse.json({ error: 'الترشيحات غير متاحة الآن. حاول مرة ثانية.' }, { status: 502 });
    }
  }
  if (command?.intent === 'chat') return NextResponse.json({ message: command.reply || 'هلا والله! قل لي وش تحب تشوف وأضبط لك فيلم أو مسلسل.' });
  if (command?.intent === 'clarify') return NextResponse.json({ message: command.reply || 'وش اسم العمل أو وش نوعه؟ أعطني كلمة منه وأدور لك.' });
  if (!command || command.title.length < 2) return NextResponse.json({ message: 'وش تبي تشوف؟ اكتب اسم الفيلم أو المسلسل، أو قل لي وش جوّك وأرشح لك.' });
  if (command.season !== undefined && (command.season < 0 || command.season > 99)
    || command.episode !== undefined && (command.episode < 1 || command.episode > 999)) {
    return NextResponse.json({ error: 'رقم الموسم أو الحلقة غير صحيح.' }, { status: 400 });
  }

  try {
    const rawTitle = parseWatchCommand(input).title;
    const terms = [command.title, ...(command.alternateTitles || []), ...(command.personHint ? [] : [rawTitle])];
    if (command.personHint && command.type === 'tv' && /^[a-z\s]+$/i.test(command.title)) {
      const variant = command.title.endsWith('s') ? command.title.slice(0, -1) : `${command.title}s`;
      if (variant.length >= 2) terms.push(variant);
    }
    const found = new Map<string, { item: TMDBTrending; rank: number }>();
    for (const term of [...new Set(terms.map(value => value.trim()).filter(value => value.length >= 2))].slice(0, 3)) {
      const results = command.type === 'tv' ? (await searchTV(term)).results
        : command.type === 'movie' ? (await searchMovies(term)).results : await searchMulti(term);
      results.forEach((item, index) => {
        const match = score(item, term);
        // TMDB can match an Arabic query while returning only an English display title.
        const rank = match > 0 ? match : /[\u0600-\u06ff]/.test(term) ? Math.max(20, 42 - index) : 0;
        const key = `${item.media_type}-${item.id}`;
        if (rank > (found.get(key)?.rank || 0)) found.set(key, { item, rank });
      });
      if (![...found.values()].some(result => result.rank >= 78) || /[\u0600-\u06ff]/.test(input)) continue;
      break;
    }
    let ranked = [...found.values()].sort((a, b) => b.rank - a.rank);
    if (!ranked.length) return NextResponse.json({ message: 'ما قدرت أحدد العمل من الاسم هذا. اكتب كلمة من عنوانه أو اسم ممثل فيه، وإذا تبي قل لي وش جوّك وأرشح لك.' });

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
      else return NextResponse.json({ message: 'لقيت أكثر من احتمال. أي واحد تقصد؟', choices: choices(ranked, command) });
    }

    const choice = ranked[0];
    if (!choice) return NextResponse.json({ message: 'اختر واحدًا من الخيارات، أو اكتب لي الاسم بشكل أوضح.' });
    if (choice.rank < 58 || ranked.length > 1 && ranked[1].rank >= 78 && ranked[1].rank >= choice.rank - 10) {
      return NextResponse.json({ message: 'تقصد أي واحد من هذي الأعمال؟', choices: choices(ranked, command) });
    }

    const item = choice.item;
    if (item.media_type === 'movie') return NextResponse.json({ href: `/watch/movie/${item.id}`, title: getTitle(item) });
    if (!command.episode) return NextResponse.json({ href: `/series/${item.id}${command.season !== undefined ? `?season=${command.season}#episodes` : ''}`, title: getTitle(item) });

    const season = command.season ?? 1;
    const episodes = await getSeasonEpisodes(item.id, season).catch(() => []);
    const matched = episodes.find(entry => entry.episode_number === command.episode);
    if (!matched) return NextResponse.json({ message: `ما ظهرت لي الحلقة ${command.episode} من الموسم ${season} في ${getTitle(item)}. تأكد من رقم الموسم أو الحلقة وقل لي.` });
    const airDate = resolveEpisodeAirDate(item.id, season, matched.episode_number, matched.air_date);
    if (episodeDateStatus(airDate, riyadhToday()) === 'upcoming') {
      return NextResponse.json({ message: `الحلقة ${command.episode} من ${getTitle(item)} لم تصدر بعد. تبي أفتح لك صفحة المسلسل وتشوف الحلقات المتاحة؟` });
    }
    return NextResponse.json({ href: `/watch/tv/${item.id}/${season}/${command.episode}`, title: getTitle(item) });
  } catch {
    return NextResponse.json({ error: 'البحث غير متاح الآن. حاول مرة ثانية.' }, { status: 502 });
  }
}
