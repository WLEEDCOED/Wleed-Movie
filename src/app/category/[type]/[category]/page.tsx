import { notFound } from 'next/navigation';
import { getCategoryPage } from '@/lib/tmdb';
import MediaCard from '@/components/MediaCard';
import Pagination from '@/components/Pagination';


export default async function CategoryPage({ params, searchParams }: { params: Promise<{ type: string; category: string }>; searchParams: Promise<{ page?: string }> }) {
  const { type, category } = await params;
  const { page: pageParam } = await searchParams;
  const categories = {
    'movie/trending': 'Trending Movies',
    'tv/trending': 'Trending Series',
    'movie/top_rated': 'Top Rated Movies',
    'tv/top_rated': 'Top Rated Series',
    'movie/upcoming': 'Upcoming Movies',
    'movie/now_playing': 'Now Playing',
  } as const;
  const title = categories[`${type}/${category}` as keyof typeof categories];
  if (!title) notFound();
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getCategoryPage(type as 'movie' | 'tv', category as 'trending' | 'top_rated' | 'upcoming' | 'now_playing', page);
  const baseUrl = `/category/${type}/${category}`;
  return <div className="catalog-page content-shell"><div className="catalog-heading"><p className="eyebrow">EXPLORE THE CATALOG</p><h1>{title}</h1><p>{result.totalResults.toLocaleString()} titles to discover</p></div>{result.results.length ? <><div className="catalog-grid">{result.results.map((item, index) => <MediaCard key={item.id} item={item} index={index} />)}</div><Pagination currentPage={result.page} totalPages={result.totalPages} baseUrl={baseUrl} searchParams={{}} /></> : <p className="empty-state">No titles available right now.</p>}</div>;
}
