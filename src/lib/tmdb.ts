const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBTrending {
  id: number;
  media_type: string;
  name?: string;
  title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  genre_ids: number[];
}

export interface TMDBSeason {
  season_number: number;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  vote_average: number;
  runtime: number | null;
}

export interface TMDBSeriesDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeason[];
  genres: { id: number; name: string }[];
  status: string;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number | null;
  genres: { id: number; name: string }[];
  status: string;
  imdb_id: string | null;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'ar-SA');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

export function getImageUrl(path: string | null, size: string = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getTitle(item: TMDBTrending): string {
  return item.name || item.title || 'Unknown';
}

export function getLink(item: TMDBTrending): string {
  return item.media_type === 'tv' ? `/series/${item.id}` : `/movie/${item.id}`;
}

export function getYear(item: TMDBTrending): string {
  const date = item.first_air_date || item.release_date;
  return date ? date.substring(0, 4) : '';
}

export function getMediaTypeLabel(item: TMDBTrending): string {
  return item.media_type === 'tv' ? 'مسلسل' : 'فيلم';
}

export async function getTrending(): Promise<TMDBTrending[]> {
  const data = await tmdbFetch<{ results: TMDBTrending[] }>('/trending/all/week');
  return data.results.filter(r => r.media_type === 'tv' || r.media_type === 'movie');
}

export async function getTrendingTV(): Promise<TMDBTrending[]> {
  const data = await tmdbFetch<{ results: TMDBTrending[] }>('/trending/tv/week');
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

export async function getTrendingMovies(): Promise<TMDBTrending[]> {
  const data = await tmdbFetch<{ results: TMDBTrending[] }>('/trending/movie/week');
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getSeriesDetail(tmdbId: number): Promise<TMDBSeriesDetail> {
  return tmdbFetch<TMDBSeriesDetail>(`/tv/${tmdbId}`);
}

export async function getMovieDetail(tmdbId: number): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`);
}

export async function getSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
  const data = await tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${tmdbId}/season/${seasonNumber}`);
  return data.episodes || [];
}

export async function searchMulti(query: string): Promise<TMDBTrending[]> {
  const data = await tmdbFetch<{ results: TMDBTrending[] }>('/search/multi', { query });
  return data.results.filter(r => r.media_type === 'tv' || r.media_type === 'movie');
}

export async function getTVByNetwork(networkId: number): Promise<TMDBTrending[]> {
  const data = await tmdbFetch<{ results: TMDBTrending[] }>('/discover/tv', {
    with_networks: networkId.toString(),
    sort_by: 'popularity.desc',
  });
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

export async function getByProvider(providerId: number): Promise<TMDBTrending[]> {
  const [movies, tv] = await Promise.all([
    getMoviesByProvider(providerId),
    getTVByProvider(providerId)
  ]);
  return [...movies, ...tv].sort((a, b) => b.vote_average - a.vote_average);
}

export async function getMoviesByProvider(providerId: number): Promise<TMDBTrending[]> {
  const data = await tmdbFetch<{ results: TMDBTrending[] }>('/discover/movie', {
    with_watch_providers: providerId.toString(),
    watch_region: 'US',
    sort_by: 'popularity.desc',
  });
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getTVByProvider(providerId: number): Promise<TMDBTrending[]> {
  const data = await tmdbFetch<{ results: TMDBTrending[] }>('/discover/tv', {
    with_watch_providers: providerId.toString(),
    watch_region: 'US',
    sort_by: 'popularity.desc',
  });
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}
