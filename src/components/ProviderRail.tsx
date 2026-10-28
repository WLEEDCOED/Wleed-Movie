'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { PROVIDER_BRANDS } from '@/lib/providers';

export default function ProviderRail() {
  const rail = useRef<HTMLDivElement>(null);
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * 450, behavior: 'smooth' });
  return <section className="provider-section" aria-label="Browse by provider">
    <div className="rail-heading"><h2>Browse by Provider</h2><div className="rail-controls"><button onClick={() => move(-1)} aria-label="Scroll providers left">‹</button><button onClick={() => move(1)} aria-label="Scroll providers right">›</button></div></div>
    <div className="provider-track" ref={rail}>{PROVIDER_BRANDS.map(provider => <Link key={provider.id} href={`/provider/${provider.id}`} className="provider-item"><span className={`provider-logo ${provider.cls}`}>{provider.mark}</span><span className="provider-name">{provider.name}</span></Link>)}</div>
  </section>;
}
