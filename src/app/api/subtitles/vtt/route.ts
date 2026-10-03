import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

// In-memory cache for fast repeated responses
interface CachedSub {
  vtt: string;
  srt: string;
  timestamp: number;
}
const cache = new Map<string, CachedSub>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const SUBDL_API_KEY = process.env.SUBDL_API_KEY || 'subdl_REDACTED';

function convertSrtToVtt(srt: string): string {
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

  // 1. Look for SxxExx or sxxexx
  if (sStr && eStr) {
    const match = srtEntries.find((e) => {
      const name = e.entryName.toLowerCase();
      return name.includes(`s${sStr}e${eStr}`) || name.includes(`${season}x${eStr}`) || name.includes(`${season}x${episode}`);
    });
    if (match) return match;
  }

  // 2. Look for Exx or episode number
  if (eStr) {
    const match = srtEntries.find((e) => {
      const name = e.entryName.toLowerCase();
      return name.includes(`e${eStr}`) || name.includes(`ep${eStr}`) || name.includes(`ep.${eStr}`) || name.includes(` ${eStr}.`) || name.includes(`_${eStr}.`);
    });
    if (match) return match;
  }

  return srtEntries[0];
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tmdbId = searchParams.get('tmdbId');
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : 1;
  const episode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!) : 1;
  const format = searchParams.get('format') === 'srt' ? 'srt' : 'vtt';
  const isDownload = searchParams.get('download') === 'true' || searchParams.get('download') === '1';

  if (!tmdbId) {
    return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });
  }

  const cacheKey = `${type}-${tmdbId}-${type === 'tv' ? `${season}-${episode}` : ''}`;
  const now = Date.now();

  let subData = cache.get(cacheKey);

  if (!subData || now - subData.timestamp > CACHE_TTL) {
    try {
      let subdlUrl = `https://api.subdl.com/api/v1/subtitles?api_key=${SUBDL_API_KEY}&tmdb_id=${tmdbId}&type=${type}&languages=ar`;
      if (type === 'tv') {
        subdlUrl += `&season_number=${season}&episode_number=${episode}`;
      }

      const res = await fetch(subdlUrl, { next: { revalidate: 86400 } });
      const data = await res.json();

      let subtitles = data.subtitles || [];

      // If TV search with season/episode gave 0 results, retry without season/episode to get full season packs
      if (type === 'tv' && subtitles.length === 0) {
        const fallbackRes = await fetch(`https://api.subdl.com/api/v1/subtitles?api_key=${SUBDL_API_KEY}&tmdb_id=${tmdbId}&type=tv&languages=ar`);
        const fallbackData = await fallbackRes.json();
        subtitles = fallbackData.subtitles || [];
      }

      if (subtitles.length === 0) {
        // Return minimal valid WebVTT if no subtitle found so players don't crash
        const emptyVtt = 'WEBVTT\n\n';
        return new NextResponse(emptyVtt, {
          status: 200,
          headers: {
            'Content-Type': 'text/vtt; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // Pick the first/best subtitle entry
      const selectedSub = subtitles[0];
      const dlUrl = `https://dl.subdl.com${selectedSub.url}`;

      const dlRes = await fetch(dlUrl);
      if (!dlRes.ok) {
        throw new Error(`Failed to download subtitle zip: ${dlRes.status}`);
      }

      const arrayBuf = await dlRes.arrayBuffer();
      const zip = new AdmZip(Buffer.from(arrayBuf));
      const entry = findBestEntry(zip.getEntries(), type === 'tv', season, episode);

      if (!entry) {
        throw new Error('No .srt or .vtt entry found in zip');
      }

      const rawSrt = entry.getData().toString('utf-8');
      const vtt = convertSrtToVtt(rawSrt);

      subData = {
        vtt,
        srt: rawSrt,
        timestamp: now,
      };

      cache.set(cacheKey, subData);
    } catch (err) {
      console.error('Subtitle fetch error:', err);
      return new NextResponse('WEBVTT\n\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/vtt; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    }
  }

  const content = format === 'srt' ? subData.srt : subData.vtt;
  const contentType = format === 'srt' ? 'text/plain; charset=utf-8' : 'text/vtt; charset=utf-8';
  const fileName = `subtitle-${type}-${tmdbId}${type === 'tv' ? `-s${season}e${episode}` : ''}.${format}`;

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
  };

  if (isDownload) {
    headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
  }

  return new NextResponse(content, {
    status: 200,
    headers,
  });
}
