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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4 animate-fade-in">
        <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
        <span>/</span>
        <span className="text-white">{movie.title}</span>
      </div>

      {backdrop && (
        <div className="relative rounded-2xl overflow-hidden mb-6 h-48 md:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backdrop} alt={movie.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 mb-6 animate-fade-in">
        {poster && (
          <div className="w-full md:w-48 flex-shrink-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden border border-neutral-800/50 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-black mb-2 gradient-text">{movie.title}</h1>
          <div className="flex flex-wrap gap-3 mb-4">
            {movie.release_date && <span className="glass rounded-lg px-3 py-1.5 text-xs">{movie.release_date.substring(0, 4)}</span>}
            {movie.runtime && <span className="glass rounded-lg px-3 py-1.5 text-xs">{movie.runtime} دقيقة</span>}
            {movie.vote_average > 0 && <span className="glass rounded-lg px-3 py-1.5 text-xs text-yellow-400">⭐ {movie.vote_average.toFixed(1)}</span>}
          </div>
          {movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((g) => (
                <span key={g.id} className="glass rounded-full px-3 py-1 text-xs text-neutral-300">{g.name}</span>
              ))}
            </div>
          )}
          {movie.overview && <p className="text-neutral-300 leading-relaxed">{movie.overview}</p>}
        </div>
      </div>

      <div className="animate-slide-up">
        <ServerSwitcher servers={servers} />
      </div>
    </div>
  );
}
