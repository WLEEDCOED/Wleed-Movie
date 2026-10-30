'use client';

import { useState, useEffect } from 'react';
import PlayerFrame from './PlayerFrame';
import type { WatchInfo } from '@/lib/watch-history';

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
  const [atlanticRefreshKey, setAtlanticRefreshKey] = useState(0);
  const [availability, setAvailability] = useState<{ key: string; available: boolean } | null>(null);
  const [checkingSubtitles, setCheckingSubtitles] = useState(false);
  const availabilityKey = `${mediaType}-${tmdbId ?? 0}-${season ?? 0}-${episode ?? 0}`;
  const subAvailable = availability?.key === availabilityKey ? availability.available : null;

  useEffect(() => {
    if (!tmdbId) return;
    const controller = new AbortController();
    const continueKey = `${mediaType}-${tmdbId}-${season ?? 0}-${episode ?? 0}`;
    let freshOnContinue = false;
    try {
      freshOnContinue = sessionStorage.getItem('refresh-subtitles-on-continue') === continueKey;
      if (freshOnContinue) sessionStorage.removeItem('refresh-subtitles-on-continue');
    } catch { /* Storage may be disabled. */ }
    const checkUrl = `/api/subtitles/vtt?tmdbId=${tmdbId}&type=${mediaType}${season ? `&season=${season}&episode=${episode}` : ''}&check=true${freshOnContinue ? '&refresh=true' : ''}`;
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
        <PlayerFrame src={activeServer.embedUrl} title={`مشغل ${activeServer.name}`} watchInfo={watchInfo} blockPopups={activeServer.id === 'cinesrc' && blockPopups} refreshKey={activeServer.id === 'atlantic' ? atlanticRefreshKey : 0} />
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

      {activeServer?.id === 'atlantic' && <div className="atlantic-subtitle-help">
        <button type="button" onClick={() => setAtlanticRefreshKey(key => key + 1)}>
          ↻ Reload Atlantic player
        </button>
        <span>Reloads playback to check for new subtitles. In Captions, choose Auto select if Off was saved earlier.</span>
        {tmdbId && <a href={mediaType === 'tv' ? `https://atlantic.st/watch/${tmdbId}/${season}/${episode}` : activeServer.embedUrl} target="_blank" rel="noopener noreferrer">Open directly in Atlantic ↗</a>}
      </div>}

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
      {tmdbId && (
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
      )}
    </div>
  );
}
