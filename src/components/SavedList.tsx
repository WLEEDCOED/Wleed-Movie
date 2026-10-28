'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readWatchlist } from './WatchlistButton';
import MediaCard from './MediaCard';
import type { TMDBTrending } from '@/lib/tmdb';

export default function SavedList() {
  const [items, setItems] = useState<TMDBTrending[] | null>(null);

  useEffect(() => {
    const refresh = () => setItems(readWatchlist());
    refresh();
    window.addEventListener('watchlist-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('watchlist-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (items === null) return <p className="empty-state">Loading your list…</p>;
  if (items.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon">▱</div>
      <h2>Your list is empty</h2>
      <p>Save movies and shows you want to watch later.</p>
      <Link href="/movies" className="primary-pill">Explore Movies</Link>
    </div>
  );

  return <div className="catalog-grid">{items.map((item, index) => <MediaCard key={`${item.media_type}-${item.id}`} item={item} index={index} />)}</div>;
}
