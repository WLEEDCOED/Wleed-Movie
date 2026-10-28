export const WATCH_HISTORY_KEY = 'wleedmovie-continue-watching';
export const WATCH_HISTORY_EVENT = 'wleedmovie-watch-history';

export interface WatchInfo {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  title: string;
  imageUrl: string | null;
  href: string;
  runtimeSeconds?: number;
  season?: number;
  episode?: number;
}

export interface WatchEntry extends WatchInfo {
  viewedSeconds: number;
  positionSeconds?: number;
  durationSeconds?: number;
  updatedAt: number;
}

function isWatchEntry(value: unknown): value is WatchEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<WatchEntry>;
  return (entry.mediaType === 'movie' || entry.mediaType === 'tv')
    && Number.isSafeInteger(entry.mediaId) && typeof entry.title === 'string'
    && (entry.imageUrl === null || typeof entry.imageUrl === 'string')
    && typeof entry.href === 'string' && entry.href.startsWith('/')
    && typeof entry.viewedSeconds === 'number' && Number.isFinite(entry.viewedSeconds)
    && (entry.positionSeconds === undefined || (typeof entry.positionSeconds === 'number' && Number.isFinite(entry.positionSeconds) && entry.positionSeconds >= 0))
    && (entry.durationSeconds === undefined || (typeof entry.durationSeconds === 'number' && Number.isFinite(entry.durationSeconds) && entry.durationSeconds > 0))
    && typeof entry.updatedAt === 'number' && Number.isFinite(entry.updatedAt);
}

export function getWatchHistory(): WatchEntry[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(WATCH_HISTORY_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(isWatchEntry).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20) : [];
  } catch {
    return [];
  }
}

function saveWatchHistory(entries: WatchEntry[]) {
  try {
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(WATCH_HISTORY_EVENT));
  } catch {
    // Storage may be disabled; playback should still work.
  }
}

export function recordWatchVisit(info: WatchInfo) {
  const entries = getWatchHistory();
  const previous = entries.find(entry => entry.mediaType === info.mediaType && entry.mediaId === info.mediaId);
  const sameVideo = previous?.href === info.href;
  const next: WatchEntry = {
    ...info,
    viewedSeconds: sameVideo ? previous.viewedSeconds : 0,
    positionSeconds: sameVideo ? previous.positionSeconds : undefined,
    durationSeconds: sameVideo ? previous.durationSeconds : undefined,
    updatedAt: Date.now(),
  };
  saveWatchHistory([next, ...entries.filter(entry => entry.mediaType !== info.mediaType || entry.mediaId !== info.mediaId)].slice(0, 20));
}

export function getResumePosition(info: WatchInfo): number | null {
  const entry = getWatchHistory().find(item => item.mediaType === info.mediaType && item.mediaId === info.mediaId && item.href === info.href);
  const position = entry?.positionSeconds;
  if (position === undefined || position < 5) return null;
  const duration = entry?.durationSeconds ?? entry?.runtimeSeconds;
  if (duration && position >= duration - 30) return null;
  return position;
}

export function saveWatchPosition(info: WatchInfo, position: number, duration?: number) {
  if (!Number.isFinite(position) || position < 0) return;
  const entries = getWatchHistory();
  const entry = entries.find(item => item.mediaType === info.mediaType && item.mediaId === info.mediaId && item.href === info.href);
  if (!entry) return;
  const validDuration = duration && Number.isFinite(duration) && duration > 0 ? duration : entry.durationSeconds;
  entry.positionSeconds = validDuration ? Math.min(position, validDuration) : position;
  if (validDuration) entry.durationSeconds = validDuration;
  entry.updatedAt = Date.now();
  saveWatchHistory(entries.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20));
}

export function addVisibleWatchTime(info: WatchInfo, seconds: number) {
  if (seconds <= 0 || !Number.isFinite(seconds)) return;
  const entries = getWatchHistory();
  const entry = entries.find(item => item.mediaType === info.mediaType && item.mediaId === info.mediaId && item.href === info.href);
  if (!entry) return;
  const limit = entry.runtimeSeconds ? entry.runtimeSeconds * .95 : 4 * 60 * 60;
  entry.viewedSeconds = Math.min(limit, entry.viewedSeconds + seconds);
  entry.updatedAt = Date.now();
  saveWatchHistory(entries.sort((a, b) => b.updatedAt - a.updatedAt));
}

export function removeWatchEntry(mediaType: WatchInfo['mediaType'], mediaId: number) {
  saveWatchHistory(getWatchHistory().filter(entry => entry.mediaType !== mediaType || entry.mediaId !== mediaId));
}
