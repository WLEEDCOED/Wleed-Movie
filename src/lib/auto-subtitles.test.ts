import assert from 'node:assert/strict';
import test from 'node:test';
import { activeSubtitle, parseTimedSubtitles, selectSourceSubtitle } from './auto-subtitles';

test('selects the exact TV episode, including a season pack file', () => {
  const selected = selectSourceSubtitle([
    { season: 1, episode: 2, language: 'EN', url: '/wrong.srt' },
    { season: 1, episode: 1, full_season: true, language: 'EN', unpack_files: [
      { season: 1, episode: 2, language: 'EN', url: '/wrong-pack.srt' },
      { season: 1, episode: 3, language: 'ES', url: '/right.srt' },
    ] },
  ], 'tv', 1, 3);
  assert.deepEqual(selected, { url: '/right.srt', language: 'es' });
});

test('rejects foreign languages and wrong episodes', () => {
  assert.equal(selectSourceSubtitle([{ season: 2, episode: 1, language: 'EN', url: '/wrong.srt' }], 'tv', 2, 2), null);
  assert.equal(selectSourceSubtitle([{ language: 'FR', url: '/wrong.srt' }], 'movie'), null);
});

test('parses SRT and VTT timing and follows seeks', () => {
  const cues = parseTimedSubtitles('1\n00:00:01,000 --> 00:00:02,500\n<i>Hello</i>\nworld\n\n00:00:10.000 --> 00:00:11.000\nمرحبا');
  assert.deepEqual(cues, [
    { start: 1, end: 2.5, text: 'Hello\nworld' },
    { start: 10, end: 11, text: 'مرحبا' },
  ]);
  assert.equal(activeSubtitle(cues, 1.5), 'Hello\nworld');
  assert.equal(activeSubtitle(cues, 5), '');
  assert.equal(activeSubtitle(cues, 10.5), 'مرحبا');
  assert.equal(activeSubtitle(cues, 2.5), '');
});
