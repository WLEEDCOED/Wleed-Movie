import Link from 'next/link';
import { getTrending, getTrendingTV, getTrendingMovies, searchMulti, getImageUrl, getTitle, getLink, getYear, getMediaTypeLabel, getByProvider, getTVByProvider, getMoviesByProvider } from '@/lib/tmdb';
import type { TMDBTrending } from '@/lib/tmdb';
import SearchForm from '@/components/SearchForm';
import NetworkFilters, { PROVIDERS } from '@/components/NetworkFilters';
import HeroBanner from '@/components/HeroBanner';

export const dynamic = 'force-dynamic';

import MediaCard from '@/components/MediaCard';

function Section({ title, items, showAll }: { title: string; items: TMDBTrending[]; showAll?: string }) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-800 rounded-full" />
          {title}
        </h2>
        {showAll && (
          <span className="text-sm text-neutral-500">{items.length} عنصر</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
        {items.slice(0, 18).map((item, index) => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; provider?: string }> }) {
  let trending: TMDBTrending[] = [];
  let trendingTV: TMDBTrending[] = [];
  let trendingMovies: TMDBTrending[] = [];
  let searchResults: TMDBTrending[] = [];
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';
  const providerId = resolvedSearchParams.provider ? parseInt(resolvedSearchParams.provider) : null;

  try {
    if (query) {
      searchResults = await searchMulti(query);
    } else if (providerId) {
      [trending, trendingTV, trendingMovies] = await Promise.all([
        getByProvider(providerId),
        getTVByProvider(providerId),
        getMoviesByProvider(providerId),
      ]);
    } else {
      [trending, trendingTV, trendingMovies] = await Promise.all([
        getTrending(),
        getTrendingTV(),
        getTrendingMovies(),
      ]);
    }
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
  }

  const activeProvider = PROVIDERS.find(n => n.id === providerId);
  const heroItem = trending.length > 0 ? trending[0] : null;

  return (
    <div className="w-full">
      {!query && heroItem && (
        <HeroBanner item={heroItem} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-10 relative z-20">

      {!query && <NetworkFilters activeProviderId={providerId} baseUrl="/" />}

      {query ? (
        searchResults.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">لم يتم العثور على نتائج لـ "{query}"</p>
          </div>
        ) : (
          <Section title={`نتائج البحث عن: ${query}`} items={searchResults} />
        )
      ) : (
        trending.length === 0 && trendingTV.length === 0 && trendingMovies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-neutral-500 text-lg">تعذر تحميل المحتوى. تأكد من مفتاح TMDB API.</p>
          </div>
        ) : (
          <>
            {trending.length > 0 && (
              <Section title={activeProvider ? `الأكثر مشاهدة على ${activeProvider.short}` : "🔥 الأكثر مشاهدة هذا الأسبوع"} items={trending} />
            )}
            {trendingTV.length > 0 && (
              <Section title={activeProvider ? `مسلسلات ${activeProvider.short}` : "📺 مسلسلات رائجة"} items={trendingTV} />
            )}
            {trendingMovies.length > 0 && (
              <Section title={activeProvider ? `أفلام ${activeProvider.short}` : "🎬 أفلام رائجة"} items={trendingMovies} />
            )}
          </>
        )
      )}
      </div>
    </div>
  );
}
