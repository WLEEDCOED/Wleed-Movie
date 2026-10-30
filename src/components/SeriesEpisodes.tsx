'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MovieHeroImage from './MovieHeroImage';
import type { TMDBEpisode, TMDBSeason } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { getWatchHistory, WATCH_HISTORY_EVENT } from '@/lib/watch-history';
import {
  EPISODE_PROGRESS_EVENT,
  episodeProgressId,
  getEpisodeProgress,
  setEpisodesWatched,
  type EpisodeProgress,
} from '@/lib/episode-progress';

interface SeriesEpisodesProps {
  seriesId: number;
  seasons: TMDBSeason[];
  selectedSeason: number;
  episodes: TMDBEpisode[];
  today: string;
}

function formatDate(date: string | null): string {
  if (!date) return 'Release date unavailable';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

function formatPosition(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export default function SeriesEpisodes({ seriesId, seasons, selectedSeason, episodes, today }: SeriesEpisodesProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, EpisodeProgress>>({});

  useEffect(() => {
    const refresh = () => {
      const saved = getEpisodeProgress();
      // Carry the current Continue Watching position into the new episode guide.
      for (const entry of getWatchHistory()) {
        if (entry.mediaType !== 'tv' || entry.mediaId !== seriesId || !entry.season || !entry.episode || !entry.positionSeconds) continue;
        const key = episodeProgressId(seriesId, entry.season, entry.episode);
        if (saved[key]) continue;
        const duration = entry.durationSeconds ?? entry.runtimeSeconds;
        saved[key] = {
          positionSeconds: entry.positionSeconds,
          ...(duration ? { durationSeconds: duration } : {}),
          watched: Boolean(duration && entry.positionSeconds >= duration * .95),
          updatedAt: entry.updatedAt,
        };
      }
      setProgress(saved);
    };
    refresh();
    window.addEventListener(EPISODE_PROGRESS_EVENT, refresh);
    window.addEventListener(WATCH_HISTORY_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EPISODE_PROGRESS_EVENT, refresh);
      window.removeEventListener(WATCH_HISTORY_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [seriesId]);

  const availableEpisodes = episodes.filter(episode => {
    const state = progress[episodeProgressId(seriesId, selectedSeason, episode.episode_number)];
    return !episode.air_date || episode.air_date <= today || Boolean(state?.watched || (state?.positionSeconds ?? 0) >= 5);
  });
  const watchedCount = availableEpisodes.filter(episode => progress[episodeProgressId(seriesId, selectedSeason, episode.episode_number)]?.watched).length;
  const allWatched = availableEpisodes.length > 0 && watchedCount === availableEpisodes.length;

  return <section className="series-episodes" aria-labelledby="series-episodes-title">
    <div className="series-episodes-head">
      <div>
        <span className="series-episodes-eyebrow">EPISODE GUIDE</span>
        <h2 id="series-episodes-title">Episodes <span>{watchedCount} of {availableEpisodes.length} watched</span></h2>
      </div>
      <div className="series-episodes-controls">
        {availableEpisodes.length > 0 && <button
          type="button"
          className="series-season-mark"
          onClick={() => setEpisodesWatched(seriesId, selectedSeason, availableEpisodes.map(episode => episode.episode_number), !allWatched)}
        >{allWatched ? '↶ Unmark season' : '✓ Mark season watched'}</button>}
        {seasons.length > 1 && <label className="series-season-select">
          <span className="sr-only">Choose season</span>
          <select
            value={selectedSeason}
            onChange={event => router.push(`/series/${seriesId}?season=${event.target.value}#episodes`)}
          >{seasons.map(season => <option key={season.season_number} value={season.season_number}>Season {season.season_number} ({season.episode_count} episodes)</option>)}</select>
          <span aria-hidden="true">⌄</span>
        </label>}
      </div>
    </div>

    <div className="series-episode-list">
      {episodes.map(episode => {
        const state = progress[episodeProgressId(seriesId, selectedSeason, episode.episode_number)];
        const hasPlayed = Boolean(state?.watched || (state?.positionSeconds ?? 0) >= 5);
        const upcoming = Boolean(episode.air_date && episode.air_date > today && !hasPlayed);
        const daysSinceAir = episode.air_date
          ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${episode.air_date}T00:00:00Z`)) / 86400000)
          : Infinity;
        const watched = !upcoming && Boolean(state?.watched);
        const inProgress = !upcoming && !watched && Boolean(state?.positionSeconds && state.positionSeconds >= 5);
        const isNew = !upcoming && !watched && daysSinceAir >= 0 && daysSinceAir <= 6;
        const href = `/watch/tv/${seriesId}/${selectedSeason}/${episode.episode_number}`;
        const still = getImageUrl(episode.still_path, 'w300');
        const progressPercent = inProgress && state?.durationSeconds
          ? Math.min(100, state.positionSeconds / state.durationSeconds * 100)
          : 0;

        return <article key={episode.id} className={`series-episode-row${upcoming ? ' is-upcoming' : ''}${isNew ? ' is-new' : ''}${watched ? ' is-watched' : ''}`}>
          {upcoming ? <div className="series-episode-thumb series-episode-upcoming-art" aria-label={`Available ${formatDate(episode.air_date)}`}>
            <span>{formatDate(episode.air_date)}</span>
          </div> : <Link href={href} className="series-episode-thumb" aria-label={`Play episode ${episode.episode_number}: ${episode.name}`}>
            <MovieHeroImage src={still} alt={episode.name} fallback={`Episode ${episode.episode_number}`} className="series-episode-still" width={300} height={169} />
            <span className="series-episode-play" aria-hidden="true">▶</span>
            {episode.runtime && <span className="series-episode-runtime">{episode.runtime}m</span>}
            {progressPercent > 0 && <span className="series-episode-progress" aria-hidden="true"><span style={{ width: `${progressPercent}%` }} /></span>}
          </Link>}

          <div className="series-episode-copy">
            <div className="series-episode-titleline">
              <span className="series-episode-index">{episode.episode_number}</span>
              {upcoming ? <h3>{episode.name}</h3> : <Link href={href}><h3>{episode.name}</h3></Link>}
              {isNew && <span className="series-episode-new">NEW</span>}
            </div>
            <div className="series-episode-meta">
              <span>{formatDate(episode.air_date)}</span>
              {!upcoming && episode.vote_average > 0 && <span className="series-episode-rating">★ {episode.vote_average.toFixed(1)}</span>}
              {inProgress && <Link href={href} className="series-episode-continue">Continue · {formatPosition(state!.positionSeconds)}</Link>}
              {watched && <span className="series-episode-watched-label">Watched</span>}
            </div>
            {episode.overview && <details className="series-episode-description">
              <summary>About episode <span aria-hidden="true">⌄</span></summary>
              <p dir="auto">{episode.overview}</p>
            </details>}
          </div>

          <div className="series-episode-trailing">
            {upcoming ? <span className="series-episode-soon">SOON</span> : <button
              type="button"
              className="series-episode-check"
              aria-label={watched ? `Unmark episode ${episode.episode_number} as watched` : `Mark episode ${episode.episode_number} as watched`}
              aria-pressed={watched}
              onClick={() => setEpisodesWatched(seriesId, selectedSeason, [episode.episode_number], !watched)}
            >{watched && <span aria-hidden="true">✓</span>}</button>}
          </div>
        </article>;
      })}
    </div>
  </section>;
}
