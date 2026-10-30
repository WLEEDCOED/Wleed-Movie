export const EPISODE_PROGRESS_KEY = 'wleedmovie-episode-progress-v1';
export const EPISODE_PROGRESS_EVENT = 'wleedmovie-episode-progress';

export interface EpisodeProgress {
  positionSeconds: number;
  durationSeconds?: number;
  watched: boolean;
  updatedAt: number;
}

export function episodeProgressId(seriesId: number, season: number, episode: number): string {
  return `${seriesId}:${season}:${episode}`;
}

export function getEpisodeProgress(): Record<string, EpisodeProgress> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(EPISODE_PROGRESS_KEY) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([key, value]) => {
      if (!/^\d+:\d+:\d+$/.test(key) || !value || typeof value !== 'object') return false;
      const item = value as Partial<EpisodeProgress>;
      return typeof item.positionSeconds === 'number' && Number.isFinite(item.positionSeconds)
        && item.positionSeconds >= 0 && typeof item.watched === 'boolean'
        && typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt);
    })) as Record<string, EpisodeProgress>;
  } catch {
    return {};
  }
}

function save(progress: Record<string, EpisodeProgress>) {
  try {
    const recent = Object.entries(progress)
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
      .slice(0, 500);
    localStorage.setItem(EPISODE_PROGRESS_KEY, JSON.stringify(Object.fromEntries(recent)));
    window.dispatchEvent(new Event(EPISODE_PROGRESS_EVENT));
  } catch {
    // Playback stays available when storage is disabled.
  }
}

export function saveEpisodePosition(seriesId: number, season: number, episode: number, position: number, duration?: number) {
  if (!Number.isFinite(position) || position < 0) return;
  const progress = getEpisodeProgress();
  const key = episodeProgressId(seriesId, season, episode);
  const previous = progress[key];
  const validDuration = duration && Number.isFinite(duration) && duration > 0 ? duration : previous?.durationSeconds;
  const watched = previous?.watched || Boolean(validDuration && position >= validDuration * .95);
  progress[key] = {
    positionSeconds: position,
    ...(validDuration ? { durationSeconds: validDuration } : {}),
    watched,
    updatedAt: Date.now(),
  };
  save(progress);
}

export function setEpisodesWatched(seriesId: number, season: number, episodes: number[], watched: boolean) {
  const progress = getEpisodeProgress();
  const now = Date.now();
  for (const episode of episodes) {
    const key = episodeProgressId(seriesId, season, episode);
    const previous = progress[key];
    progress[key] = {
      positionSeconds: watched ? (previous?.durationSeconds ?? previous?.positionSeconds ?? 0) : 0,
      ...(previous?.durationSeconds ? { durationSeconds: previous.durationSeconds } : {}),
      watched,
      updatedAt: now,
    };
  }
  save(progress);
}
