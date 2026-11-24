import { calendarEpisode, calendarSeasonNumbers, recentEpisodeStart, type CalendarEpisode } from '@/lib/episode-calendar';
import { riyadhToday } from '@/lib/episode-dates';
import { getSeasonSchedule, getSeriesSchedule, type TMDBEpisodeSchedule } from '@/lib/tmdb';

export async function GET(_request: Request, { params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!/^\d+$/.test(tmdbId) || !Number.isSafeInteger(id) || id < 1) {
    return Response.json({ error: 'Invalid series ID' }, { status: 400 });
  }

  try {
    const today = riyadhToday();
    const since = recentEpisodeStart(today);
    const series = await getSeriesSchedule(id);
    const seriesName = series.name || series.original_name || 'Series';
    const episodes = new Map<string, CalendarEpisode>();
    const add = (episode: TMDBEpisodeSchedule) => {
      const scheduled = calendarEpisode(id, seriesName, episode, today, since);
      if (scheduled) episodes.set(`${scheduled.season}:${scheduled.episode}`, scheduled);
    };

    if (series.last_episode_to_air) add(series.last_episode_to_air);
    if (series.next_episode_to_air) add(series.next_episode_to_air);

    const results = await Promise.allSettled(calendarSeasonNumbers(series, since).map(season => getSeasonSchedule(id, season)));
    for (const result of results) {
      if (result.status === 'fulfilled') result.value.forEach(add);
    }

    const incomplete = results.some(result => result.status === 'rejected');
    return Response.json({ episodes: [...episodes.values()], incomplete }, {
      headers: { 'Cache-Control': incomplete ? 'no-store' : 'private, max-age=300' },
    });
  } catch {
    return Response.json({ error: 'Episode schedule unavailable' }, { status: 502 });
  }
}
