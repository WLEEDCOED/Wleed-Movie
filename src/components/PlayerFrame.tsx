'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

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
export default function PlayerFrame({ src, title, children }: PlayerFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // True while the player is enlarged, either through the real Fullscreen API or
  // through the CSS fallback. The frame then fills all available space and the
  // embedded player letterboxes the video itself.
  const isFullscreen = isNativeFullscreen || isExpanded;

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

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current as FullscreenElement | null;
    if (!container) return;

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    const doc = document as FullscreenDocument;
    const fullscreenElement = getFullscreenElement(doc);

    if (fullscreenElement) {
      const exitFullscreen =
        doc.exitFullscreen?.bind(doc) ??
        doc.webkitExitFullscreen?.bind(doc) ??
        doc.msExitFullscreen?.bind(doc);
      try {
        await exitFullscreen?.();
      } catch {
        // Already out of fullscreen, nothing else to do.
      }
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
  }, [isExpanded]);

  const containerStyle: CSSProperties | undefined = isExpanded
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 9999,
        margin: 0,
        borderRadius: 0,
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="relative rounded-2xl overflow-hidden bg-black border border-neutral-800/50 shadow-2xl shadow-black/50"
    >
      <div className={isFullscreen ? 'relative w-full h-full' : 'relative aspect-video'}>
        <iframe
          key={src}
          src={src}
          title={title}
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          allowFullScreen
          referrerPolicy="origin"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        />

        {children}

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}
          title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}
          className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
          <span className="hidden sm:inline">
            {isFullscreen ? 'تصغير' : 'تكبير'}
          </span>
        </button>
      </div>
    </div>
  );
}

