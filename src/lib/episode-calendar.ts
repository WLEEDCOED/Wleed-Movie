import { episodeDateStatus, resolveEpisodeAirDate } from './episode-dates';
import type { TMDBEpisodeSchedule, TMDBSeriesSchedule } from './tmdb';

export const RECENT_EPISODE_DAYS = 14;

export interface CalendarEpisode {
  seriesId: number;
  seriesName: string;
  season: number;
  episode: number;
  name: string;
  airDate: string;
}

export function recentEpisodeStart(today: string): string {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (RECENT_EPISODE_DAYS - 1));
  return start.toISOString().slice(0, 10);
}

export function calendarEpisode(
  seriesId: number,
  seriesName: string,
  info: TMDBEpisodeSchedule,
  today: string,
  since: string,
): CalendarEpisode | null {
  if (!Number.isSafeInteger(info.season_number) || info.season_number < 1 ||
      !Number.isSafeInteger(info.episode_number) || info.episode_number < 1) return null;
  const airDate = resolveEpisodeAirDate(seriesId, info.season_number, info.episode_number, info.air_date);
  if (!airDate || airDate < since || episodeDateStatus(airDate, today) === 'unknown') return null;
  return {
    seriesId,
    seriesName,
    season: info.season_number,
    episode: info.episode_number,
    name: info.name || `Episode ${info.episode_number}`,
    airDate,
  };
}

export function calendarSeasonNumbers(series: TMDBSeriesSchedule, recentStart: string): number[] {
  const seasons = series.seasons.filter(season => season.season_number > 0 && season.episode_count > 0);
  const numbers = new Set(seasons.filter(season => season.air_date && season.air_date >= recentStart)
    .map(season => season.season_number));
  const latestEarlierSeason = seasons.filter(season => season.air_date && season.air_date < recentStart)
    .sort((a, b) => (b.air_date ?? '').localeCompare(a.air_date ?? '') || b.season_number - a.season_number)[0];
  const latestSeason = seasons.slice().sort((a, b) => b.season_number - a.season_number)[0];
  const last = series.last_episode_to_air;
  const next = series.next_episode_to_air;
  const finished = series.status === 'Ended' || series.status === 'Canceled';

  if (latestEarlierSeason && (!finished || !last?.air_date || last.air_date >= recentStart)) {
    numbers.add(latestEarlierSeason.season_number);
  }
  if (!finished && latestSeason && !latestSeason.air_date) numbers.add(latestSeason.season_number);
  if (last && last.season_number > 0 && (!last.air_date || last.air_date >= recentStart)) numbers.add(last.season_number);
  if (next && next.season_number > 0) numbers.add(next.season_number);

  return [...numbers];
}
