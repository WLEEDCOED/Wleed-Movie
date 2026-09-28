import { getTrendingTV, searchMulti, getTVByNetwork } from '@/lib/tmdb';
import type { TMDBTrending } from '@/lib/tmdb';
import SearchForm from '@/components/SearchForm';
import MediaCard from '@/components/MediaCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const NETWORKS = [
  { id: 213, name: 'Netflix', color: 'from-red-600 to-red-900' },
  { id: 2552, name: 'Apple TV+', color: 'from-slate-700 to-black' },
  { id: 49, name: 'HBO', color: 'from-purple-600 to-indigo-900' },
  { id: 119, name: 'Amazon Prime', color: 'from-blue-500 to-cyan-800' },
  { id: 2739, name: 'Disney+', color: 'from-blue-700 to-blue-900' },
];

export default async function SeriesPage({ searchParams }: { searchParams: Promise<{ q?: string; network?: string }> }) {
  let series: TMDBTrending[] = [];
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';
  const networkId = resolvedSearchParams.network ? parseInt(resolvedSearchParams.network) : null;

  try {
    if (query) {
      const results = await searchMulti(query);
      series = results.filter((item) => item.media_type === 'tv');
    } else if (networkId) {
      series = await getTVByNetwork(networkId);
    } else {
      series = await getTrendingTV();
    }
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
  }

  const activeNetwork = NETWORKS.find(n => n.id === networkId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
          <span className="w-2 h-10 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
          {query ? `نتائج البحث عن: ${query}` : activeNetwork ? `مسلسلات ${activeNetwork.name}` : 'المسلسلات'}
        </h1>
        <div className="w-full md:w-96">
          <SearchForm />
        </div>
      </div>

      {!query && (
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/series"
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              !networkId ? 'bg-white text-black shadow-lg shadow-white/20' : 'glass text-neutral-300 hover:bg-white/10'
            }`}
          >
            الكل
          </Link>
          {NETWORKS.map(net => (
            <Link
              key={net.id}
              href={`/series?network=${net.id}`}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                networkId === net.id 
                  ? `bg-gradient-to-r ${net.color} text-white shadow-lg` 
                  : 'glass text-neutral-300 hover:bg-white/10'
              }`}
            >
              {net.name}
            </Link>
          ))}
        </div>
      )}

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
