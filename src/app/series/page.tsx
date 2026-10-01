import { Suspense } from 'react';
import { discoverTV, searchTV } from '@/lib/tmdb';
import SearchForm from '@/components/SearchForm';
import MediaCard from '@/components/MediaCard';
import NetworkFilters, { PROVIDERS } from '@/components/NetworkFilters';
import GenreFilters, { TV_GENRES } from '@/components/GenreFilters';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  provider?: string;
  genre?: string;
  year?: string;
  page?: string;
}

export default async function SeriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const query = sp.q || '';
  const providerId = sp.provider ? parseInt(sp.provider) : undefined;
  const genreId = sp.genre ? parseInt(sp.genre) : undefined;
  const year = sp.year ? parseInt(sp.year) : undefined;
  const page = sp.page ? parseInt(sp.page) : 1;

  let result = { results: [] as any[], totalPages: 1, totalResults: 0, page: 1 };

  try {
    if (query) {
      result = await searchTV(query, page);
    } else {
      result = await discoverTV({ page, genre: genreId, year, provider: providerId });
    }
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
  }

  const activeProvider = PROVIDERS.find(n => n.id === providerId);
  const activeGenre = TV_GENRES.find(g => g.id === genreId);

  const spRecord: Record<string, string | undefined> = {
    q: sp.q,
    provider: sp.provider,
    genre: sp.genre,
    year: sp.year,
  };

  let pageTitle = 'المسلسلات';
  if (query) pageTitle = `نتائج: ${query}`;
  else if (activeProvider && activeGenre) pageTitle = `${activeGenre.name} • ${activeProvider.short}`;
  else if (activeProvider) pageTitle = `مسلسلات ${activeProvider.short}`;
  else if (activeGenre) pageTitle = activeGenre.name;
  else if (year) pageTitle = `مسلسلات ${year}`;

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span className="w-1 h-5 sm:h-7 bg-red-600 rounded-full" />
              {pageTitle}
            </h1>
            {result.totalResults > 0 && (
              <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 mr-3">
                {result.totalResults.toLocaleString('ar-SA')} نتيجة · ص {result.page}/{result.totalPages}
              </p>
            )}
          </div>
          <div className="w-48 sm:w-72">
            <SearchForm />
          </div>
        </div>

        {/* Provider filter */}
        {!query && <NetworkFilters activeProviderId={providerId ?? null} baseUrl="/series" />}

        {/* Genre & Year filters */}
        {!query && (
          <Suspense fallback={null}>
            <GenreFilters
              genres={TV_GENRES}
              activeGenre={genreId ?? null}
              activeYear={year ?? null}
              baseUrl="/series"
              currentProvider={providerId}
            />
          </Suspense>
        )}

        {/* Grid */}
        {result.results.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-neutral-500 text-lg">
              {query ? `لم يتم العثور على مسلسلات لـ "${query}"` : 'لا توجد مسلسلات بهذه الفلاتر.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {result.results.map((item, index) => (
                <MediaCard key={item.id} item={item} index={index} />
              ))}
            </div>

            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              baseUrl="/series"
              searchParams={spRecord}
            />
          </>
        )}
      </div>
    </div>
  );
}
