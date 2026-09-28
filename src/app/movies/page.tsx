import { getTrendingMovies, searchMulti, getMoviesByProvider } from '@/lib/tmdb';
import type { TMDBTrending } from '@/lib/tmdb';
import SearchForm from '@/components/SearchForm';
import MediaCard from '@/components/MediaCard';
import NetworkFilters, { PROVIDERS } from '@/components/NetworkFilters';

export const dynamic = 'force-dynamic';

export default async function MoviesPage({ searchParams }: { searchParams: Promise<{ q?: string; provider?: string }> }) {
  let movies: TMDBTrending[] = [];
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';
  const providerId = resolvedSearchParams.provider ? parseInt(resolvedSearchParams.provider) : null;

  try {
    if (query) {
      const results = await searchMulti(query);
      movies = results.filter((item) => item.media_type === 'movie');
    } else if (providerId) {
      movies = await getMoviesByProvider(providerId);
    } else {
      movies = await getTrendingMovies();
    }
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
  }

  const activeProvider = PROVIDERS.find(n => n.id === providerId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
          <span className="w-2 h-10 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
          {query ? `نتائج البحث عن: ${query}` : activeProvider ? `أفلام ${activeProvider.short}` : 'الأفلام'}
        </h1>
        <div className="w-full md:w-96">
          <SearchForm />
        </div>
      </div>

      {!query && <NetworkFilters activeProviderId={providerId} baseUrl="/movies" />}

      {movies.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500 text-lg">
            {query ? `لم يتم العثور على أفلام لـ "${query}"` : 'تعذر تحميل الأفلام.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
          {movies.map((item, index) => (
            <MediaCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
