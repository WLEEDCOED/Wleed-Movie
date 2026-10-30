import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveEpisodeAirDate } from './episode-dates';

test('uses Paramount+ Friday dates for the known Dexter season 2 TMDB mismatch', () => {
  assert.equal(resolveEpisodeAirDate(259909, 2, 1, '2026-11-01'), '2026-10-30');
  assert.equal(resolveEpisodeAirDate(259909, 2, 2, '2026-11-08'), '2026-11-06');
  assert.equal(resolveEpisodeAirDate(259909, 2, 10, '2027-01-03'), '2027-01-01');
});

test('keeps future TMDB schedule corrections and unrelated shows untouched', () => {
  assert.equal(resolveEpisodeAirDate(259909, 2, 1, '2026-10-31'), '2026-10-31');
  assert.equal(resolveEpisodeAirDate(153312, 4, 3, '2026-10-30'), '2026-10-30');
  assert.equal(resolveEpisodeAirDate(259909, 2, 1, null), null);
});
