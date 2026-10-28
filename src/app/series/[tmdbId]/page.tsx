import { getSeriesDetail, getSeriesHeroExtras, getSeasonEpisodes, getImageUrl } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import WatchlistButton from '@/components/WatchlistButton';
import MovieHeroImage from '@/components/MovieHeroImage';
import type { Metadata } from 'next';
import type { TMDBTrending } from '@/lib/tmdb';
import { Suspense } from 'react';

interface PageProps { params: Promise<{ tmdbId: string }>; searchParams: Promise<{ season?: string }> }
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
  const item: TMDBTrending = { id: series.id, media_type: 'tv', name: series.name, overview: series.overview, poster_path: series.poster_path, backdrop_path: series.backdrop_path, vote_average: series.vote_average, first_air_date: series.first_air_date, genre_ids: series.genres.map(genre => genre.id) };
  const backdrop = getImageUrl(series.backdrop_path, 'w1280');
  const titleLogo = getImageUrl(series.images?.logos?.find(logo => logo.iso_639_1 === 'en')?.file_path || null, 'w500');
  const firstEpisode = episodes[0];
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
      {availableSeasons.length > 1 && <nav className="season-nav" aria-label="Choose season">{availableSeasons.map(season => <Link key={season.season_number} href={`/series/${id}?season=${season.season_number}#episodes`} aria-current={season.season_number === selectedSeason?.season_number ? 'page' : undefined}>Season {season.season_number}</Link>)}</nav>}
      {selectedSeason && <section className="episode-section"><div className="rail-heading"><h2>Season {selectedSeason.season_number}</h2><span className="episode-count">{episodes.length} Episodes</span></div><div className="episode-grid">{episodes.map(episode => { const still = getImageUrl(episode.still_path, 'w300'); return <Link key={episode.id} href={`/watch/tv/${id}/${selectedSeason.season_number}/${episode.episode_number}`} className="episode-card"><div className="episode-image">{still ? <Image src={still} alt={episode.name} width={300} height={169} sizes="(max-width: 740px) 45vw, (max-width: 1100px) 23vw, 20vw" loading="lazy" /> : <span>Episode {episode.episode_number}</span>}<span className="episode-play">▶</span></div><span className="episode-number">Season {selectedSeason.season_number} · Episode {episode.episode_number}</span><h3>{episode.name}</h3></Link>; })}</div></section>}
    </div>
    <Suspense fallback={null}><SeriesCast extrasPromise={extrasPromise} /></Suspense>
  </div>;
}

async function SeriesCast({ extrasPromise }: { extrasPromise: ReturnType<typeof getSeriesHeroExtras> }) {
  const { cast } = await extrasPromise;
  if (!cast.length) return null;
  return <section className="movie-hero-cast series-cast content-shell" aria-labelledby="series-cast-heading"><h2 id="series-cast-heading">Cast</h2><div className="movie-cast-track">{cast.map(person => <div className="movie-cast-person" key={person.id}><MovieHeroImage src={getImageUrl(person.profile_path, 'w185')} alt={person.name} fallback={person.name.charAt(0)} className="movie-cast-photo" width={185} height={185} /><strong>{person.name}</strong>{person.character && <span>{person.character}</span>}</div>)}</div></section>;
}
