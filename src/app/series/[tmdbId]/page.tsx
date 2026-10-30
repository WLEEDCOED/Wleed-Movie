import { getSeriesDetail, getSeriesHeroExtras, getSeasonEpisodes, getImageUrl } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import WatchlistButton from '@/components/WatchlistButton';
import MovieHeroImage from '@/components/MovieHeroImage';
import SeriesEpisodes from '@/components/SeriesEpisodes';
import type { Metadata } from 'next';
import type { TMDBTrending } from '@/lib/tmdb';
import { Suspense } from 'react';

interface PageProps { params: Promise<{ tmdbId: string }>; searchParams: Promise<{ season?: string }> }
function riyadhToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tmdbId } = await params;
  try { const series = await getSeriesDetail(Number(tmdbId)); return { title: `${series.name} | WleedMovie`, description: series.overview }; }
  catch { return { title: 'Series not found | WleedMovie' }; }
}

export default async function SeriesDetailPage({ params, searchParams }: PageProps) {
  const [{ tmdbId }, { season: requestedSeason }] = await Promise.all([params, searchParams]);
  const id = Number(tmdbId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const extrasPromise = getSeriesHeroExtras(id);
  const series = await getSeriesDetail(id).catch(() => null);
  if (!series) notFound();
  const availableSeasons = series.seasons.filter(season => season.season_number > 0 && season.episode_count > 0);
  const selectedSeason = availableSeasons.find(season => season.season_number === Number(requestedSeason)) ?? availableSeasons[0];
  const episodes = selectedSeason ? await getSeasonEpisodes(id, selectedSeason.season_number).catch(() => []) : [];
  const today = riyadhToday();
  const item: TMDBTrending = { id: series.id, media_type: 'tv', name: series.name, overview: series.overview, poster_path: series.poster_path, backdrop_path: series.backdrop_path, vote_average: series.vote_average, first_air_date: series.first_air_date, genre_ids: series.genres.map(genre => genre.id) };
  const backdrop = getImageUrl(series.backdrop_path, 'w1280');
  const titleLogo = getImageUrl(series.images?.logos?.find(logo => logo.iso_639_1 === 'en')?.file_path || null, 'w500');
  const firstEpisode = episodes.find(episode => episode.air_date && episode.air_date <= today);
  return <div className="detail-page">
    <section className="detail-hero" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}>
      <div className="detail-shade" />
      <div className="detail-copy content-shell">
        <Link href="/series" className="detail-back">← Series</Link>
        <span className="feature-kicker">TV SERIES <span className="kicker-line" /></span>
        <h1>{series.name}</h1>
        {titleLogo && <MovieHeroImage className="detail-title-logo" src={titleLogo} alt={series.name} fallback={series.name} width={500} height={165} eager />}
        <div className="detail-meta">{series.vote_average > 0 && <span>★ {series.vote_average.toFixed(1)}/10</span>}<span>{series.first_air_date?.slice(0,4)}</span><span>{series.number_of_seasons} Seasons</span><span>{series.number_of_episodes} Episodes</span></div>
        {series.genres.length > 0 && <div className="detail-genres">{series.genres.map(genre => <span key={genre.id}>{genre.name}</span>)}</div>}
        <p dir="auto">{series.overview}</p>
        <div className="feature-actions">{firstEpisode && <Link href={`/watch/tv/${id}/${selectedSeason.season_number}/${firstEpisode.episode_number}`} className="play-pill"><span>▶</span> Play</Link>}<div className="feature-secondary"><WatchlistButton item={item} /></div></div>
      </div>
    </section>
    <div id="episodes" className="detail-watch content-shell">
      {selectedSeason && <SeriesEpisodes seriesId={id} seasons={availableSeasons} selectedSeason={selectedSeason.season_number} episodes={episodes} today={today} />}
    </div>
    <Suspense fallback={null}><SeriesCast extrasPromise={extrasPromise} /></Suspense>
  </div>;
}

async function SeriesCast({ extrasPromise }: { extrasPromise: ReturnType<typeof getSeriesHeroExtras> }) {
  const { cast } = await extrasPromise;
  if (!cast.length) return null;
  return <section className="movie-hero-cast series-cast content-shell" aria-labelledby="series-cast-heading"><h2 id="series-cast-heading">Cast</h2><div className="movie-cast-track">{cast.map(person => <div className="movie-cast-person" key={person.id}><MovieHeroImage src={getImageUrl(person.profile_path, 'w185')} alt={person.name} fallback={person.name.charAt(0)} className="movie-cast-photo" width={185} height={185} /><strong>{person.name}</strong>{person.character && <span>{person.character}</span>}</div>)}</div></section>;
}
