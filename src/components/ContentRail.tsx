'use client';

import { useRef } from 'react';
import Link from 'next/link';
import type { TMDBTrending } from '@/lib/tmdb';
import MediaCard from './MediaCard';

export default function ContentRail({ title, items, href }: { title: string; items: TMDBTrending[]; href?: string }) {
  const rail = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * Math.max(rail.current.clientWidth * 0.8, 260), behavior: 'smooth' });

  return <section className="content-rail" aria-label={title}>
    <div className="rail-heading"><h2>{title}</h2><div className="rail-controls">{href && <Link href={href} className="view-all">View All <span aria-hidden="true">→</span></Link>}<button onClick={() => move(-1)} aria-label={`Scroll ${title} left`}>‹</button><button onClick={() => move(1)} aria-label={`Scroll ${title} right`}>›</button></div></div>
    <div className="rail-track" ref={rail}>{items.slice(0, 12).map((item, index) => <MediaCard key={`${item.media_type}-${item.id}`} item={item} index={index} inRail />)}</div>
  </section>;
}
