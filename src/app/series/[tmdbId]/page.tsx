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
    (s) => s.season_number > 0 && s.episode_count > 0
  );

  const seasonsWithEpisodes = await Promise.all(
    validSeasons.map(async (season) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-6 group">
        <svg className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        العودة للرئيسية
      </Link>

      {backdrop && (
        <div className="relative rounded-2xl overflow-hidden mb-8 h-64 md:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backdrop} alt={series.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 mb-10 animate-fade-in">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden border border-neutral-800/50 shadow-2xl">
            {poster ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={poster} alt={series.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <span className="text-6xl font-black text-neutral-700">{series.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black mb-4 gradient-text">{series.name}</h1>
          {series.overview && <p className="text-neutral-300 text-lg leading-relaxed mb-6">{series.overview}</p>}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="glass rounded-lg px-4 py-2 text-sm">
              <span className="text-neutral-400">المواسم:</span> <span className="font-bold text-white">{series.number_of_seasons}</span>
            </div>
            <div className="glass rounded-lg px-4 py-2 text-sm">
              <span className="text-neutral-400">الحلقات:</span> <span className="font-bold text-white">{series.number_of_episodes}</span>
            </div>
            {series.vote_average > 0 && (
              <div className="glass rounded-lg px-4 py-2 text-sm">
                <span className="text-yellow-400">⭐</span> <span className="font-bold text-white">{series.vote_average.toFixed(1)}</span>
              </div>
            )}
          </div>
          {series.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {series.genres.map((g) => (
                <span key={g.id} className="glass rounded-full px-3 py-1 text-xs text-neutral-300">{g.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {seasonsWithEpisodes.map(({ season, episodes }) => (
        <section key={season.season_number} className="mb-10 animate-slide-up">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
            {season.name || `الموسم ${season.season_number}`}
            <span className="text-sm text-neutral-500 font-normal">({episodes.length} حلقة)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {episodes.map((ep) => {
              const still = getImageUrl(ep.still_path, 'w300');
              return (
                <Link key={ep.id} href={`/watch/tv/${tmdbId}/${season.season_number}/${ep.episode_number}`} className="group block">
                  <div className="glass rounded-xl overflow-hidden card-hover group-hover:border-blue-500/30 transition-all">
                    {still ? (
                      <div className="aspect-video relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={still} alt={ep.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-1.5 right-1.5 glass rounded px-1.5 py-0.5 text-[10px]">E{ep.episode_number}</div>
                      </div>
                    ) : null}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 rounded px-2 py-0.5">S{season.season_number} · E{ep.episode_number}</span>
                      </div>
                      <h3 className="text-xs font-semibold truncate group-hover:text-blue-400 transition-colors">{ep.name}</h3>
                      <div className="mt-2 flex items-center justify-center gap-1.5 btn-premium rounded-lg py-1.5 text-[11px] font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        مشاهدة
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
