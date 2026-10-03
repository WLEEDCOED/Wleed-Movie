'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PlayerFrame from './PlayerFrame';

interface Server {
  id: string;
  name: string;
  embedUrl: string;
  language: string | null;
  quality: string | null;
  isTrusted: boolean;
}

interface SubtitleTrack {
  id: number;
  language: string;
  label: string;
  filePath: string;
}

interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

interface ServerSwitcherProps {
  servers: Server[];
  subtitles?: SubtitleTrack[];
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export default function ServerSwitcher({
  servers,
  subtitles = [],
  tmdbId,
  mediaType = 'movie',
  season,
  episode,
}: ServerSwitcherProps) {
  const defaultServer =
    servers.find((s) => s.isTrusted) || servers[0] || null;
  const [activeServer, setActiveServer] = useState<Server | null>(
    defaultServer
  );

  const defaultSub = subtitles.find((s) => s.language === 'ar') || null;
  const [activeSubtitle, setActiveSubtitle] = useState<SubtitleTrack | null>(
    defaultSub
  );
  const [subtitleEnabled, setSubtitleEnabled] = useState(!!defaultSub);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [subAvailable, setSubAvailable] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!tmdbId) return;
    setSubAvailable(null);
    const checkUrl = `/api/subtitles/vtt?tmdbId=${tmdbId}&type=${mediaType || 'movie'}${season ? `&season=${season}&episode=${episode}` : ''}&check=true`;
    fetch(checkUrl)
      .then((res) => res.json())
      .then((data) => setSubAvailable(!!data.hasSub))
      .catch(() => setSubAvailable(false));
  }, [tmdbId, mediaType, season, episode]);

  const parseVTT = useCallback((vttText: string): SubtitleCue[] => {
    const parsed: SubtitleCue[] = [];
    const blocks = vttText.split('\n\n');
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      for (let i = 0; i < lines.length; i++) {
        const timeLine = lines[i];
        if (timeLine && timeLine.includes('-->')) {
          const [startStr, endStr] = timeLine.split('-->');
          const startTime = parseTimestamp(startStr.trim());
          const endTime = parseTimestamp(endStr.trim());
          const textLines = lines.slice(i + 1).join('\n').trim();
          if (textLines && !isNaN(startTime) && !isNaN(endTime)) {
            parsed.push({ startTime, endTime, text: textLines });
          }
          break;
        }
      }
    }
    return parsed;
  }, []);

  function parseTimestamp(ts: string): number {
    const parts = ts.split(':');
    if (parts.length === 3) {
      const [h, m, rest] = parts;
      const [s, ms] = rest.split('.');
      return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + (ms ? parseInt(ms) / 1000 : 0);
    } else if (parts.length === 2) {
      const [m, rest] = parts;
      const [s, ms] = rest.split('.');
      return parseInt(m) * 60 + parseInt(s) + (ms ? parseInt(ms) / 1000 : 0);
    }
    return 0;
  }

  useEffect(() => {
    if (!activeSubtitle || !subtitleEnabled) {
      setCues([]);
      setCurrentText('');
      return;
    }
    fetch(activeSubtitle.filePath)
      .then((res) => res.text())
      .then((text) => setCues(parseVTT(text)))
      .catch(() => setCues([]));
  }, [activeSubtitle, subtitleEnabled, parseVTT]);

  useEffect(() => {
    if (cues.length === 0 || !subtitleEnabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentText('');
      return;
    }
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      const now = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(now);
      const activeCue = cues.find((c) => now >= c.startTime && now <= c.endTime);
      setCurrentText(activeCue ? activeCue.text : '');
    }, 250);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cues, subtitleEnabled]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);
  }, [activeServer]);

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
    <div className="space-y-4">
      {activeServer ? (
        <PlayerFrame src={activeServer.embedUrl} title={`مشغل ${activeServer.name}`}>
          {activeSubtitle && subtitleEnabled && currentText && (
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-10">
              <span className="inline-block bg-black/80 text-white text-lg md:text-xl px-5 py-2.5 rounded-lg shadow-lg backdrop-blur-sm">
                {currentText}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>مباشر</span>
            </div>
          </div>
        </PlayerFrame>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-neutral-800/50 shadow-2xl shadow-black/50">
          <div className="aspect-video relative flex items-center justify-center">
            <p className="text-neutral-500">اختر خادماً للمشاهدة</p>
          </div>
        </div>
      )}

      {subtitles.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSubtitleEnabled(!subtitleEnabled)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              subtitleEnabled
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'glass text-neutral-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" />
            </svg>
            CC
          </button>
          <select
            value={activeSubtitle?.id || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              const sub = subtitles.find((s) => s.id === id) || null;
              setActiveSubtitle(sub);
              if (sub) setSubtitleEnabled(true);
            }}
            className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="" className="bg-neutral-900">بدون ترجمة</option>
            {subtitles.map((sub) => (
              <option key={sub.id} value={sub.id} className="bg-neutral-900">{sub.label}</option>
            ))}
          </select>
          {subtitleEnabled && cues.length > 0 && (
            <span className="text-xs text-neutral-600 font-mono">
              {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{Math.floor(elapsedTime % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      {/* خوادم المشاهدة */}
      {servers.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-neutral-400 font-medium ml-2">السيرفر:</span>
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => setActiveServer(server)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
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

      {/* خيارات وتنبيهات الترجمة الذكية */}
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
                  {activeServer?.id === 'vidfast'
                    ? 'ترجمة عربية مدمجة تلقائياً (?sub=ar)'
                    : activeServer?.id === 'superembed'
                    ? 'ترجمة عربية مدمجة (SuperEmbed)'
                    : 'الترجمة العربية متوفرة ومدمجة'}
                </span>
                <span className="text-neutral-300">
                  (إذا لم تظهر تلقائياً، اضغط على أيقونة <span className="bg-white/10 text-white font-bold px-1.5 py-0.5 rounded">CC 💬</span> داخل شريط تحكم الفيديو)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <span>⚠️</span>
                  لا تتوفر ترجمة عربية رسمية لهذا العمل حتى الآن
                </span>
                <span className="text-neutral-500 text-[11px]">
                  (العمل جديد جداً ولم يتم طرح ملف ترجمته العربية في قواعد البيانات بعد)
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900/40 text-neutral-500 border border-neutral-800/40 text-[11px] font-medium whitespace-nowrap self-start sm:self-auto opacity-70">
              غير متوفرة للتحميل
            </span>
          )}
        </div>
      )}
    </div>
  );
}
