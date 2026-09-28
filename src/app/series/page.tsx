import { getTrendingTV, searchMulti, getTVByProvider } from '@/lib/tmdb';
import type { TMDBTrending } from '@/lib/tmdb';
import SearchForm from '@/components/SearchForm';
import MediaCard from '@/components/MediaCard';
import NetworkFilters, { PROVIDERS } from '@/components/NetworkFilters';

export const dynamic = 'force-dynamic';

export default async function SeriesPage({ searchParams }: { searchParams: Promise<{ q?: string; provider?: string }> }) {
  let series: TMDBTrending[] = [];
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';
  const providerId = resolvedSearchParams.provider ? parseInt(resolvedSearchParams.provider) : null;

  try {
    if (query) {
      const results = await searchMulti(query);
      series = results.filter((item) => item.media_type === 'tv');
    } else if (providerId) {
      series = await getTVByProvider(providerId);
    } else {
      series = await getTrendingTV();
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
          {query ? `نتائج البحث عن: ${query}` : activeProvider ? `مسلسلات ${activeProvider.short}` : 'المسلسلات'}
        </h1>
        <div className="w-full md:w-96">
          <SearchForm />
        </div>
      </div>

      {!query && <NetworkFilters activeProviderId={providerId} baseUrl="/series" />}

      {series.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500 text-lg">
            {query ? `لم يتم العثور على مسلسلات لـ "${query}"` : 'تعذر تحميل المسلسلات.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
          {series.map((item, index) => (
            <MediaCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
