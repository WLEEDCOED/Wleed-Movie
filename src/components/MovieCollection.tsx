'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import MovieHeroImage from './MovieHeroImage';
import styles from './MovieCollection.module.css';

interface CollectionMovie {
  id: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
}

const WATCHED_MOVIES_KEY = 'wleedmovie-watched-movies-v1';
const WATCHED_MOVIES_EVENT = 'wleedmovie-watched-movies';

function watchedSnapshot() {
  try { return localStorage.getItem(WATCHED_MOVIES_KEY) ?? '[]'; }
  catch { return '[]'; }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === WATCHED_MOVIES_KEY || event.key === null) onChange();
  };
  window.addEventListener(WATCHED_MOVIES_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(WATCHED_MOVIES_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function parseWatched(raw: string): Set<number> {
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) return new Set(value.filter(id => Number.isSafeInteger(id) && id > 0));
  } catch { /* Corrupt storage falls back to an empty list. */ }
  return new Set();
}

function toggleWatched(id: number) {
  const watched = parseWatched(watchedSnapshot());
  if (watched.has(id)) watched.delete(id);
  else watched.add(id);
  try {
    localStorage.setItem(WATCHED_MOVIES_KEY, JSON.stringify([...watched]));
    window.dispatchEvent(new Event(WATCHED_MOVIES_EVENT));
  } catch { /* Storage may be disabled. */ }
}

export default function MovieCollection({ name, movies, currentMovieId }: {
  name: string;
  movies: CollectionMovie[];
  currentMovieId: number;
}) {
  const watched = parseWatched(useSyncExternalStore(subscribe, watchedSnapshot, () => '[]'));
  const watchedCount = movies.filter(movie => watched.has(movie.id)).length;

  return <section className={`content-shell ${styles.collection}`} aria-labelledby="movie-collection-heading">
    <header className={styles.header}>
      <div>
        <h2 id="movie-collection-heading">{name}</h2>
        <p>Release order</p>
      </div>
      <p className={styles.progress} aria-live="polite">{watchedCount} of {movies.length} watched</p>
    </header>
    <ol className={styles.track} aria-label="Movies in release order">
      {movies.map((movie, index) => {
        const current = movie.id === currentMovieId;
        const isWatched = watched.has(movie.id);
        const card = <>
          <MovieHeroImage src={movie.posterUrl} alt={`${movie.title} poster`} fallback={movie.title.charAt(0)} className={styles.poster} width={60} height={90} />
          <div className={styles.copy}>
            <span className={styles.meta}>#{index + 1} · {movie.releaseDate ? <time dateTime={movie.releaseDate}>{movie.releaseDate.slice(0, 4)}</time> : 'Date TBA'}</span>
            <strong>{movie.title}</strong>
            {current && <span className={styles.currentLabel}>Current film</span>}
          </div>
        </>;

        return <li key={movie.id} className={styles.card} aria-current={current ? 'true' : undefined}>
          {current ? <div className={styles.movie}>{card}</div>
            : <Link href={`/movie/${movie.id}`} className={styles.movie} aria-label={movie.title} prefetch={false}>{card}</Link>}
          <button className={styles.watched} type="button" onClick={() => toggleWatched(movie.id)} aria-pressed={isWatched} aria-label={`Watched: ${movie.title}`}>
            {isWatched ? '✓ Watched' : 'Mark watched'}
          </button>
        </li>;
      })}
    </ol>
  </section>;
}
