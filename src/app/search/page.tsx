import SearchPageContent from '@/components/SearchPageContent';
import { getTrending, searchMovies, searchMulti, searchTV, type TMDBTrending } from '@/lib/tmdb';

export default async function SearchPage({ searchParams }: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? '';
  const type = params.type === 'movie' || params.type === 'tv' ? params.type : 'all';
  const trending = await getTrending().catch(() => [] as TMDBTrending[]);
  const results = query.length < 2 ? trending.filter(item => type === 'all' || item.media_type === type) : await (type === 'movie'
    ? searchMovies(query).then(data => data.results)
    : type === 'tv'
      ? searchTV(query).then(data => data.results)
      : searchMulti(query)).catch(() => [] as TMDBTrending[]);

  return <SearchPageContent initialQuery={query} initialType={type} initialResults={results} trending={trending} />;
}
