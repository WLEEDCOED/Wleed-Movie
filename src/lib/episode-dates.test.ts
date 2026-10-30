import assert from 'node:assert/strict';
import test from 'node:test';
import { episodeDateStatus, resolveEpisodeAirDate, riyadhToday } from './episode-dates';

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

test('nearby future dates allow checking playback without marking episodes released', () => {
  assert.equal(episodeDateStatus('2026-11-01', '2026-10-30'), 'check');
  assert.equal(episodeDateStatus('2026-11-02', '2026-10-30'), 'check');
  assert.equal(episodeDateStatus('2026-11-03', '2026-10-30'), 'upcoming');
  assert.equal(episodeDateStatus('2026-10-30', '2026-10-30'), 'released');
  assert.equal(episodeDateStatus('2026-11-03', '2026-10-30', true), 'released');
});

test('missing or invalid air dates never falsely block an episode', () => {
  assert.equal(episodeDateStatus(null, '2026-10-30'), 'unknown');
  assert.equal(episodeDateStatus('2026-02-30', '2026-10-30'), 'unknown');
});

test('Riyadh date follows the local midnight, not UTC midnight', () => {
  assert.equal(riyadhToday(new Date('2026-10-29T20:59:59Z')), '2026-10-29');
  assert.equal(riyadhToday(new Date('2026-10-29T21:00:00Z')), '2026-10-30');
});
