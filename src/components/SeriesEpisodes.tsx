'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MovieHeroImage from './MovieHeroImage';
import EpisodeOverview from './EpisodeOverview';
import type { TMDBEpisode, TMDBSeason } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { episodeDateStatus, riyadhToday } from '@/lib/episode-dates';
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
  if (!date || episodeDateStatus(date, date) === 'unknown') return 'Release date unavailable';
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
  const [currentDate, setCurrentDate] = useState(today);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const episodeList = useRef<HTMLDivElement>(null);
  const [subtitleAvailability, setSubtitleAvailability] = useState<{ key: string; episodes: number[] } | null>(null);

  useEffect(() => {
    const refreshDate = () => setCurrentDate(riyadhToday());
    refreshDate();
    const interval = window.setInterval(refreshDate, 60_000);
    window.addEventListener('focus', refreshDate);
    document.addEventListener('visibilitychange', refreshDate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshDate);
      document.removeEventListener('visibilitychange', refreshDate);
    };
  }, []);

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
    const status = episodeDateStatus(episode.air_date, currentDate, Boolean(state?.watched || (state?.positionSeconds ?? 0) >= 5));
    return status === 'released' || status === 'unknown';
  });
  const watchedCount = availableEpisodes.filter(episode => progress[episodeProgressId(seriesId, selectedSeason, episode.episode_number)]?.watched).length;
  const allWatched = availableEpisodes.length > 0 && watchedCount === availableEpisodes.length;
  const seasonKey = `${seriesId}:${selectedSeason}`;
  const eligibleSubtitleEpisodes = availableEpisodes.map(episode => episode.episode_number).join(',');
  const subtitledEpisodes = subtitleAvailability?.key === seasonKey ? subtitleAvailability.episodes : [];

  useEffect(() => {
    const rows = episodeList.current?.querySelectorAll<HTMLElement>('[data-subtitle-episode]');
    if (!eligibleSubtitleEpisodes || !rows?.length) return;
    const controller = new AbortController();
    const queue = new Set<number>();
    let checking = false;

    async function checkVisibleEpisodes() {
      if (checking) return;
      checking = true;
      while (queue.size && !controller.signal.aborted) {
        const batch = [...queue].slice(0, 4);
        batch.forEach(episode => queue.delete(episode));
        const params = new URLSearchParams({ tmdbId: String(seriesId), season: String(selectedSeason), episodes: batch.join(',') });
        try {
          const response = await fetch('/api/subtitles/availability?' + params, { signal: controller.signal });
          if (!response.ok) continue;
          const { available } = await response.json() as { available: number[] };
          if (available.length && !controller.signal.aborted) {
            setSubtitleAvailability(current => ({
              key: seasonKey,
              episodes: [...new Set([...(current?.key === seasonKey ? current.episodes : []), ...available])],
            }));
          }
        } catch { /* A failed lookup leaves the badge hidden. */ }
      }
      checking = false;
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        queue.add(Number((entry.target as HTMLElement).dataset.subtitleEpisode));
        observer.unobserve(entry.target);
      }
      void checkVisibleEpisodes();
    }, { rootMargin: '150px 0px' });
    rows.forEach(row => observer.observe(row));
    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [eligibleSubtitleEpisodes, seasonKey, selectedSeason, seriesId]);

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

    <div className="series-episode-list" ref={episodeList}>
      {episodes.map(episode => {
        const state = progress[episodeProgressId(seriesId, selectedSeason, episode.episode_number)];
        const hasPlayed = Boolean(state?.watched || (state?.positionSeconds ?? 0) >= 5);
        const dateStatus = episodeDateStatus(episode.air_date, currentDate, hasPlayed);
        const upcoming = dateStatus === 'upcoming' || dateStatus === 'check';
        const isCheckable = dateStatus === 'check';
        const daysSinceAir = episode.air_date
          ? Math.round((Date.parse(`${currentDate}T00:00:00Z`) - Date.parse(`${episode.air_date}T00:00:00Z`)) / 86400000)
          : Infinity;
        const watched = !upcoming && Boolean(state?.watched);
        const inProgress = !upcoming && !watched && Boolean(state?.positionSeconds && state.positionSeconds >= 5);
        const isNew = !upcoming && !watched && daysSinceAir >= 0 && daysSinceAir <= 6;
        const href = `/watch/tv/${seriesId}/${selectedSeason}/${episode.episode_number}`;
        const still = getImageUrl(episode.still_path, 'w300');
        const progressPercent = inProgress && state?.durationSeconds
          ? Math.min(100, state.positionSeconds / state.durationSeconds * 100)
          : 0;

        return <article key={episode.id} data-subtitle-episode={upcoming ? undefined : episode.episode_number} className={`series-episode-row${upcoming ? ' is-upcoming' : ''}${isCheckable ? ' is-checkable' : ''}${isNew ? ' is-new' : ''}${watched ? ' is-watched' : ''}`}>
          {upcoming ? <div className="series-episode-thumb series-episode-upcoming-art" aria-label={`Scheduled ${formatDate(episode.air_date)}`}>
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
              {isCheckable && <Link href={href} className="series-episode-continue" aria-label={`Check playback for episode ${episode.episode_number}: ${episode.name}`}>Check availability →</Link>}
              {inProgress && <Link href={href} className="series-episode-continue">Continue · {formatPosition(state!.positionSeconds)}</Link>}
              {watched && <span className="series-episode-watched-label">Watched</span>}
              {!upcoming && subtitledEpisodes.includes(episode.episode_number) && <span lang="ar" dir="rtl" className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">ترجمة عربية متوفرة</span>}
            </div>
            {episode.overview && <details className="series-episode-description"
              onToggle={event => {
                const open = event.currentTarget.open;
                const key = `${selectedSeason}:${episode.episode_number}`;
                setExpandedDescriptions(current => ({ ...current, [key]: open }));
              }}>
              <summary>About episode <span aria-hidden="true">⌄</span></summary>
              {expandedDescriptions[`${selectedSeason}:${episode.episode_number}`]
                ? <EpisodeOverview tmdbId={seriesId} season={selectedSeason} episode={episode.episode_number}
                    overview={episode.overview} sourceOverview={episode.sourceOverview} />
                : <p dir="rtl">{episode.overview}</p>}
            </details>}
          </div>

          <div className="series-episode-trailing">
            {upcoming ? <span className="series-episode-soon">{isCheckable ? 'CHECK' : 'SOON'}</span> : <button
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
