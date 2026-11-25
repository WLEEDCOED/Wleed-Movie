import AdmZip from 'adm-zip';
import type { SubtitleSource, SubtitleSourceId } from './servers';
import { getMediaImdbId } from './tmdb';

type MediaType = 'movie' | 'tv';

interface SubtitleQuery {
  tmdbId: number;
  type: MediaType;
  season: number;
  episode: number;
}

interface SubdlFile {
  url?: string;
  language?: string;
  format?: string;
  season?: number | null;
  episode?: number | null;
}

interface SubdlSubtitle extends SubdlFile {
  subtitlePage?: string;
  full_season?: boolean;
  unpack_files?: SubdlFile[];
}

interface SubtitleCandidate {
  url: string;
  pageUrl?: string;
  episodeArchive?: boolean;
}

interface CachedSub {
  vtt: string;
  srt: string;
  hasSub: boolean;
  timestamp: number;
}

const SUBDL_API_KEY = process.env.SUBDL_API_KEY || '';
const SUBDL_DOWNLOAD_ORIGIN = 'https://dl.subdl.com';
const SEARCH_CACHE_SECONDS = 300;
const AVAILABLE_CACHE_MS = 24 * 60 * 60 * 1000;
const MAX_SUBTITLE_BYTES = 2 * 1024 * 1024;
const cache = new Map<string, CachedSub>();
const emptySubtitle = (timestamp: number): CachedSub => ({ vtt: '', srt: '', hasSub: false, timestamp });

function searchOptions(forceRefresh: boolean) {
  const signal = AbortSignal.timeout(6000);
  return forceRefresh ? { signal, cache: 'no-store' as const } : { signal, next: { revalidate: SEARCH_CACHE_SECONDS } };
}

function allowedUrl(value: string | undefined, base: string, allowed: (url: URL) => boolean): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    const url = new URL(value, base);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port && allowed(url)) return url.href;
  } catch { /* Ignore malformed links from the provider. */ }
}

async function searchSubdl(query: SubtitleQuery, forceRefresh: boolean): Promise<SubtitleCandidate[]> {
  if (!SUBDL_API_KEY || SUBDL_API_KEY === 'your_key') return [];
  const { tmdbId, type, season, episode } = query;
  const params = new URLSearchParams({
    api_key: SUBDL_API_KEY, tmdb_id: String(tmdbId), type, languages: 'AR', unpack: '1', subs_per_page: '30',
  });
  if (type === 'tv') {
    params.set('season_number', String(season));
    params.set('episode_number', String(episode));
  }

  const search = async (): Promise<SubdlSubtitle[]> => {
    const response = await fetch('https://api.subdl.com/api/v1/subtitles?' + params, searchOptions(forceRefresh));
    if (!response.ok) return [];
    const data = await response.json() as { subtitles?: SubdlSubtitle[] };
    return Array.isArray(data.subtitles) ? data.subtitles : [];
  };
  const collect = (rows: SubdlSubtitle[]) => {
    const candidates = new Map<string, SubtitleCandidate>();
    for (const row of rows) {
      if (row.language && row.language.toUpperCase() !== 'AR') continue;
      const exactEpisode = (file: SubdlFile) => Number(file.season) === season && Number(file.episode) === episode;
      const directFile = row.unpack_files?.find(file => file.url && (!file.language || file.language.toUpperCase() === 'AR') &&
        (!file.format || /^(srt|vtt)$/i.test(file.format)) && (type === 'movie' || exactEpisode(file)));
      const episodeArchive = type === 'tv' && !row.full_season && exactEpisode(row);
      if (type === 'tv' && !directFile && !episodeArchive) continue;

      const pageUrl = allowedUrl(row.subtitlePage, 'https://subdl.com', url => url.origin === 'https://subdl.com');
      for (const path of [directFile?.url, row.url]) {
        const url = allowedUrl(path, SUBDL_DOWNLOAD_ORIGIN, url => url.origin === SUBDL_DOWNLOAD_ORIGIN);
        if (url) candidates.set(url, { url, pageUrl, episodeArchive });
      }
    }
    return [...candidates.values()];
  };

  const exact = collect(await search());
  if (type !== 'tv' || exact.length) return exact;
  params.delete('episode_number');
  return collect(await search());
}

async function searchOpenSubtitles(query: SubtitleQuery, forceRefresh: boolean, imdbId: Promise<string | null>): Promise<SubtitleCandidate[]> {
  const imdb = await imdbId;
  if (!imdb) return [];
  const type = query.type === 'movie' ? 'movie' : 'series';
  const id = type === 'movie' ? imdb : [imdb, query.season, query.episode].join(':');
  const response = await fetch('https://opensubtitles-v3.strem.io/subtitles/' + type + '/' + id + '.json', searchOptions(forceRefresh));
  if (!response.ok) return [];
  const data = await response.json() as { subtitles?: { lang?: string; url?: string }[] };
  if (!Array.isArray(data.subtitles)) return [];

  return data.subtitles.flatMap(row => {
    if (!['ara', 'ar'].includes(row.lang?.toLowerCase() ?? '')) return [];
    const url = allowedUrl(row.url, 'https://opensubtitles-v3.strem.io', url =>
      /^subs\d*\.strem\.io$/.test(url.hostname) || url.hostname === 'opensubtitles-v3.strem.io');
    return url ? [{ url }] : [];
  });
}

