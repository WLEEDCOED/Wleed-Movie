import { NextRequest, NextResponse } from 'next/server';
import { fetchArabicSubtitle, getArabicSubtitleSources } from '@/lib/subtitles-helper';

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
  const tmdbId = Number(searchParams.get('tmdbId'));
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  const season = Number(searchParams.get('season') ?? 1);
  const episode = Number(searchParams.get('episode') ?? 1);
  const format = searchParams.get('format') === 'srt' ? 'srt' : 'vtt';
  const isDownload = searchParams.get('download') === 'true' || searchParams.get('download') === '1';
  const isCheck = searchParams.get('check') === 'true';
  const forceRefresh = searchParams.get('refresh') === 'true' && isCheck;
  const requestedSource = searchParams.get('source');
  const source = requestedSource === 'subdl' || requestedSource === 'opensubtitles' ? requestedSource : undefined;

  if (!Number.isSafeInteger(tmdbId) || tmdbId < 1 || !Number.isSafeInteger(season) || season < 0 ||
      !Number.isSafeInteger(episode) || episode < 1 || (requestedSource && !source)) {
    return NextResponse.json({ error: 'Invalid subtitle request' }, { status: 400 });
  }

  if (isCheck) {
    const sources = await getArabicSubtitleSources(tmdbId, type, season, episode, forceRefresh);
    return NextResponse.json(
      { hasSub: sources.length > 0, sources },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const subData = await fetchArabicSubtitle(tmdbId, type, season, episode, false, source);
  if (!subData.hasSub) {
    if (isDownload) return new NextResponse('تعذّر تنزيل ملف الترجمة حاليًا. جرّب مصدرًا آخر من صفحة المشاهدة.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
    return new NextResponse('WEBVTT\n\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'no-store',
      },
    });
  }

  const content = format === 'srt' ? subData.srt : subData.vtt;
  const contentType = format === 'srt' ? 'text/plain; charset=utf-8' : 'text/vtt; charset=utf-8';
  const fileName = `subtitle-${type}-${tmdbId}${type === 'tv' ? `-s${season}e${episode}` : ''}${source ? `-${source}` : ''}.${format}`;

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
