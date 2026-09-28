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
        <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/20 group-hover:border-red-600/50 transition-colors shadow-lg">
          <div className="aspect-[2/3] relative overflow-hidden">
            {poster ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={poster}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center">
                <span className="text-5xl font-black text-neutral-800">{title.charAt(0)}</span>
              </div>
            )}
            
            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-red-900/50">
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Info below poster */}
        <div className="px-1 flex flex-col gap-0.5">
          <h3 className="font-bold text-sm truncate group-hover:text-red-500 transition-colors text-white">{title}</h3>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span>{year}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-700" />
              <span>{typeLabel}</span>
            </span>
            {rating && parseFloat(rating) > 0 && (
              <span className="flex items-center gap-1 text-yellow-500/90 font-medium">
                ⭐ {rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
