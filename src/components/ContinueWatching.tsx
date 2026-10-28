'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getWatchHistory, removeWatchEntry, WATCH_HISTORY_EVENT, type WatchEntry } from '@/lib/watch-history';

function remainingLabel(entry: WatchEntry) {
  if (entry.positionSeconds === undefined || entry.positionSeconds < 5) return 'Continue watching';
  const seconds = Math.floor(entry.positionSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  return `Resume at ${hours ? `${hours}:${String(minutes).padStart(2, '0')}` : minutes}:${remainder}`;
}

function progressPercent(entry: WatchEntry): number | null {
  const duration = entry.durationSeconds ?? entry.runtimeSeconds;
  if (entry.positionSeconds === undefined || !duration) return null;
  return Math.min(100, Math.max(0, entry.positionSeconds / duration * 100));
}

export default function ContinueWatching() {
  const [entries, setEntries] = useState<WatchEntry[]>([]);

  useEffect(() => {
    const refresh = () => setEntries(getWatchHistory());
    refresh();
    window.addEventListener(WATCH_HISTORY_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(WATCH_HISTORY_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!entries.length) return null;

  return <section className="continue-section" aria-label="Continue Watching">
    <div className="rail-heading"><h2>Continue Watching</h2></div>
    <div className="continue-track">
      {entries.map(entry => <article className="continue-card" key={`${entry.mediaType}-${entry.mediaId}`}>
        <Link href={entry.href} className="continue-link" aria-label={`Continue ${entry.title}${entry.season ? `, season ${entry.season} episode ${entry.episode}` : ''}`}>
          <div className="continue-image">
            {entry.imageUrl ? <Image src={entry.imageUrl} alt="" fill sizes="(max-width: 740px) 250px, 290px" /> : <span className="continue-fallback">{entry.title.charAt(0)}</span>}
            {progressPercent(entry) !== null && <span className="continue-progress"><span style={{ width: `${progressPercent(entry)}%` }} /></span>}
            <span className="continue-play" aria-hidden="true">▶</span>
          </div>
          <h3>{entry.title}</h3>
          <p>{entry.season && entry.episode ? <span>S{entry.season}:E{entry.episode} · </span> : null}<span aria-hidden="true">◷ </span>{remainingLabel(entry)}</p>
        </Link>
        <button type="button" className="continue-remove" aria-label={`Remove ${entry.title} from Continue Watching`} onClick={() => removeWatchEntry(entry.mediaType, entry.mediaId)}>×</button>
      </article>)}
    </div>
  </section>;
}
