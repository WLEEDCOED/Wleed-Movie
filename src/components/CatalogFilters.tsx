'use client';

import { useRouter } from 'next/navigation';
import { PROVIDER_BRANDS } from '@/lib/providers';

const genreNames: Record<number, string> = { 28:'Action',35:'Comedy',18:'Drama',27:'Horror',10749:'Romance',878:'Sci-Fi',53:'Thriller',16:'Animation',12:'Adventure',80:'Crime',99:'Documentary',14:'Fantasy',10759:'Action & Adventure',9648:'Mystery',10765:'Sci-Fi & Fantasy',10768:'War',10764:'Reality',10751:'Family' };
const countries = [{ id: 'US', name: 'United States' }, { id: 'GB', name: 'United Kingdom' }, { id: 'KR', name: 'South Korea' }, { id: 'IN', name: 'India' }, { id: 'JP', name: 'Japan' }, { id: 'FR', name: 'France' }];
const sorts = [{ id: 'popularity.desc', name: 'Popular' }, { id: 'vote_average.desc', name: 'Top Rated' }, { id: 'primary_release_date.desc', name: 'Latest' }];

export default function CatalogFilters({ baseUrl, genres, current, randomHrefs }: { baseUrl: string; genres: { id: number; name: string }[]; current: Record<string, string | undefined>; randomHrefs?: string[] }) {
  const router = useRouter();
  const update = (key: string, value: string) => {
    const params = new URLSearchParams();
    Object.entries(current).forEach(([name, selected]) => { if (selected && name !== 'page' && name !== 'q') params.set(name, selected); });
    if (value) params.set(key, value); else params.delete(key);
    router.push(`${baseUrl}${params.size ? `?${params}` : ''}`);
  };
  return <div className="catalog-filters">
    {randomHrefs && randomHrefs.length > 0 && <button className="random-button" type="button" onClick={() => router.push(randomHrefs[Math.floor(Math.random() * randomHrefs.length)])}>⚄ <span>Random</span></button>}
    <label><span className="sr-only">Genre</span><select value={current.genre || ''} onChange={event => update('genre', event.target.value)}><option value="">Genre</option>{genres.map(genre => <option key={genre.id} value={genre.id}>{genreNames[genre.id] || genre.name}</option>)}</select></label>
    <label><span className="sr-only">Year</span><select value={current.year || ''} onChange={event => update('year', event.target.value)}><option value="">Year</option>{Array.from({length:30}, (_, index) => new Date().getFullYear() - index).map(year => <option key={year} value={year}>{year}</option>)}</select></label>
    <label><span className="sr-only">Sort</span><select value={current.sort || 'popularity.desc'} onChange={event => update('sort', event.target.value)}>{sorts.map(sort => <option key={sort.id} value={sort.id}>{sort.name}</option>)}</select></label>
    <label><span className="sr-only">Provider</span><select value={current.provider || ''} onChange={event => update('provider', event.target.value)}><option value="">Provider</option>{PROVIDER_BRANDS.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
    <label><span className="sr-only">Country</span><select value={current.country || ''} onChange={event => update('country', event.target.value)}><option value="">Country</option>{countries.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}</select></label>
    {Object.values(current).some(Boolean) && <button className="clear-filters" type="button" onClick={() => router.push(baseUrl)}>Clear</button>}
  </div>;
}
