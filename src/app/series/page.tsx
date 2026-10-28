import { discoverTV, searchTV } from '@/lib/tmdb';
import { TV_GENRES } from '@/lib/genreData';
import HeroBanner from '@/components/HeroBanner';
import CatalogFilters from '@/components/CatalogFilters';
import MediaCard from '@/components/MediaCard';
import Pagination from '@/components/Pagination';

type SearchParams = { q?: string; provider?: string; genre?: string; year?: string; sort?: string; country?: string; page?: string };

export default async function SeriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = sp.q ? await searchTV(sp.q, page) : await discoverTV({ page, genre: Number(sp.genre) || undefined, year: Number(sp.year) || undefined, provider: Number(sp.provider) || undefined, sort: sp.sort, country: sp.country });
  const heroItems = result.results.filter(item => item.backdrop_path).slice(0, 7);
  return <div className="landing-page">
    {!sp.q && page === 1 && <HeroBanner items={heroItems} />}
    <div className={`landing-content content-shell ${!sp.q && page === 1 && heroItems.length ? '' : 'no-landing-hero'}`}>
      <div className="catalog-heading"><p className="eyebrow">EXPLORE THE CATALOG</p><h1>{sp.q ? `Results for “${sp.q}”` : 'Series'}</h1><p>{result.totalResults.toLocaleString()} titles to discover</p></div>
      {!sp.q && <CatalogFilters baseUrl="/series" genres={TV_GENRES} current={sp} randomHrefs={result.results.map(item => `/series/${item.id}`)} />}
      {result.results.length ? <><div className="catalog-grid">{result.results.map((item, index) => <MediaCard key={item.id} item={item} index={index} />)}</div><Pagination currentPage={result.page} totalPages={result.totalPages} baseUrl="/series" searchParams={sp} /></> : <div className="empty-state"><h2>No shows found</h2><p>Try changing your filters or search.</p></div>}
    </div>
  </div>;
}
