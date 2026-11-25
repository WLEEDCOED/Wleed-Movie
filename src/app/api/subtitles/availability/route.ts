import { getArabicSubtitleSources } from '@/lib/subtitles-helper';
import { getMediaImdbId } from '@/lib/tmdb';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = Number(params.get('tmdbId'));
  const season = Number(params.get('season') ?? -1);
  const episodes = [...new Set((params.get('episodes') ?? '').split(',').map(Number))];
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(season) || season < 0 ||
      !episodes.length || episodes.length > 4 || episodes.some(episode => !Number.isSafeInteger(episode) || episode < 1)) {
    return Response.json({ error: 'Invalid subtitle lookup' }, { status: 400 });
  }

  const imdbId = getMediaImdbId(id, 'tv').catch(() => null);
  const results = await Promise.all(episodes.map(async episode => ({
    episode,
    sources: await getArabicSubtitleSources(id, 'tv', season, episode, false, imdbId),
  })));
  return Response.json({ available: results.filter(result => result.sources.length).map(result => result.episode) }, {
    headers: { 'Cache-Control': 'private, max-age=120' },
  });
}
