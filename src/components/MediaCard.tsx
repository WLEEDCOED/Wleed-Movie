import Link from 'next/link';
import Image from 'next/image';
import { TMDBTrending, getImageUrl, getTitle, getLink, getYear } from '@/lib/tmdb';
import WatchlistButton from './WatchlistButton';

export default function MediaCard({ item, index = 0, inRail = false }: { item: TMDBTrending; index?: number; inRail?: boolean }) {
  const title = getTitle(item);
  const poster = getImageUrl(item.poster_path, inRail ? 'w342' : 'w500');
  const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null;

  return (
    <article className="media-card" style={{ animationDelay: `${Math.min(index, 12) * 0.035}s` }}>
      <Link href={getLink(item)} aria-label={title} className="media-card-link">
        <div className="media-poster">
          {poster ? <Image src={poster} alt={title} width={500} height={750} sizes={inRail ? '(max-width: 740px) 140px, 200px' : '(max-width: 390px) 45vw, (max-width: 740px) 33vw, (max-width: 1100px) 20vw, 200px'} loading="lazy" /> : <div className="poster-fallback">{title.charAt(0)}</div>}
          <span className="media-play" aria-hidden="true">▶</span>
        </div>
        <h3 title={title}>{title}</h3>
        <div className="media-meta"><span>{getYear(item)}</span>{rating && <span className="media-rating">★ {rating}</span>}</div>
      </Link>
      <WatchlistButton item={item} compact />
    </article>
  );
}
