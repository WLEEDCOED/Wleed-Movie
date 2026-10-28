import { getMovieDetail, getMovieHeroExtras, getImageUrl } from '@/lib/tmdb';
import { generateMovieServers } from '@/lib/servers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ServerSwitcher from '@/components/ServerSwitcher';
import WatchlistButton from '@/components/WatchlistButton';
import MovieHeroImage from '@/components/MovieHeroImage';
import type { Metadata } from 'next';
import type { TMDBTrending } from '@/lib/tmdb';

interface PageProps { params: Promise<{ tmdbId: string }> }
function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(parsed);
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatLanguage(code: string): string {
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code.toUpperCase(); }
  catch { return code.toUpperCase(); }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tmdbId } = await params;
  try { const movie = await getMovieDetail(Number(tmdbId)); return { title: `${movie.title} | WleedMovie`, description: movie.overview }; }
  catch { return { title: 'Movie not found | WleedMovie' }; }
}

export default async function MoviePage({ params }: PageProps) {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!Number.isFinite(id)) notFound();
  const [movie, heroExtras] = await Promise.all([getMovieDetail(id).catch(() => null), getMovieHeroExtras(id)]);
  if (!movie) notFound();
  const item: TMDBTrending = { id: movie.id, media_type: 'movie', title: movie.title, overview: movie.overview, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, vote_average: movie.vote_average, release_date: movie.release_date, genre_ids: movie.genres.map(genre => genre.id) };
  const backdrop = getImageUrl(movie.backdrop_path, 'w1280');
  const titleLogo = getImageUrl(movie.images?.logos?.find(logo => logo.iso_639_1 === 'en')?.file_path || null, 'w500');
  const companies = movie.production_companies?.slice(0, 5) ?? [];
  const hasInfo = Boolean(movie.runtime || movie.original_language || movie.release_date || movie.budget || movie.revenue || companies.length);
  const imdbLink = movie.imdb_id && /^tt\d+$/.test(movie.imdb_id) ? `https://www.imdb.com/title/${movie.imdb_id}/` : null;

  return <div className="detail-page movie-detail-page">
    <section className="detail-hero movie-hero" aria-label={`${movie.title} details`}>
      <div className="movie-hero-backdrop" role="img" aria-label={`${movie.title} backdrop`} style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined} />
      <div className="detail-shade movie-hero-shade" />
      <div className="detail-copy content-shell movie-hero-copy">
        <Link href="/movies" className="detail-back">← Movies</Link>
        <div className={`movie-hero-grid${hasInfo ? '' : ' movie-hero-grid-single'}`}>
          <div className="movie-hero-primary">
            <span className="feature-kicker">NOW SHOWING <span className="kicker-line" /></span>
            <h1>{movie.title}</h1>
            {titleLogo && <MovieHeroImage src={titleLogo} alt={`${movie.title} title logo`} fallback={movie.title} className="detail-title-logo movie-title-logo" width={500} height={165} eager />}
            {movie.genres.length > 0 && <div className="detail-genres movie-hero-genres">{movie.genres.map(genre => <span key={genre.id}>{genre.name}</span>)}</div>}
            <div className="feature-actions movie-hero-actions"><a href="#watch" className="play-pill movie-hero-play" aria-label={`Scroll to watch ${movie.title}`}><span aria-hidden="true">▶</span> Play</a><div className="feature-secondary movie-hero-list"><WatchlistButton item={item} /></div></div>
            <div className="movie-hero-meta">
              {movie.release_date && <span>{movie.release_date.slice(0, 4)}</span>}
              {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
              {heroExtras.certification && <span className="movie-age-rating">{heroExtras.certification}</span>}
              {imdbLink && <a className="movie-score movie-score-imdb" href={imdbLink} target="_blank" rel="noopener noreferrer" aria-label={`View ${movie.title} on IMDb`}>IMDb <span aria-hidden="true">↗</span></a>}
              {movie.vote_average > 0 && <span className="movie-score movie-score-tmdb">TMDB <strong>{movie.vote_average.toFixed(1)}</strong></span>}
            </div>
            {heroExtras.directors.length > 0 && <div className="movie-hero-director"><span>Director:</span> {heroExtras.directors.join(', ')}</div>}
            {movie.overview && <p className="movie-hero-overview" dir="auto">{movie.overview}</p>}
          </div>
          {hasInfo && <aside className="movie-hero-info" aria-label="Movie information">
            <dl>
              {movie.runtime && <div><dt>Runtime</dt><dd>{formatRuntime(movie.runtime)}</dd></div>}
              {movie.original_language && <div><dt>Language</dt><dd>{formatLanguage(movie.original_language)}</dd></div>}
              {movie.release_date && <div><dt>Release Date</dt><dd>{formatDate(movie.release_date)}</dd></div>}
              {typeof movie.budget === 'number' && movie.budget > 0 && <div><dt>Budget</dt><dd>{formatMoney(movie.budget)}</dd></div>}
              {typeof movie.revenue === 'number' && movie.revenue > 0 && <div><dt>Revenue</dt><dd>{formatMoney(movie.revenue)}</dd></div>}
            </dl>
            {companies.length > 0 && <div className="movie-company-list" aria-label="Production companies">{companies.map(company => <MovieHeroImage key={company.id} src={getImageUrl(company.logo_path, 'w185')} alt={`${company.name} logo`} fallback={company.name} className="movie-company-logo" width={185} height={90} />)}</div>}
          </aside>}
        </div>
      </div>
    </section>
    <section id="watch" className="detail-watch content-shell"><div className="rail-heading"><h2>Watch {movie.title}</h2></div><ServerSwitcher servers={generateMovieServers(id)} tmdbId={id} mediaType="movie" watchInfo={{ mediaType: 'movie', mediaId: id, title: movie.title, imageUrl: getImageUrl(movie.backdrop_path, 'w780'), href: `/movie/${id}#watch`, runtimeSeconds: movie.runtime ? movie.runtime * 60 : undefined }} /></section>
    {heroExtras.cast.length > 0 && <section className="movie-hero-cast content-shell" aria-labelledby="movie-cast-heading"><h2 id="movie-cast-heading">Cast</h2><div className="movie-cast-track">{heroExtras.cast.map(person => <div className="movie-cast-person" key={person.id}><MovieHeroImage src={getImageUrl(person.profile_path, 'w185')} alt={`${person.name} as ${person.character || 'cast member'}`} fallback={person.name.charAt(0)} className="movie-cast-photo" width={185} height={185} /><strong>{person.name}</strong>{person.character && <span>{person.character}</span>}</div>)}</div></section>}
  </div>;
}
