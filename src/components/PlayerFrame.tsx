'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { addVisibleWatchTime, getResumePosition, recordWatchVisit, saveWatchPosition, type WatchInfo } from '@/lib/watch-history';
import { saveEpisodePosition, setEpisodesWatched } from '@/lib/episode-progress';
import { PLAYER_PRESENCE_EVENT } from '@/lib/analytics-events';

/** Vendors still ship prefixed versions of the Fullscreen API (Safari, old Edge). */
type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

const FULLSCREEN_CHANGE_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'MSFullscreenChange',
] as const;
const noSubscription = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function getFullscreenElement(doc: FullscreenDocument): Element | null {
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

interface PlayerFrameProps {
  src: string;
  /** Accessible name of the player (movie / episode title). */
  title: string;
  /** Overlays drawn on top of the player, e.g. subtitles or the live badge. */
  children?: ReactNode;
  watchInfo?: WatchInfo;
  blockPopups?: boolean;
  refreshKey?: number;
}

/**
 * Player wrapper with a working "تكبير الشاشة" (fullscreen) button.
 *
 * 1. It first asks the browser for real fullscreen (laptop, Android and modern
 *    iPad), which also unlocks the fullscreen button inside the embedded player.
 * 2. When the Fullscreen API is unavailable or rejected (iPhone / older iPadOS
 *    Safari, restrictive Permissions-Policy) it falls back to a pure CSS
 *    expansion: the frame fills the viewport, the page is locked and the site
 *    chrome is hidden. The iframe is never re-parented, so playback continues.
 */
export default function PlayerFrame({ src, title, children, watchInfo, blockPopups = false, refreshKey = 0 }: PlayerFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const ignoreClickUntilRef = useRef(0);
  const lastPositionRef = useRef({ seconds: 0, savedAt: 0 });
  const episodeChangedRef = useRef(false);
  const hasHydrated = useSyncExternalStore(noSubscription, clientSnapshot, serverSnapshot);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // True while the player is enlarged, either through the real Fullscreen API or
  // through the CSS fallback. The frame then fills all available space and the
  // embedded player letterboxes the video itself.
  const isFullscreen = isNativeFullscreen || isExpanded;

  const frame = useMemo(() => {
    if (!hasHydrated) return null;
    const resume = watchInfo ? getResumePosition(watchInfo) : null;
    const url = new URL(src);
    if (url.origin === 'https://cinesrc.st' && resume !== null) {
      url.searchParams.set('t', String(Math.floor(resume)));
      url.searchParams.set('continueprompt', 'false');
    }
    return { source: src, url: url.toString(), resume };
  }, [hasHydrated, src, watchInfo]);

  useEffect(() => {
    episodeChangedRef.current = false;
    lastPositionRef.current = { seconds: frame?.resume ?? 0, savedAt: 0 };
  }, [frame?.url, frame?.resume]);

  useEffect(() => {
    if (!watchInfo || frame?.source !== src) return;
    const info = watchInfo;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || !event.data || typeof event.data !== 'object') return;
      const data = event.data as Record<string, unknown>;
      const type = data.type;
      let position: unknown = data.currentTime;
      if (event.origin === 'https://cinesrc.st' && src.startsWith('https://cinesrc.st/')) {
        if (type === 'cinesrc:nextepisode' && info.mediaType === 'tv' &&
            (Number(data.season) !== info.season || Number(data.episode) !== info.episode)) {
          episodeChangedRef.current = true;
        }
        if (episodeChangedRef.current) return;
        if (type === 'cinesrc:ended' && info.mediaType === 'tv' && info.season && info.episode) {
          setEpisodesWatched(info.mediaId, info.season, [info.episode], true);
          return;
        }
        if (type === 'cinesrc:pause') {
          iframeRef.current?.contentWindow?.postMessage({ type: 'cinesrc:command', command: 'getCurrentTime', args: [] }, 'https://cinesrc.st');
          return;
        }
        if (type === 'cinesrc:response' && data.command === 'getCurrentTime') position = data.result;
        else if (type !== 'cinesrc:timeupdate' && type !== 'cinesrc:seeked') return;
      } else if (event.origin === 'https://embed.vidrift.net' && src.startsWith('https://embed.vidrift.net/')) {
        if (Number(data.tmdbId) !== info.mediaId || data.mediaType !== info.mediaType ||
            (info.mediaType === 'tv' && (Number(data.season) !== info.season || Number(data.episode) !== info.episode))) return;
        if (type !== 'vidrift:progress' && type !== 'vidrift:paused') return;
      } else {
        return;
      }
      if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) return;
      const now = Date.now();
      const last = lastPositionRef.current;
      if (type !== 'cinesrc:seeked' && type !== 'cinesrc:response' && type !== 'vidrift:paused' && now - last.savedAt < 2000 && Math.abs(position - last.seconds) < 10) return;
      saveWatchPosition(info, position, typeof data.duration === 'number' ? data.duration : undefined);
      if (info.mediaType === 'tv' && info.season && info.episode) {
        saveEpisodePosition(info.mediaId, info.season, info.episode, position,
          typeof data.duration === 'number' ? data.duration : info.runtimeSeconds);
      }
      lastPositionRef.current = { seconds: position, savedAt: now };
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frame?.source, src, watchInfo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !watchInfo) return;
    const info = watchInfo;
    let visible = false;
    let lastTick = performance.now();
    const announce = (isWatching: boolean) => {
      window.dispatchEvent(new CustomEvent(PLAYER_PRESENCE_EVENT, {
        detail: { watching: isWatching },
      }));
    };
    const flush = () => {
      const now = performance.now();
      if (visible && document.visibilityState === 'visible') {
        addVisibleWatchTime(info, Math.min(10, (now - lastTick) / 1000));
      }
      lastTick = now;
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= .25 && !visible) {
        visible = true;
        lastTick = performance.now();
        recordWatchVisit(info);
        announce(document.visibilityState === 'visible');
      } else if (entry.intersectionRatio < .25 && visible) {
        flush();
        visible = false;
        announce(false);
      }
    }, { threshold: .25 });
    observer.observe(container);
    const timer = window.setInterval(flush, 5000);
    const onVisibility = () => {
      flush();
      announce(visible && document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      flush();
      announce(false);
      observer.disconnect();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [watchInfo]);

  // Stay in sync with real fullscreen (Esc key, F11, browser UI...).
  useEffect(() => {
    const handleChange = () => {
      const doc = document as FullscreenDocument;
      setIsNativeFullscreen(getFullscreenElement(doc) === containerRef.current);
    };
    FULLSCREEN_CHANGE_EVENTS.forEach((event) =>
      document.addEventListener(event, handleChange)
    );
    return () =>
      FULLSCREEN_CHANGE_EVENTS.forEach((event) =>
        document.removeEventListener(event, handleChange)
      );
  }, []);

  // Lock the page while expanded and keep the frame aligned with the viewport.
  useEffect(() => {
    const container = containerRef.current;
    if (!isExpanded || !container) return;

    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    root.classList.add('player-expanded');
    root.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const alignWithViewport = () => {
      window.scrollTo(0, container.getBoundingClientRect().top + window.scrollY);
    };
    alignWithViewport();
    const frame = requestAnimationFrame(alignWithViewport);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', alignWithViewport);
    window.addEventListener('orientationchange', alignWithViewport);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', alignWithViewport);
      window.removeEventListener('orientationchange', alignWithViewport);
      root.classList.remove('player-expanded');
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isExpanded]);

  const collapseFullscreen = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    const doc = document as FullscreenDocument;
    if (getFullscreenElement(doc) !== containerRef.current) return;
    const exitFullscreen =
      doc.exitFullscreen?.bind(doc) ??
      doc.webkitExitFullscreen?.bind(doc) ??
      doc.msExitFullscreen?.bind(doc);
    try {
      await exitFullscreen?.();
    } catch {
      // Already out of fullscreen, nothing else to do.
    }
  }, [isExpanded]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current as FullscreenElement | null;
    if (!container) return;

    const doc = document as FullscreenDocument;
    if (isExpanded || getFullscreenElement(doc) === container) {
      await collapseFullscreen();
      return;
    }

    const requestFullscreen =
      container.requestFullscreen?.bind(container) ??
      container.webkitRequestFullscreen?.bind(container) ??
      container.msRequestFullscreen?.bind(container);

    if (requestFullscreen) {
      try {
        await requestFullscreen();
        // Some iOS / iPadOS builds expose the API but never enter fullscreen.
        if (getFullscreenElement(doc) === container) return;
      } catch {
        // Denied by Permissions-Policy or unsupported: use the fallback below.
      }
    }

    setIsExpanded(true);
  }, [collapseFullscreen, isExpanded]);

  // The iframe owns its own touch events. A downward swipe on the visible top
  // control or the letterbox area, and wheel scrolling outside the iframe,
  // return the player to its place without interrupting playback.
  useEffect(() => {
    if (!isFullscreen) return;
    let distance = 0;
    const onWheel = (event: WheelEvent) => {
      distance = event.deltaY > 0 ? distance + event.deltaY : 0;
      if (distance >= 70) {
        distance = 0;
        void collapseFullscreen();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [collapseFullscreen, isFullscreen]);

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isFullscreen) swipeStartYRef.current = event.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = swipeStartYRef.current;
    swipeStartYRef.current = null;
    if (!isFullscreen || startY === null) return;
    if ((event.changedTouches[0]?.clientY ?? startY) - startY < 65) return;
    ignoreClickUntilRef.current = Date.now() + 700;
    void collapseFullscreen();
  };

  const containerStyle: CSSProperties | undefined = isExpanded
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        margin: 0,
        borderRadius: 0,
      }
    : undefined;
  const activeFrame = frame?.source === src ? frame : null;

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { swipeStartYRef.current = null; }}
      className={`player-frame relative rounded-2xl overflow-hidden bg-black border border-neutral-800/50 shadow-2xl shadow-black/50${isFullscreen ? ' player-frame-fullscreen' : ''}${isExpanded ? ' player-frame-expanded' : ''}`}
    >
      <div className={isFullscreen ? 'player-viewport relative w-full h-full' : 'player-viewport relative aspect-video'}>
        {activeFrame && <iframe
          ref={iframeRef}
          key={`${activeFrame.url}-${blockPopups}-${refreshKey}`}
          src={activeFrame.url}
          title={title}
          className="w-full h-full"
          allowFullScreen
          referrerPolicy={src.startsWith('https://embed.vidrift.net/') ? 'strict-origin-when-cross-origin' : 'origin'}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          sandbox={blockPopups && !src.startsWith('https://embed.vidrift.net/') ? 'allow-scripts allow-same-origin allow-forms allow-downloads allow-presentation allow-orientation-lock' : undefined}
          onLoad={() => {
            if (src.startsWith('https://embed.vidrift.net/') && activeFrame.resume !== null) {
              iframeRef.current?.contentWindow?.postMessage({ type: 'vidrift:resume', currentTime: activeFrame.resume }, 'https://embed.vidrift.net');
            }
          }}
        />}

        {children}

      </div>

      {isFullscreen && (
        <div className="player-swipe-handle" aria-hidden="true">
          <span />
        </div>
      )}

        <button
          type="button"
          onClick={() => { if (Date.now() >= ignoreClickUntilRef.current) void toggleFullscreen(); }}
          aria-label={isFullscreen ? 'اسحب للأسفل أو اضغط لتصغير الشاشة' : 'تكبير الشاشة'}
          title={isFullscreen ? 'اسحب للأسفل أو اضغط لتصغير الشاشة' : 'تكبير الشاشة'}
          className="player-expand-button absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {isFullscreen ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 4v3a2 2 0 01-2 2H4M20 9h-3a2 2 0 01-2-2V4M15 20v-3a2 2 0 012-2h3M4 15h3a2 2 0 012 2v3"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4M20 15v4a1 1 0 01-1 1h-4M9 20H5a1 1 0 01-1-1v-4"
              />
            </svg>
          )}
          <span className="player-expand-label hidden sm:inline">
            {isFullscreen ? 'اسحب ↓ للتصغير' : 'تكبير'}
          </span>
        </button>
    </div>
  );
}

