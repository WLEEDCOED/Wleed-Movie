'use client';

import { useSyncExternalStore } from 'react';
import type { TMDBTrending } from '@/lib/tmdb';

export const WATCHLIST_KEY = 'wleedmovie-watchlist-v1';
const listeners = new Set<() => void>();
const emptyIds = new Set<string>();
let cachedRaw: string | null | undefined;
let cachedIds: ReadonlySet<string> = emptyIds;

export function readWatchlist(): TMDBTrending[] {
  try {
    const value = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getSavedIds(): ReadonlySet<string> {
  if (cachedRaw !== undefined) return cachedIds;
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    cachedRaw = raw;
    cachedIds = new Set(readWatchlist().map(entry => `${entry.media_type}-${entry.id}`));
    return cachedIds;
  } catch {
    return emptyIds;
  }
}

function notifyWatchlistChange() {
  cachedRaw = undefined;
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (listeners.size === 1) {
    window.addEventListener('watchlist-change', notifyWatchlistChange);
    window.addEventListener('storage', notifyWatchlistChange);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      window.removeEventListener('watchlist-change', notifyWatchlistChange);
      window.removeEventListener('storage', notifyWatchlistChange);
    }
  };
}

export default function WatchlistButton({ item, compact = false }: { item: TMDBTrending; compact?: boolean }) {
  const saved = useSyncExternalStore(subscribe, getSavedIds, () => emptyIds).has(`${item.media_type}-${item.id}`);

  const toggle = () => {
    const list = readWatchlist();
    const exists = list.some(entry => entry.id === item.id && entry.media_type === item.media_type);
    const next = exists
      ? list.filter(entry => !(entry.id === item.id && entry.media_type === item.media_type))
      : [item, ...list];
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('watchlist-change'));
    } catch { /* Storage can be unavailable in private browsing. */ }
  };

  return (
    <button type="button" onClick={toggle} aria-label={saved ? 'Remove from My List' : 'Add to My List'} title={saved ? 'Remove from My List' : 'Add to My List'} className={compact ? 'watchlist-small' : 'hero-icon-button'}>
      {saved ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">＋</span>}
    </button>
  );
}
