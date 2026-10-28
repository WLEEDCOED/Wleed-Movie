import { discoverMovies, searchMovies, getUpcomingMovies } from '@/lib/tmdb';
import { MOVIE_GENRES } from '@/lib/genreData';
import HeroBanner from '@/components/HeroBanner';
import ContentRail from '@/components/ContentRail';
import CatalogFilters from '@/components/CatalogFilters';
import MediaCard from '@/components/MediaCard';
import Pagination from '@/components/Pagination';

type SearchParams = { q?: string; provider?: string; genre?: string; year?: string; sort?: string; country?: string; page?: string };

export default async function MoviesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = sp.q ? await searchMovies(sp.q, page) : await discoverMovies({ page, genre: Number(sp.genre) || undefined, year: Number(sp.year) || undefined, provider: Number(sp.provider) || undefined, sort: sp.sort, country: sp.country });
  const upcoming = !sp.q && page === 1 ? await getUpcomingMovies() : [];
  const heroItems = result.results.filter(item => item.backdrop_path).slice(0, 7);
  return <div className="landing-page">
    {!sp.q && page === 1 && <HeroBanner items={heroItems} />}
    <div className={`landing-content content-shell ${!sp.q && page === 1 && heroItems.length ? '' : 'no-landing-hero'}`}>
      <div className="catalog-heading"><p className="eyebrow">EXPLORE THE CATALOG</p><h1>{sp.q ? `Results for “${sp.q}”` : 'Movies'}</h1><p>{result.totalResults.toLocaleString()} titles to discover</p></div>
      {!sp.q && <CatalogFilters baseUrl="/movies" genres={MOVIE_GENRES} current={sp} randomHrefs={result.results.map(item => `/movie/${item.id}`)} />}
      {upcoming.length > 0 && <ContentRail title="Upcoming" items={upcoming} href="/category/movie/upcoming" />}
      {result.results.length ? <><div className="catalog-grid">{result.results.map((item, index) => <MediaCard key={item.id} item={item} index={index} />)}</div><Pagination currentPage={result.page} totalPages={result.totalPages} baseUrl="/movies" searchParams={sp} /></> : <div className="empty-state"><h2>No movies found</h2><p>Try changing your filters or search.</p></div>}
    </div>
  </div>;
}
