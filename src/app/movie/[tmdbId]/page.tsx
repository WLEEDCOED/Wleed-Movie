import { getMovieDetail, getImageUrl } from '@/lib/tmdb';
import { generateMovieServers } from '@/lib/servers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ServerSwitcher from '@/components/ServerSwitcher';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ tmdbId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tmdbId } = await params;
  try {
    const movie = await getMovieDetail(parseInt(tmdbId));
    return {
      title: `${movie.title} | WleedMovie`,
      description: movie.overview || `شاهد فيلم ${movie.title} مترجم`,
    };
  } catch {
    return { title: 'غير موجود' };
  }
}

export const dynamic = 'force-dynamic';

export default async function MoviePage({ params }: PageProps) {
  const { tmdbId: tmdbIdStr } = await params;
  const tmdbId = parseInt(tmdbIdStr);
  if (isNaN(tmdbId)) notFound();

  let movie;
  try {
    movie = await getMovieDetail(tmdbId);
  } catch {
    notFound();
  }

  const servers = generateMovieServers(tmdbId);
  const backdrop = getImageUrl(movie.backdrop_path, 'w1280');
  const poster = getImageUrl(movie.poster_path);

  return (
    <div className="w-full">
      {/* Full Bleed Backdrop */}
      <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[75vh] flex items-end pb-8 sm:pb-12">
        <div className="absolute inset-0 z-0">
          {backdrop && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={backdrop} alt={movie.title} className="w-full h-full object-cover" />
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
                  <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            
            {/* Info */}
            <div className="flex-1 animate-slide-up">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 mb-2">
                <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
                <span>/</span>
                <span className="text-white truncate max-w-[150px] sm:max-w-none">{movie.title}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 text-white drop-shadow-md leading-tight">{movie.title}</h1>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                {movie.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500 font-bold bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    ⭐ {movie.vote_average.toFixed(1)}
                  </span>
                )}
                {movie.release_date && <span className="text-neutral-300 font-medium bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">{movie.release_date.substring(0, 4)}</span>}
                {movie.runtime && movie.runtime > 0 ? <span className="text-neutral-300 font-medium bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">{movie.runtime} دقيقة</span> : null}
              </div>

              {movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                  {movie.genres.map((g: any) => (
                    <span key={g.id} className="bg-red-600/20 text-red-100 border border-red-500/30 rounded-full px-3 py-0.5 text-[11px] sm:text-xs font-bold tracking-wide">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
              
              {movie.overview && <p className="hidden sm:block text-neutral-300 leading-relaxed max-w-3xl drop-shadow text-sm sm:text-base">{movie.overview}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 md:mt-10 relative z-20">
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <ServerSwitcher servers={servers} />
        </div>
      </div>
    </div>
  );
}
