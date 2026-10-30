import AdmZip from 'adm-zip';

export interface CachedSub {
  vtt: string;
  srt: string;
  hasSub: boolean;
  timestamp: number;
}

interface SubdlFile {
  url?: string;
  season?: number | null;
  episode?: number | null;
}

interface SubdlSubtitle {
  url?: string;
  season?: number | null;
  episode?: number | null;
  full_season?: boolean;
  unpack_files?: SubdlFile[];
}

const cache = new Map<string, CachedSub>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // Keep available subtitles for 24 hours.
const MISSING_CACHE_TTL = 1000 * 60 * 5; // Check newly released subtitles again after 5 minutes.

const SUBDL_API_KEY = process.env.SUBDL_API_KEY || '';

export function convertSrtToVtt(srt: string): string {
  const normalized = srt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const vttTimestamps = normalized.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${vttTimestamps.trim()}`;
}

function findBestEntry(entries: AdmZip.IZipEntry[], isTv: boolean, season?: number, episode?: number): AdmZip.IZipEntry | null {
  const srtEntries = entries.filter((e) => {
    const name = e.entryName.toLowerCase();
    return (name.endsWith('.srt') || name.endsWith('.vtt')) && !name.includes('__macosx');
  });

  if (srtEntries.length === 0) return null;
  if (!isTv || srtEntries.length === 1) return srtEntries[0];

  const sStr = season ? String(season).padStart(2, '0') : '';
  const eStr = episode ? String(episode).padStart(2, '0') : '';

  // 1. Look for SxxExx
  if (sStr && eStr) {
    const match = srtEntries.find((e) => {
      const name = e.entryName.toLowerCase();
      return name.includes(`s${sStr}e${eStr}`) || name.includes(`${season}x${eStr}`) || name.includes(`${season}x${episode}`);
    });
    if (match) return match;
  }

  // 2. Look for Exx
  if (eStr) {
    const match = srtEntries.find((e) => {
      const name = e.entryName.toLowerCase();
      return name.includes(`e${eStr}`) || name.includes(`ep${eStr}`) || name.includes(`ep.${eStr}`) || name.includes(` ${eStr}.`) || name.includes(`_${eStr}.`);
    });
    if (match) return match;
  }

  return srtEntries[0];
}

export async function fetchArabicSubtitle(
  tmdbId: number,
  type: 'movie' | 'tv' = 'movie',
  season = 1,
  episode = 1,
  forceRefresh = false
): Promise<CachedSub> {
  const cacheKey = `${type}-${tmdbId}-${type === 'tv' ? `${season}-${episode}` : ''}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (!forceRefresh && cached && now - cached.timestamp < (cached.hasSub ? CACHE_TTL : MISSING_CACHE_TTL)) {
    return cached;
  }

  try {
    let subdlUrl = `https://api.subdl.com/api/v1/subtitles?api_key=${SUBDL_API_KEY}&tmdb_id=${tmdbId}&type=${type}&languages=ar&unpack=1`;
    if (type === 'tv') {
      subdlUrl += `&season_number=${season}&episode_number=${episode}`;
    }

    const fetchOptions = forceRefresh ? { cache: 'no-store' as const } : { next: { revalidate: 300 } };
    const res = await fetch(subdlUrl, fetchOptions);
    const data = await res.json();

    let subtitles: SubdlSubtitle[] = data.subtitles || [];

    // A season-only search can find packs, but results for other episodes must never be used.
    if (type === 'tv' && subtitles.length === 0) {
      const fallbackRes = await fetch(`https://api.subdl.com/api/v1/subtitles?api_key=${SUBDL_API_KEY}&tmdb_id=${tmdbId}&type=tv&languages=ar&season_number=${season}&unpack=1&subs_per_page=30`, fetchOptions);
      const fallbackData = await fallbackRes.json();
      subtitles = fallbackData.subtitles || [];
    }

    const selectedSub = type === 'tv'
      ? subtitles.find((sub) => !sub.full_season && Number(sub.season) === season && Number(sub.episode) === episode)
        || subtitles.find((sub) => sub.full_season && sub.unpack_files?.some((file) => Number(file.season) === season && Number(file.episode) === episode && file.url))
      : subtitles[0];
    const selectedFile = selectedSub?.full_season
      ? selectedSub.unpack_files?.find((file) => Number(file.season) === season && Number(file.episode) === episode && file.url)
      : null;

    if (!selectedSub || !(selectedFile?.url || selectedSub.url)) {
      const emptyResult: CachedSub = {
        vtt: '',
        srt: '',
        hasSub: false,
        timestamp: now,
      };
      cache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    const subtitleUrl = selectedFile?.url || selectedSub.url!;
    const dlUrl = `https://dl.subdl.com${subtitleUrl}`;

    const dlRes = await fetch(dlUrl);
    if (!dlRes.ok) {
      throw new Error(`Failed to download subtitle zip: ${dlRes.status}`);
    }

    let rawSrt: string;
    if (/\.(srt|vtt)(?:\?|$)/i.test(subtitleUrl)) {
      rawSrt = await dlRes.text();
    } else {
      const zip = new AdmZip(Buffer.from(await dlRes.arrayBuffer()));
      const entry = findBestEntry(zip.getEntries(), type === 'tv', season, episode);
      if (!entry) throw new Error('No .srt entry found in zip');
      rawSrt = entry.getData().toString('utf-8');
    }
    const vtt = convertSrtToVtt(rawSrt);

    const result: CachedSub = {
      vtt,
      srt: rawSrt,
      hasSub: true,
      timestamp: now,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error in fetchArabicSubtitle:', err);
    const failResult: CachedSub = {
      vtt: '',
      srt: '',
      hasSub: false,
      timestamp: now,
    };
    return failResult;
  }
}
