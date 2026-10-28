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
      title: `Watch ${movie.title} | WleedMovie`,
      description: movie.overview,
    };
  } catch {
    return { title: 'Not found' };
  }
}

export default async function WatchMoviePage({ params }: PageProps) {
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
  const poster = getImageUrl(movie.poster_path, 'w300');

  return (
    <div className="watch-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="watch-breadcrumb flex items-center gap-2 text-sm text-neutral-400 mb-4 animate-fade-in">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <span className="text-white">{movie.title}</span>
      </div>

      <div className="flex items-start gap-4 mb-6 animate-fade-in">
        {poster && (
          <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-800/50 hidden sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">{movie.title}</h1>
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            {movie.release_date && <span>{movie.release_date.substring(0, 4)}</span>}
            {movie.runtime && <span>{movie.runtime} min</span>}
            {movie.vote_average > 0 && <span className="text-yellow-400">⭐ {movie.vote_average.toFixed(1)}</span>}
          </div>
        </div>
      </div>

      <div className="animate-slide-up">
        <ServerSwitcher servers={servers} tmdbId={tmdbId} mediaType="movie" watchInfo={{ mediaType: 'movie', mediaId: tmdbId, title: movie.title, imageUrl: getImageUrl(movie.backdrop_path, 'w780'), href: `/movie/${tmdbId}#watch`, runtimeSeconds: movie.runtime ? movie.runtime * 60 : undefined }} />
      </div>

      {movie.overview && (
        <div className="mt-8 glass rounded-xl p-6 animate-fade-in">
          <h2 className="text-lg font-bold mb-2">About This Movie</h2>
          <p className="text-neutral-300 leading-relaxed" dir="auto">{movie.overview}</p>
        </div>
      )}
    </div>
  );
}
