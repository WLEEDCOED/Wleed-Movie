'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import MediaCard from './MediaCard';
import { getTitle, type TMDBTrending } from '@/lib/tmdb';

type MediaFilter = 'all' | 'movie' | 'tv';

export default function SearchPageContent({ initialQuery, initialType, initialResults, trending }: {
  initialQuery: string;
  initialType: MediaFilter;
  initialResults: TMDBTrending[];
  trending: TMDBTrending[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<MediaFilter>(initialType);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const firstRender = useRef(true);
  const searchInput = useRef<HTMLInputElement>(null);
  const activeQuery = query.trim();
  const suggestions = trending.slice(0, 4);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams();
      if (activeQuery) params.set('q', activeQuery);
      if (type !== 'all') params.set('type', type);
      window.history.replaceState(null, '', `/search${params.size ? `?${params}` : ''}`);
      if (activeQuery.length < 2) {
        setResults(trending.filter(item => type === 'all' || item.media_type === type));
        setLoading(false);
        setError(false);
        return;
      }
      try {
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json() as { results: TMDBTrending[] };
        setResults(data.results);
        setError(false);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [activeQuery, type, trending]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setLoading(value.trim().length >= 2);
  };

  return <div className="search-page content-shell">
    <div className="search-page-intro">
      <Link className="search-page-back" href="/">← Home</Link>
      <h1>What are you in the mood for?</h1>
      <div className="search-page-controls">
        <label className="search-type-wrap">
          <span className="sr-only">Search category</span>
          <select value={type} onChange={event => { setType(event.target.value as MediaFilter); setLoading(activeQuery.length >= 2); }}>
            <option value="all">Movies &amp; TV</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
          <span aria-hidden="true">⌄</span>
        </label>
        <div className="search-page-field">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 5 5"/></svg>
          <input ref={searchInput} type="search" autoComplete="off" value={query} onChange={event => updateQuery(event.target.value)} placeholder="Search for movies & TV shows..." aria-label="Search movies and TV shows" />
        </div>
      </div>
      {suggestions.length > 0 && <div className="search-suggestions" aria-label="Quick searches">
        {suggestions.map(item => <button key={`${item.media_type}-${item.id}`} type="button" onClick={() => { updateQuery(getTitle(item)); searchInput.current?.focus(); }}>{getTitle(item)}</button>)}
      </div>}
    </div>

    <section className="search-results" aria-live="polite" aria-busy={loading}>
      <h2>{activeQuery.length >= 2 ? `Results for “${activeQuery}”` : 'Trending Now'}</h2>
      {error ? <div className="empty-state"><p>Search is unavailable right now. Please try again.</p></div>
        : results.length ? <div className="catalog-grid">{results.map((item, index) => <MediaCard key={`${item.media_type}-${item.id}`} item={item} index={index} />)}</div>
          : <div className="empty-state"><p>{loading ? 'Searching...' : activeQuery.length >= 2 ? 'No titles found. Try another search.' : 'Trending titles are unavailable right now.'}</p></div>}
    </section>
  </div>;
}
