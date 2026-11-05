import { createHash, createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSeasonEpisodes } from '@/lib/tmdb';
import { translateEpisodeOverview } from '@/lib/episode-overview-translation';
import { analyticsConfigured, getRedis } from '@/lib/site-analytics';
import { isSameOrigin } from '@/lib/request-origin';

const CACHE_SECONDS = 30 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let tmdbId: number;
  let season: number;
  let episode: number;
  try {
    const body = await request.json() as Record<string, unknown>;
    tmdbId = body.tmdbId as number;
    season = body.season as number;
    episode = body.episode as number;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0 || !Number.isInteger(season) || season < 0 || season > 99
    || !Number.isInteger(episode) || episode < 1 || episode > 999) {
    return NextResponse.json({ error: 'Invalid episode' }, { status: 400 });
  }

  try {
    const episodes = await getSeasonEpisodes(tmdbId, season);
    const selected = episodes.find(item => item.episode_number === episode);
    if (!selected) return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    if (!selected.sourceOverview) {
      return NextResponse.json({ overview: selected.overview });
    }
    if (!analyticsConfigured()) return NextResponse.json({ error: 'Translation is unavailable' }, { status: 503 });

    const redis = getRedis();
    const sourceHash = createHash('sha256').update(selected.sourceOverview).digest('hex').slice(0, 20);
    const cacheKey = `wm:episode-overview:ar:v1:${tmdbId}:${season}:${episode}:${sourceHash}`;
    const cached = await redis.get<string>(cacheKey);
    if (cached) return NextResponse.json({ overview: cached });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.HUMAIN_NODE_API_KEY || '';
    const visitor = createHmac('sha256', secret).update(ip).digest('hex').slice(0, 24);
    const hour = Math.floor(Date.now() / 3_600_000);
    const [visitorCount, totalCount] = await Promise.all([
      redis.incr(`wm:episode-overview:hour:${hour}:${visitor}`),
      redis.incr(`wm:episode-overview:hour:${hour}:total`),
    ]);
    if (visitorCount === 1) await redis.expire(`wm:episode-overview:hour:${hour}:${visitor}`, 7200);
    if (totalCount === 1) await redis.expire(`wm:episode-overview:hour:${hour}:total`, 7200);
    if (visitorCount > 30 || totalCount > 500) {
      return NextResponse.json({ error: 'Translation limit reached' }, { status: 429 });
    }

    const translated = await translateEpisodeOverview(selected.sourceOverview);
    if (!translated) return NextResponse.json({ error: 'Translation is unavailable' }, { status: 503 });
    await redis.set(cacheKey, translated, { ex: CACHE_SECONDS });
    return NextResponse.json({ overview: translated });
  } catch {
    return NextResponse.json({ error: 'Episode overview is unavailable' }, { status: 502 });
  }
}
