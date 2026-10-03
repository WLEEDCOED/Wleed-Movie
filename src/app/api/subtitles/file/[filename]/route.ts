import { NextRequest, NextResponse } from 'next/server';
import { fetchArabicSubtitle } from '@/lib/subtitles-helper';

interface RouteParams {
  params: Promise<{ filename: string }>;
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { filename } = await params;

  // Pattern: movie-550.vtt OR tv-1396-1-1.vtt
  const cleanName = filename.toLowerCase();
  let type: 'movie' | 'tv' = 'movie';
  let tmdbId = 0;
  let season = 1;
  let episode = 1;

  if (cleanName.startsWith('movie-')) {
    type = 'movie';
    const match = cleanName.match(/movie-(\d+)\.(vtt|srt)/);
    if (match) tmdbId = parseInt(match[1]);
  } else if (cleanName.startsWith('tv-')) {
    type = 'tv';
    const match = cleanName.match(/tv-(\d+)-(\d+)-(\d+)\.(vtt|srt)/);
    if (match) {
      tmdbId = parseInt(match[1]);
      season = parseInt(match[2]);
      episode = parseInt(match[3]);
    }
  }

  if (!tmdbId) {
    return new NextResponse('WEBVTT\n\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const subData = await fetchArabicSubtitle(tmdbId, type, season, episode);

  if (!subData.hasSub) {
    return new NextResponse('WEBVTT\n\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  const format = cleanName.endsWith('.srt') ? 'srt' : 'vtt';
  const content = format === 'srt' ? subData.srt : subData.vtt;
  const contentType = format === 'srt' ? 'text/plain; charset=utf-8' : 'text/vtt; charset=utf-8';

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
    },
  });
}
