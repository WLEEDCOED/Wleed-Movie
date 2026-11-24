import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarEpisode, calendarSeasonNumbers, recentEpisodeStart } from './episode-calendar';
import type { TMDBSeason, TMDBSeriesSchedule } from './tmdb';

test('uses the rolling window and the same release date corrections as the episode guide', () => {
  const today = '2026-11-24';
  const since = recentEpisodeStart(today);
  const episode = { season_number: 2, episode_number: 5, name: 'Episode 5', air_date: '2026-11-29' };

  assert.equal(since, '2026-11-11');
  assert.equal(recentEpisodeStart('2027-01-03'), '2026-12-21');
  assert.equal(calendarEpisode(259909, 'Dexter', episode, today, since)?.airDate, '2026-11-27');
  assert.equal(calendarEpisode(1, 'Series', { ...episode, air_date: since }, today, since)?.airDate, since);
  assert.equal(calendarEpisode(1, 'Series', { ...episode, air_date: '2026-11-10' }, today, since), null);
  assert.equal(calendarEpisode(1, 'Series', { ...episode, air_date: '2026-11-31' }, today, since), null);
});

test('keeps the current season and upcoming season across a season boundary', () => {
  const season = (number: number, airDate: string | null): TMDBSeason => ({
    season_number: number, air_date: airDate, episode_count: 8, name: '', overview: '', poster_path: null,
  });
  const schedule: TMDBSeriesSchedule = {
    name: 'Series', status: 'Returning Series',
    seasons: [season(0, '2026-11-18'), season(1, '2025-01-01'), season(2, '2026-10-30'), season(3, null)],
    last_episode_to_air: { season_number: 2, episode_number: 5, name: '', air_date: '2026-11-20' },
    next_episode_to_air: { season_number: 3, episode_number: 1, name: '', air_date: '2026-12-07' },
  };

  assert.deepEqual(calendarSeasonNumbers(schedule, '2026-11-11'), [2, 3]);
  assert.deepEqual(calendarSeasonNumbers({ ...schedule, status: 'Ended', next_episode_to_air: null }, '2027-01-01'), []);
});
