'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TMDBTrending, getImageUrl, getTitle, getLink, getYear } from '@/lib/tmdb';
import WatchlistButton from './WatchlistButton';

export default function HeroBanner({ items }: { items: TMDBTrending[] }) {
  const slides = items.filter(item => item.backdrop_path).slice(0, 7);
  const [active, setActive] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    let interval: number | undefined;
    let inView = true;
    const syncInterval = () => {
      if (interval) window.clearInterval(interval);
      interval = undefined;
      if (inView && document.visibilityState === 'visible') {
        interval = window.setInterval(() => setActive(index => (index + 1) % slides.length), 7000);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncInterval();
    }, { threshold: 0.01 });
    if (heroRef.current) observer.observe(heroRef.current);
    document.addEventListener('visibilitychange', syncInterval);
    syncInterval();
    return () => {
      if (interval) window.clearInterval(interval);
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncInterval);
    };
  }, [slides.length]);

  if (slides.length === 0) return null;
  const item = slides[active];
  const title = getTitle(item);
  const backdrop = getImageUrl(item.backdrop_path, 'w1280');

  return (
    <section className="feature-hero" aria-label="Featured titles" ref={heroRef}>
      <div key={item.id} className="feature-backdrop" style={{ backgroundImage: `url(${backdrop})` }} />
      <div className="feature-shade" />
      <div className="feature-content content-shell" key={`${item.id}-content`}>
        <span className="feature-kicker">FEATURED NOW <span className="kicker-line" /></span>
        <h1 className={title.length > 28 ? 'feature-title-long' : undefined}>{title}</h1>
        <div className="feature-meta"><span className="star">★</span><strong>{item.vote_average ? `${item.vote_average.toFixed(1)}/10` : 'New'}</strong><span className="dot">•</span><span>{getYear(item)}</span><span className="dot">•</span><span>{item.media_type === 'tv' ? 'TV Series' : 'Movie'}</span></div>
        <p dir="auto">{item.overview || 'No Arabic overview is available.'}</p>
        <div className="feature-actions">
          <Link href={getLink(item)} className="play-pill"><span>▶</span> Play</Link>
          <div className="feature-secondary"><WatchlistButton item={item} /><span className="action-divider" /><Link href={getLink(item)} className="hero-icon-button" aria-label="More details" title="More details">ⓘ</Link></div>
        </div>
      </div>
      {slides.length > 1 && <div className="hero-dots" aria-label="Choose featured title">{slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActive(index)} className={index === active ? 'active' : ''} aria-label={`Show featured title ${index + 1}`} aria-current={index === active ? 'true' : undefined} />)}</div>}
    </section>
  );
}
