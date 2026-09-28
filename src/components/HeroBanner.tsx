import Link from 'next/link';
import { TMDBTrending, getImageUrl, getTitle, getLink } from '@/lib/tmdb';

export default function HeroBanner({ item }: { item: TMDBTrending }) {
  if (!item) return null;

  const backdropUrl = getImageUrl(item.backdrop_path, 'original');
  const title = getTitle(item);
  const link = getLink(item);

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {backdropUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Gradients for cinematic effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-2xl animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-black mb-4 text-white drop-shadow-lg leading-tight">
            {title}
          </h1>
          {item.overview && (
            <p className="text-base md:text-lg text-neutral-300 mb-8 line-clamp-3 drop-shadow-md leading-relaxed">
              {item.overview}
            </p>
          )}
          <div className="flex items-center gap-4">
            <Link
              href={link}
              className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              شاهد الآن
            </Link>
            <Link
              href={link}
              className="flex items-center gap-2 glass px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              التفاصيل
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
