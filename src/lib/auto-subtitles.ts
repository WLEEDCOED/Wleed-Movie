export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface SubdlSubtitleFile {
  season?: number | null;
  episode?: number | null;
  language?: string;
  file_n_id?: string;
  url?: string;
}

export interface SubdlSubtitleEntry {
  season?: number | null;
  episode?: number | null;
  language?: string;
  lang?: string;
  hi?: boolean;
  full_season?: boolean;
  url?: string;
  unpack_files?: SubdlSubtitleFile[];
}

const SOURCE_LANGUAGES = ['EN', 'ES', 'TR'];

export function selectSourceSubtitle(
  entries: SubdlSubtitleEntry[],
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1,
): { url: string; language: string } | null {
  const candidates = entries.flatMap(entry => {
    const files = entry.unpack_files?.length ? entry.unpack_files : [entry];
    return files.flatMap(file => {
      if (mediaType === 'tv' && (Number(file.season ?? entry.season) !== season || Number(file.episode ?? entry.episode) !== episode)) return [];
      const language = (file.language || entry.language || entry.lang || '').toUpperCase();
      if (!SOURCE_LANGUAGES.includes(language) || !file.url) return [];
      return [{ url: file.url, language, hi: Boolean(entry.hi), pack: Boolean(entry.full_season) }];
    });
  });
  candidates.sort((a, b) => Number(a.hi) - Number(b.hi)
    || Number(a.pack) - Number(b.pack)
    || SOURCE_LANGUAGES.indexOf(a.language) - SOURCE_LANGUAGES.indexOf(b.language));
  const best = candidates[0];
  return best ? { url: best.url, language: best.language.toLowerCase() } : null;
}

function parseTime(value: string): number | null {
  const parts = value.replace(',', '.').split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const seconds = Number(parts.pop());
  const minutes = Number(parts.pop());
  const hours = parts.length ? Number(parts.pop()) : 0;
  if (![seconds, minutes, hours].every(Number.isFinite) || seconds < 0 || seconds >= 60 || minutes < 0 || minutes >= 60 || hours < 0) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseTimedSubtitles(raw: string): SubtitleCue[] {
  const blocks = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const timeIndex = lines.findIndex(line => line.includes('-->'));
    if (timeIndex < 0) continue;
    const match = lines[timeIndex].match(/(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}/);
    if (!match) continue;
    const [startRaw, endRaw] = match[0].split(/\s*-->\s*/);
    const start = parseTime(startRaw);
    const end = parseTime(endRaw);
    if (start === null || end === null || end <= start) continue;
    const text = lines.slice(timeIndex + 1).join('\n')
      .replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (text) cues.push({ start, end, text });
    if (cues.length >= 4000) break;
  }
  return cues.sort((a, b) => a.start - b.start);
}

export function activeSubtitle(cues: SubtitleCue[], seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle].start <= seconds) low = middle + 1;
    else high = middle - 1;
  }
  const cue = cues[high];
  return cue && seconds < cue.end ? cue.text : '';
}
