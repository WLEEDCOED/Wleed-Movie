import { NextRequest, NextResponse } from 'next/server';
import { fetchArabicSubtitle } from '@/lib/subtitles-helper';

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
  const isCheck = searchParams.get('check') === 'true';

  if (!tmdbId) {
    return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });
  }

  const subData = await fetchArabicSubtitle(parseInt(tmdbId), type, season, episode);

  if (isCheck) {
    return NextResponse.json(
      { hasSub: subData.hasSub },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  }

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
