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
      <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/50 group-hover:border-blue-500/30 transition-colors">
        <div className="aspect-[2/3] relative overflow-hidden">
          {poster ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
              <span className="text-5xl font-black text-neutral-700">{title.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="glass rounded-lg px-2 py-0.5 text-[10px] font-bold">{typeLabel}</span>
            {rating && parseFloat(rating) > 0 && (
              <span className="glass rounded-lg px-2 py-0.5 text-[10px] font-bold text-yellow-400">⭐ {rating}</span>
            )}
          </div>
          {year && (
            <div className="absolute bottom-2 left-2 glass rounded-lg px-2 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              {year}
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm truncate group-hover:text-blue-400 transition-colors">{title}</h3>
          {item.overview && (
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.overview}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
