import Link from 'next/link';
import { getTrending, getTrendingTV, getTrendingMovies, getTopRatedMovies, getTopRatedTV, getMoviesByProvider, getTVByProvider, getMoviesByGenre, getNowPlayingMovies, searchMulti } from '@/lib/tmdb';
import type { TMDBTrending } from '@/lib/tmdb';
import HeroBanner from '@/components/HeroBanner';
import ContentRail from '@/components/ContentRail';
import ProviderRail from '@/components/ProviderRail';
import MediaCard from '@/components/MediaCard';
import ContinueWatching from '@/components/ContinueWatching';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim();

  if (query) {
    const results = await searchMulti(query).catch(() => [] as TMDBTrending[]);
    return <div className="catalog-page content-shell"><div className="catalog-heading"><p className="eyebrow">SEARCH RESULTS</p><h1>Results for “{query}”</h1><p>{results.length} titles found</p></div>{results.length ? <div className="catalog-grid">{results.map((item, index) => <MediaCard key={`${item.media_type}-${item.id}`} item={item} index={index} />)}</div> : <div className="empty-state"><h2>No results found</h2><p>Try another movie or show title.</p><Link href="/" className="primary-pill">Back to Home</Link></div>}</div>;
  }

  const [trending, movies, shows, netflixMovies, netflixShows, topMovies, topShows, thrillers, nowPlaying, action, animation, sciFi] = await Promise.all([
    getTrending(), getTrendingMovies(), getTrendingTV(), getMoviesByProvider(8), getTVByProvider(8), getTopRatedMovies(), getTopRatedTV(), getMoviesByGenre(53), getNowPlayingMovies(), getMoviesByGenre(28), getMoviesByGenre(16), getMoviesByGenre(878),
  ]);

  return <div className="home-page">
    <HeroBanner items={movies.length ? movies : trending} />
    <div className={`home-content content-shell ${trending.length ? '' : 'no-hero'}`}>
      {trending.length === 0 && movies.length === 0 && <div className="empty-state"><h2>Could not load titles</h2><p>Please try refreshing the page.</p></div>}
      <ContinueWatching />
      <ProviderRail />
      <ContentRail title="Trending Movies" items={movies} href="/category/movie/trending" />
      <ContentRail title="Trending Series" items={shows} href="/category/tv/trending" />
      <ContentRail title="Now Playing" items={nowPlaying} href="/category/movie/now_playing" />
      <ContentRail title="Movies on Netflix" items={netflixMovies} href="/provider/8" />
      <ContentRail title="TV Series on Netflix" items={netflixShows} href="/provider/8" />
      <ContentRail title="Top Rated Movies" items={topMovies} href="/category/movie/top_rated" />
      <ContentRail title="Top Rated Series" items={topShows} href="/category/tv/top_rated" />
      <ContentRail title="Thrillers" items={thrillers} href="/movies?genre=53" />
      <ContentRail title="Action & Adventure" items={action} href="/movies?genre=28" />
      <ContentRail title="Animation" items={animation} href="/movies?genre=16" />
      <ContentRail title="Sci-Fi" items={sciFi} href="/movies?genre=878" />
    </div>
  </div>;
}
