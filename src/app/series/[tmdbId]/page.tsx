import { getSeriesDetail, getSeasonEpisodes, getImageUrl } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ tmdbId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tmdbId } = await params;
  try {
    const series = await getSeriesDetail(parseInt(tmdbId));
    return {
      title: `${series.name} | WleedMovie`,
      description: series.overview || `شاهد مسلسل ${series.name} مترجم`,
    };
  } catch {
    return { title: 'غير موجود' };
  }
}

export const dynamic = 'force-dynamic';

export default async function SeriesPage({ params }: PageProps) {
  const { tmdbId: tmdbIdStr } = await params;
  const tmdbId = parseInt(tmdbIdStr);
  if (isNaN(tmdbId)) notFound();

  let series;
  try {
    series = await getSeriesDetail(tmdbId);
  } catch {
    notFound();
  }

  const validSeasons = series.seasons.filter(
    (s: any) => s.season_number > 0 && s.episode_count > 0
  );

  const seasonsWithEpisodes = await Promise.all(
    validSeasons.map(async (season: any) => {
      try {
        const episodes = await getSeasonEpisodes(tmdbId, season.season_number);
        return { season, episodes };
      } catch {
        return { season, episodes: [] };
      }
    })
  );

  const poster = getImageUrl(series.poster_path);
  const backdrop = getImageUrl(series.backdrop_path, 'w1280');

  return (
    <div className="w-full">
      {/* Full Bleed Backdrop */}
      <div className="relative w-full h-[60vh] md:h-[75vh] flex items-end pb-12">
        <div className="absolute inset-0 z-0">
          {backdrop && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={backdrop} alt={series.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-end md:items-stretch">
            {/* Poster */}
            {poster && (
              <div className="hidden md:block w-56 flex-shrink-0 -mb-20 z-20">
                <div className="aspect-[2/3] rounded-xl overflow-hidden border border-neutral-800/50 shadow-2xl shadow-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={poster} alt={series.name} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            
            {/* Info */}
            <div className="flex-1 animate-slide-up">
              <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
                <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
                <span>/</span>
                <span className="text-white">{series.name}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 text-white drop-shadow-md">{series.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                {series.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500 font-bold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    ⭐ {series.vote_average.toFixed(1)}
                  </span>
                )}
                <span className="text-neutral-300 font-medium bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">{series.number_of_seasons} مواسم</span>
                <span className="text-neutral-300 font-medium bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">{series.number_of_episodes} حلقة</span>
              </div>

              {series.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {series.genres.map((g: any) => (
                    <span key={g.id} className="bg-red-600/20 text-red-100 border border-red-500/30 rounded-full px-4 py-1 text-xs font-bold tracking-wide">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
              
              {series.overview && <p className="text-neutral-300 leading-relaxed max-w-3xl drop-shadow">{series.overview}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 md:mt-10 relative z-20">
        {seasonsWithEpisodes.map(({ season, episodes }) => (
          <section key={season.season_number} className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-red-600 to-red-800 rounded-full" />
              {season.name || `الموسم ${season.season_number}`}
              <span className="text-sm text-neutral-500 font-normal mt-1">({episodes.length} حلقة)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {episodes.map((ep: any) => {
                const still = getImageUrl(ep.still_path, 'w300');
                return (
                  <Link key={ep.id} href={`/watch/tv/${tmdbId}/${season.season_number}/${ep.episode_number}`} className="group block card-hover">
                    <div className="flex flex-col gap-2">
                      <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/20 group-hover:border-red-600/50 transition-colors shadow-lg">
                        <div className="aspect-video relative overflow-hidden bg-neutral-900">
                          {still ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={still} alt={ep.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-700 font-bold">
                              E{ep.episode_number}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-red-900/50">
                              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-1 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-0.5">
                          <span>S{season.season_number} · E{ep.episode_number}</span>
                        </div>
                        <h3 className="font-bold text-sm truncate group-hover:text-red-500 transition-colors text-white">{ep.name}</h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