async function findCandidates(query: SubtitleQuery, forceRefresh: boolean, source?: SubtitleSourceId, imdb?: Promise<string | null>) {
  const [subdl, opensubtitles] = await Promise.all([
    source === 'opensubtitles' ? [] : searchSubdl(query, forceRefresh).catch(() => []),
    source === 'subdl' ? [] : searchOpenSubtitles(query, forceRefresh,
      imdb ?? getMediaImdbId(query.tmdbId, query.type).catch(() => null)).catch(() => []),
  ]);
  return { subdl, opensubtitles };
}

export async function getArabicSubtitleSources(tmdbId: number, type: MediaType, season: number, episode: number, forceRefresh = false, imdbId?: Promise<string | null>): Promise<SubtitleSource[]> {
  const matches = await findCandidates({ tmdbId, type, season, episode }, forceRefresh, undefined, imdbId);
  const sources: SubtitleSource[] = [];
  if (matches.subdl.length) sources.push({ id: 'subdl', pageUrl: matches.subdl.find(item => item.pageUrl)?.pageUrl });
  if (matches.opensubtitles.length) sources.push({ id: 'opensubtitles' });
  return sources;
}

function episodeEntry(entries: AdmZip.IZipEntry[], query: SubtitleQuery, episodeArchive: boolean) {
  if (query.type !== 'tv') return entries[0];
  const { season, episode } = query;
  const seasonAndEpisode = new RegExp('(?:s0*' + season + '[ ._-]*e0*' + episode + '|0*' + season + 'x0*' + episode + ')(?!\\d)', 'i');
  const episodeOnly = new RegExp('(?:^|[^a-z0-9])(?:e|ep[. _-]?)0*' + episode + '(?!\\d)', 'i');
  return entries.find(entry => seasonAndEpisode.test(entry.entryName))
    ?? entries.find(entry => !/s\d+/i.test(entry.entryName) && episodeOnly.test(entry.entryName))
    ?? (episodeArchive && entries.length === 1 ? entries[0] : undefined);
}

export function normalizeArabicSubtitle(bytes: Uint8Array): { srt: string; vtt: string } | null {
  let text: string;
  const bom = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
  try { text = new TextDecoder(bom, { fatal: true }).decode(bytes); }
  catch { text = new TextDecoder('windows-1256').decode(bytes); }
  const timing = /^\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{3})\s+-->\s+((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{3})(?:\s+.*)?$/;
  const timestamp = (value: string) => {
    const parts = value.replace(',', '.').split(':');
    if (parts.length === 2) parts.unshift('00');
    return parts.map((part, index) => index === 0 ? part.padStart(2, '0') : part).join(':');
  };
  const cues = text.replace(/\r\n?/g, '\n').trim().split(/\n[ \t]*\n/).flatMap(block => {
    const lines = block.split('\n');
    if (/^(?:NOTE(?:\s|$)|STYLE$|REGION$)/.test(lines[0])) return [];
    const index = lines.findIndex(line => timing.test(line));
    const match = index >= 0 ? lines[index].match(timing) : null;
    const body = lines.slice(index + 1).join('\n').trim();
    return match && body ? [{ start: timestamp(match[1]), end: timestamp(match[2]), body }] : [];
  });
  if (!cues.some(cue => /[\u0621-\u064a]/.test(cue.body))) return null;
  return {
    srt: cues.map((cue, index) => (index + 1) + '\n' + cue.start.replace('.', ',') + ' --> ' + cue.end.replace('.', ',') + '\n' + cue.body).join('\n\n') + '\n',
    vtt: 'WEBVTT\n\n' + cues.map(cue => cue.start + ' --> ' + cue.end + '\n' + cue.body).join('\n\n') + '\n',
  };
}

async function readSubtitleFile(response: Response, query: SubtitleQuery, episodeArchive: boolean) {
  if (Number(response.headers.get('content-length')) > MAX_SUBTITLE_BYTES) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_SUBTITLE_BYTES) return null;
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return normalizeArabicSubtitle(bytes);

  const zip = new AdmZip(bytes);
  const entries = zip.getEntries().filter(entry => !entry.isDirectory && /\.(srt|vtt)$/i.test(entry.entryName) &&
    !entry.entryName.includes('__MACOSX') && entry.header.size <= MAX_SUBTITLE_BYTES);
  const entry = episodeEntry(entries, query, episodeArchive);
  return entry ? normalizeArabicSubtitle(entry.getData()) : null;
}

export async function fetchArabicSubtitle(tmdbId: number, type: MediaType = 'movie', season = 1, episode = 1, forceRefresh = false, source?: SubtitleSourceId): Promise<CachedSub> {
  const key = [type, tmdbId, season, episode, source ?? 'any'].join(':');
  const now = Date.now();
  const cached = cache.get(key);
  if (!forceRefresh && cached && now - cached.timestamp < AVAILABLE_CACHE_MS) return cached;

  const query = { tmdbId, type, season, episode };
  const matches = await findCandidates(query, forceRefresh, source);
  for (const provider of ['subdl', 'opensubtitles'] as const) {
    for (const candidate of matches[provider].slice(0, 4)) {
      try {
        const response = await fetch(candidate.url, {
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(6500),
          headers: provider === 'subdl' ? { 'x-api-key': SUBDL_API_KEY } : undefined,
        });
        if (response.status === 429) break;
        if (!response.ok) continue;
        const subtitle = await readSubtitleFile(response, query, candidate.episodeArchive ?? false);
        if (subtitle) {
          const result = { ...subtitle, hasSub: true, timestamp: now };
          if (cache.size >= 200) {
            const oldest = cache.keys().next().value;
            if (oldest) cache.delete(oldest);
          }
          cache.set(key, result);
          return result;
        }
      } catch { /* A broken file should not prevent trying another match. */ }
    }
  }
  return emptySubtitle(now);
}
