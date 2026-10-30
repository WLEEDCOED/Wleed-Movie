'use client';

import { useState, useEffect } from 'react';
import PlayerFrame from './PlayerFrame';
import type { WatchInfo } from '@/lib/watch-history';
import type { SubtitleCue } from '@/lib/auto-subtitles';

interface Server {
  id: string;
  name: string;
  embedUrl: string;
  language: string | null;
  quality: string | null;
  isTrusted: boolean;
}

interface ServerSwitcherProps {
  servers: Server[];
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
  watchInfo?: WatchInfo;
}

export default function ServerSwitcher({
  servers,
  tmdbId,
  mediaType = 'movie',
  season,
  episode,
  watchInfo,
}: ServerSwitcherProps) {
  const defaultServer =
    servers.find((s) => s.isTrusted) || servers[0] || null;
  const [activeServer, setActiveServer] = useState<Server | null>(
    defaultServer
  );
  const [blockPopups, setBlockPopups] = useState(true);
  const [availability, setAvailability] = useState<{ key: string; available: boolean } | null>(null);
  const [checkingSubtitles, setCheckingSubtitles] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoSubtitle, setAutoSubtitle] = useState<{ key: string; cues: SubtitleCue[] } | null>(null);
  const [autoVisible, setAutoVisible] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');
  const availabilityKey = `${mediaType}-${tmdbId ?? 0}-${season ?? 0}-${episode ?? 0}`;
  const autoCues = autoSubtitle?.key === availabilityKey ? autoSubtitle.cues : null;
  const subAvailable = availability?.key === availabilityKey ? availability.available : null;
  const overlaySupported = activeServer?.id === 'cinesrc' || activeServer?.id === 'vidrift';

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/subtitles/auto?check=true', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.json())
      .then(data => setAutoEnabled(Boolean(data.enabled)))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAutoSubtitle(null);
      setAutoVisible(false);
      setAutoMessage('');
      try {
        const cached = localStorage.getItem(`wm:auto-subtitle:${availabilityKey}`);
        if (!cached) return;
        const cues = JSON.parse(cached) as SubtitleCue[];
        if (Array.isArray(cues) && cues.length > 0 && cues.length <= 4000
          && cues.every(cue => Number.isFinite(cue.start) && Number.isFinite(cue.end) && typeof cue.text === 'string')) {
          setAutoSubtitle({ key: availabilityKey, cues });
          setAutoVisible(true);
        }
      } catch { /* Browser storage may be disabled. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [availabilityKey]);

  useEffect(() => {
    if (!tmdbId) return;
    const controller = new AbortController();
    const checkUrl = `/api/subtitles/vtt?tmdbId=${tmdbId}&type=${mediaType || 'movie'}${season ? `&season=${season}&episode=${episode}` : ''}&check=true`;
    fetch(checkUrl, { signal: controller.signal, cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setAvailability({ key: availabilityKey, available: !!data.hasSub }))
      .catch(() => { if (!controller.signal.aborted) setAvailability({ key: availabilityKey, available: false }); });
    return () => controller.abort();
  }, [tmdbId, mediaType, season, episode, availabilityKey]);

  const recheckSubtitles = async () => {
    if (!tmdbId || checkingSubtitles) return;
    setCheckingSubtitles(true);
    try {
      const url = `/api/subtitles/vtt?tmdbId=${tmdbId}&type=${mediaType}${season ? `&season=${season}&episode=${episode}` : ''}&check=true&refresh=true`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('Subtitle check failed');
      const data = await response.json();
      setAvailability({ key: availabilityKey, available: !!data.hasSub });
    } catch {
      setAvailability({ key: availabilityKey, available: false });
    } finally {
      setCheckingSubtitles(false);
    }
  };

  const translateSubtitles = async () => {
    if (!tmdbId || autoBusy) return;
    if (autoCues) {
      setAutoVisible(current => !current);
      return;
    }
    setAutoBusy(true);
    setAutoMessage('جاري البحث عن ملف ترجمة بلغة أخرى...');
    try {
      const query = new URLSearchParams({ tmdbId: String(tmdbId), type: mediaType });
      if (mediaType === 'tv' && season && episode) {
        query.set('season', String(season));
        query.set('episode', String(episode));
      }
      const sourceResponse = await fetch(`/api/subtitles/auto?${query}`, { cache: 'no-store' });
      const source = await sourceResponse.json() as { cues?: SubtitleCue[]; language?: string; error?: string };
      if (!sourceResponse.ok || !source.cues?.length || !source.language) throw new Error(source.error || 'لم نجد ملف ترجمة مناسبًا.');

      const translated: SubtitleCue[] = [];
      for (let index = 0; index < source.cues.length; index += 25) {
        const batch = source.cues.slice(index, index + 25);
        setAutoMessage(`جاري ترجمة الترجمة العربية... ${Math.round(index / source.cues.length * 100)}%`);
        const response = await fetch('/api/subtitles/auto', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: source.language, lines: batch.map(cue => cue.text) }),
        });
        const data = await response.json() as { lines?: string[]; error?: string };
        if (!response.ok || !data.lines || data.lines.length !== batch.length) throw new Error(data.error || 'تعذّرت الترجمة.');
        translated.push(...batch.map((cue, offset) => ({ ...cue, text: data.lines![offset] })));
      }
      setAutoSubtitle({ key: availabilityKey, cues: translated });
      setAutoVisible(true);
      setAutoMessage('الترجمة العربية الآلية جاهزة. استخدم زر تكبير الموقع لإظهارها في الشاشة الكاملة.');
      try { localStorage.setItem(`wm:auto-subtitle:${availabilityKey}`, JSON.stringify(translated)); } catch { /* Cache is optional. */ }
    } catch (error) {
      setAutoMessage(error instanceof Error ? error.message : 'تعذّرت الترجمة الآن.');
    } finally {
      setAutoBusy(false);
    }
  };


  if (servers.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-neutral-400 text-lg">لا توجد خوادم متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div className="watch-switcher space-y-4">
      {activeServer ? (
        <PlayerFrame src={activeServer.embedUrl} title={`مشغل ${activeServer.name}`} watchInfo={watchInfo} blockPopups={activeServer.id === 'cinesrc' && blockPopups} subtitleCues={overlaySupported && autoVisible ? autoCues : null} />
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-neutral-800/50 shadow-2xl shadow-black/50">
          <div className="aspect-video relative flex items-center justify-center">
            <p className="text-neutral-500">اختر خادماً للمشاهدة</p>
          </div>
        </div>
      )}


      {/* خوادم المشاهدة */}
      {servers.length > 1 && (
        <div className="watch-server-list flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-neutral-400 font-medium ml-2">السيرفر:</span>
          {servers.map((server) => (
            <button
              key={server.id}
              type="button"
              onClick={() => setActiveServer(server)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeServer?.id === server.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30 ring-1 ring-red-400'
                  : 'bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              <span>{server.name}</span>
            </button>
          ))}
        </div>
      )}

      {activeServer?.id === 'cinesrc' && <button
        type="button"
        onClick={() => setBlockPopups((current) => !current)}
        aria-pressed={blockPopups}
        title="إذا لم يعمل المشغل، أوقف منع النوافذ المنبثقة وجرب مرة أخرى"
        className={`rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors ${
          blockPopups
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            : 'border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800'
        }`}
      >
        منع النوافذ المنبثقة: {blockPopups ? 'مفعّل' : 'متوقف'}
      </button>}

      {/* توفر ملف الترجمة للتحميل */}
      {tmdbId && (<>
        <div className="glass rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-neutral-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            {subAvailable === null ? (
              <span className="text-neutral-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse" />
                جاري التحقق من توفر الترجمة العربية...
              </span>
            ) : subAvailable ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ملف ترجمة عربية متوفر
                </span>
                <span className="text-neutral-300">
                  يمكن تحميله من هنا، أو استخدام الترجمة داخل المشغل إن توفرت.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <span>⚠️</span>
                  لم نجد ملف ترجمة عربية لهذا العمل حاليًا
                </span>
                <span className="text-neutral-500 text-[11px]">
                  قد تتوفر ترجمة داخل المشغل نفسه.
                </span>
              </div>
            )}
          </div>

          {subAvailable ? (
            <a
              href={`/api/subtitles/vtt?tmdbId=${tmdbId}&type=${mediaType}${season ? `&season=${season}&episode=${episode}` : ''}&download=true&format=srt`}
              download
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/60 transition-all font-medium whitespace-nowrap self-start sm:self-auto cursor-pointer"
              title="تحميل ملف الترجمة العربية بصيغة SRT"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>📥 تحميل ملف الترجمة (SRT)</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={recheckSubtitles}
              disabled={checkingSubtitles}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 text-neutral-200 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] font-medium whitespace-nowrap self-start sm:self-auto disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {checkingSubtitles ? 'جاري إعادة الفحص...' : 'إعادة فحص الترجمة'}
            </button>
          )}
        </div>
          {autoEnabled && subAvailable === false && <div className="auto-translate-actions">
            <button type="button" onClick={translateSubtitles} disabled={autoBusy || !overlaySupported}
              className="auto-translate-button" aria-pressed={Boolean(autoCues && autoVisible)}>
              {autoBusy ? 'جاري الترجمة...' : autoCues ? (autoVisible ? 'إخفاء الترجمة الآلية' : 'إظهار الترجمة الآلية') : 'ترجمة آلية للعربية'}
            </button>
            {!overlaySupported && <span>لعرض الترجمة فوق الفيديو، اختر CineSrc أو Vidrift.</span>}
            {autoMessage && <span role="status" dir="auto">{autoMessage}</span>}
          </div>}
      </>)}
    </div>
  );
}
