import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeArabicSubtitle } from './subtitles-helper';

test('normalizes Arabic WebVTT with short timestamps to valid SRT and VTT', () => {
  const bytes = new TextEncoder().encode('WEBVTT\n\ncue-name\n01:02.003 --> 01:03.004 align:start\nمرحبًا\n');
  const subtitle = normalizeArabicSubtitle(bytes);
  assert.equal(subtitle?.srt, '1\n00:01:02,003 --> 00:01:03,004\nمرحبًا\n');
  assert.equal(subtitle?.vtt, 'WEBVTT\n\n00:01:02.003 --> 00:01:03.004\nمرحبًا\n');
});

test('preserves Arabic from Windows-1256 subtitles', () => {
  const bytes = Buffer.concat([
    Buffer.from('1\r\n00:00:01,000 --> 00:00:02,000\r\n'),
    Buffer.from([0xe3, 0xd1, 0xcd, 0xc8, 0xc7]),
  ]);
  assert.equal(normalizeArabicSubtitle(bytes)?.srt, '1\n00:00:01,000 --> 00:00:02,000\nمرحبا\n');
});

test('rejects non-Arabic cues and error pages', () => {
  assert.equal(normalizeArabicSubtitle(Buffer.from('1\n00:00:01,000 --> 00:00:02,000\nHello\n')), null);
  assert.equal(normalizeArabicSubtitle(Buffer.from('<p>خطأ</p>')), null);
});
