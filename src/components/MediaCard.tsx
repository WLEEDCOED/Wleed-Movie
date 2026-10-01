import Link from 'next/link';
import { TMDBTrending, getImageUrl, getTitle, getLink, getYear, getMediaTypeLabel } from '@/lib/tmdb';

export default function MediaCard({ item, index = 0 }: { item: TMDBTrending; index?: number }) {
  const title = getTitle(item);
  const link = getLink(item);
  const year = getYear(item);
  const poster = getImageUrl(item.poster_path);
  const typeLabel = getMediaTypeLabel(item);
  const rating = item.vote_average?.toFixed(1);

  return (
    <Link
      href={link}
      className="group card-hover block animate-fade-in"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div className="flex flex-col gap-2">
        <div className="relative rounded-xl overflow-hidden bg-zinc-200 border border-zinc-200/80 group-hover:border-violet-300 transition-colors shadow-sm">
          <div className="aspect-[2/3] relative overflow-hidden">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center">
                <span className="text-4xl font-black text-zinc-400">{title.charAt(0)}</span>
              </div>
            )}

            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-violet-600/90 text-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-violet-900/30">
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Type badge */}
            <div className="absolute top-1.5 right-1.5">
              <span className="bg-white/90 text-zinc-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-0.5 flex flex-col gap-0.5">
          <h3 className="font-bold text-xs sm:text-sm truncate text-zinc-800 group-hover:text-violet-700 transition-colors">{title}</h3>
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400">
            <span>{year}</span>
            {rating && parseFloat(rating) > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                ⭐ {rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
