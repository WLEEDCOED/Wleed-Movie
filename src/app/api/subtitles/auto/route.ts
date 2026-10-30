import AdmZip from 'adm-zip';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { parseTimedSubtitles, selectSourceSubtitle, type SubdlSubtitleEntry, type SubtitleCue } from '@/lib/auto-subtitles';
import { analyticsConfigured, getRedis } from '@/lib/site-analytics';
import { isSameOrigin } from '@/lib/request-origin';

export const dynamic = 'force-dynamic';

const LANGUAGES = ['en', 'es', 'tr'];
const SUBDL_ORIGIN = 'https://dl.subdl.com';

class SubtitleQuotaError extends Error {}

function translatorUrl(): URL | null {
  if (process.env.AUTO_TRANSLATE_ENABLED !== 'true' || !process.env.LIBRETRANSLATE_URL) return null;
  try {
    const url = new URL(process.env.LIBRETRANSLATE_URL);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && url.hostname === 'localhost')) return null;
    url.pathname = `${url.pathname.replace(/\/$/, '')}/translate`;
    return url;
  } catch {
    return null;
  }
}

function titleRequest(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tmdbId = Number(params.get('tmdbId'));
  const mediaType = params.get('type');
  const season = Number(params.get('season') ?? 1);
  const episode = Number(params.get('episode') ?? 1);
  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0 || !['movie', 'tv'].includes(mediaType || '')
    || !Number.isSafeInteger(season) || season < 1 || season > 100
    || !Number.isSafeInteger(episode) || episode < 1 || episode > 1000) return null;
  return { tmdbId, mediaType: mediaType as 'movie' | 'tv', season, episode };
}

async function searchSource(tmdbId: number, mediaType: 'movie' | 'tv', season: number, episode: number) {
  const key = process.env.SUBDL_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({ tmdb_id: String(tmdbId), type: mediaType, languages: LANGUAGES.join(','), unpack: '1', subs_per_page: '30' });
  if (mediaType === 'tv') {
    params.set('season', String(season));
    params.set('episode', String(episode));
  }
  const fetchResults = async () => {
    const response = await fetch(`https://api.subdl.com/api/v2/subtitles/search?${params}`, {
      headers: { Authorization: `Bearer ${key}` }, cache: 'no-store', signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('Subtitle search unavailable');
    const data = await response.json() as { subtitles?: SubdlSubtitleEntry[] };
    return selectSourceSubtitle(data.subtitles || [], mediaType, season, episode);
  };
  let source = await fetchResults();
  if (!source && mediaType === 'tv') {
    params.delete('episode');
    source = await fetchResults();
  }
  return source;
}

export async function GET(request: NextRequest) {
  const enabled = Boolean(translatorUrl() && process.env.SUBDL_API_KEY && analyticsConfigured());
  if (request.nextUrl.searchParams.get('check') === 'true') {
    return NextResponse.json({ enabled }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (!enabled) return NextResponse.json({ error: 'الترجمة الآلية غير مهيأة بعد.' }, { status: 503 });
  const title = titleRequest(request);
  if (!title) return NextResponse.json({ error: 'Invalid title' }, { status: 400 });

  try {
    const redis = getRedis();
    const cacheKey = `wm:auto-source:${title.mediaType}:${title.tmdbId}:${title.season}:${title.episode}`;
    const cached = await redis.get<{ cues: SubtitleCue[]; language: string }>(cacheKey);
    if (cached?.cues?.length && LANGUAGES.includes(cached.language)) {
      return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-store' } });
    }
    const source = await searchSource(title.tmdbId, title.mediaType, title.season, title.episode);
    if (!source) return NextResponse.json({ error: 'لم نجد ملف ترجمة بلغة أخرى لهذه الحلقة.' }, { status: 404 });
    const url = new URL(source.url, SUBDL_ORIGIN);
    if (url.origin !== SUBDL_ORIGIN || !url.pathname.startsWith('/subtitle/')) throw new Error('Invalid subtitle URL');
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (response.status === 429) throw new SubtitleQuotaError();
    if (!response.ok || Number(response.headers.get('content-length') || 0) > 2_000_000) throw new Error('Subtitle download unavailable');
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > 2_000_000) throw new Error('Subtitle file too large');
    let raw = data.toString('utf8');
    if (url.pathname.endsWith('.zip') || data.subarray(0, 2).toString() === 'PK') {
      const entry = new AdmZip(data).getEntries().find(item => /\.(srt|vtt)$/i.test(item.entryName) && !item.entryName.includes('__MACOSX'));
      if (!entry || entry.header.size > 2_000_000) throw new Error('Subtitle file missing or too large');
      raw = entry.getData().toString('utf8');
    }
    const cues = parseTimedSubtitles(raw);
    if (cues.length < 2) throw new Error('Subtitle file unreadable');
    await redis.set(cacheKey, { cues, language: source.language }, { ex: 7 * 86400 }).catch(() => {});
    return NextResponse.json({ cues, language: source.language }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SubtitleQuotaError) return NextResponse.json({ error: 'بلغ مصدر الترجمة حد التحميل اليومي. جرّب لاحقًا.' }, { status: 429 });
    return NextResponse.json({ error: 'تعذّر جلب ملف الترجمة. جرّب لاحقًا.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const url = translatorUrl();
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!url || !analyticsConfigured()) return NextResponse.json({ error: 'خدمة الترجمة غير متاحة.' }, { status: 503 });
  let body: { lines?: unknown; source?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (!Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 25
    || !body.lines.every(line => typeof line === 'string' && line.length > 0 && line.length <= 500)
    || body.lines.join('').length > 5000 || !LANGUAGES.includes(String(body.source))) {
    return NextResponse.json({ error: 'Invalid subtitle batch' }, { status: 400 });
  }

  try {
    const redis = getRedis();
    const translationKey = `wm:auto-translation:${createHash('sha256').update(JSON.stringify({ source: body.source, lines: body.lines })).digest('hex')}`;
    const cached = await redis.get<string[]>(translationKey);
    if (Array.isArray(cached) && cached.length === body.lines.length) {
      return NextResponse.json({ lines: cached }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    const identity = createHash('sha256').update(ip).digest('hex').slice(0, 24);
    const limitKey = `wm:auto-translate:${day}:${identity}`;
    const count = await redis.incr(limitKey);
    if (count === 1) await redis.expire(limitKey, 86400);
    if (count > 100) return NextResponse.json({ error: 'وصلت الحد اليومي للترجمة. جرّب غدًا.' }, { status: 429 });

    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(25000),
      body: JSON.stringify({ q: body.lines, source: body.source, target: 'ar', ...(process.env.LIBRETRANSLATE_API_KEY ? { api_key: process.env.LIBRETRANSLATE_API_KEY } : {}) }),
    });
    if (!response.ok) throw new Error('Translator unavailable');
    const result = await response.json() as { translatedText?: unknown };
    if (!Array.isArray(result.translatedText) || result.translatedText.length !== body.lines.length
      || !result.translatedText.every(line => typeof line === 'string')) throw new Error('Invalid translation response');
    await redis.set(translationKey, result.translatedText, { ex: 7 * 86400 }).catch(() => {});
    return NextResponse.json({ lines: result.translatedText }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'تعذّرت الترجمة الآن. جرّب لاحقًا.' }, { status: 502 });
  }
}
