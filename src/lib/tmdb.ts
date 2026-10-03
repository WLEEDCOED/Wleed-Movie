const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBTrending {
  id: number;
  media_type: string;
  name?: string;
  title?: string;
  original_name?: string;
  original_title?: string;
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
  if (!params.language) {
    url.searchParams.set('language', 'en-US');
  }
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

/**
 * Helper to fetch English titles and posters while preserving Arabic overviews.
 */
async function fetchMergedList(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<{ results: TMDBTrending[]; total_pages?: number; total_results?: number; page?: number }> {
  try {
    const [enData, arData] = await Promise.all([
      tmdbFetch<{ results: TMDBTrending[]; total_pages?: number; total_results?: number; page?: number }>(
        endpoint,
        { ...params, language: 'en-US' }
      ),
      tmdbFetch<{ results: TMDBTrending[] }>(
        endpoint,
        { ...params, language: 'ar-SA' }
      ).catch(() => ({ results: [] })),
    ]);

    const arMap = new Map((arData.results || []).map((r) => [r.id, r]));

    const merged = (enData.results || []).map((item) => {
      const arItem = arMap.get(item.id);
      return {
        ...item,
        // Title and Name in English:
        title: item.title || item.original_title || 'Unknown',
        name: item.name || item.original_name || 'Unknown',
        // Poster in English:
        poster_path: item.poster_path,
        // Backdrop from English or fallback:
        backdrop_path: item.backdrop_path || arItem?.backdrop_path || null,
        // Overview in Arabic:
        overview: (arItem?.overview && arItem.overview.trim().length > 0) ? arItem.overview : item.overview,
      };
    });

    return {
      ...enData,
      results: merged,
    };
  } catch (error) {
    console.error(`fetchMergedList failed for ${endpoint}:`, error);
    return { results: [], total_pages: 0, total_results: 0, page: 1 };
  }
}

export function getImageUrl(path: string | null, size: string = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getTitle(item: TMDBTrending): string {
  return item.title || item.name || item.original_title || item.original_name || 'Unknown';
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
  const data = await fetchMergedList('/trending/all/week');
  return data.results.filter(r => r.media_type === 'tv' || r.media_type === 'movie');
}

export async function getTrendingTV(): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/trending/tv/week');
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

export async function getTrendingMovies(): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/trending/movie/week');
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getSeriesDetail(tmdbId: number): Promise<TMDBSeriesDetail> {
  const [enSeries, arSeries] = await Promise.all([
    tmdbFetch<TMDBSeriesDetail>(`/tv/${tmdbId}`, { language: 'en-US' }),
    tmdbFetch<TMDBSeriesDetail>(`/tv/${tmdbId}`, { language: 'ar-SA' }).catch(() => null),
  ]);

  return {
    ...enSeries,
    name: enSeries.name || (enSeries as any).original_name || 'Series',
    poster_path: enSeries.poster_path,
    backdrop_path: enSeries.backdrop_path || arSeries?.backdrop_path || null,
    overview: (arSeries?.overview && arSeries.overview.trim().length > 0) ? arSeries.overview : enSeries.overview,
    genres: (arSeries?.genres && arSeries.genres.length > 0) ? arSeries.genres : enSeries.genres,
  };
}

export async function getMovieDetail(tmdbId: number): Promise<TMDBMovieDetail> {
  const [enMovie, arMovie] = await Promise.all([
    tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`, { language: 'en-US' }),
    tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`, { language: 'ar-SA' }).catch(() => null),
  ]);

  return {
    ...enMovie,
    title: enMovie.title || (enMovie as any).original_title || 'Movie',
    poster_path: enMovie.poster_path,
    backdrop_path: enMovie.backdrop_path || arMovie?.backdrop_path || null,
    overview: (arMovie?.overview && arMovie.overview.trim().length > 0) ? arMovie.overview : enMovie.overview,
    genres: (arMovie?.genres && arMovie.genres.length > 0) ? arMovie.genres : enMovie.genres,
  };
}

export async function getSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
  const [enSeason, arSeason] = await Promise.all([
    tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${tmdbId}/season/${seasonNumber}`, { language: 'en-US' }),
    tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${tmdbId}/season/${seasonNumber}`, { language: 'ar-SA' }).catch(() => null),
  ]);

  const arEpisodesMap = new Map((arSeason?.episodes || []).map((e) => [e.episode_number, e]));

  return (enSeason?.episodes || []).map((ep) => {
    const arEp = arEpisodesMap.get(ep.episode_number);
    return {
      ...ep,
      name: ep.name || `Episode ${ep.episode_number}`,
      overview: (arEp?.overview && arEp.overview.trim().length > 0) ? arEp.overview : ep.overview,
    };
  });
}

export async function searchMulti(query: string): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/search/multi', { query });
  return data.results.filter(r => r.media_type === 'tv' || r.media_type === 'movie');
}

export async function getTVByNetwork(networkId: number): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/discover/tv', {
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
  const data = await fetchMergedList('/discover/movie', {
    with_watch_providers: providerId.toString(),
    watch_region: 'US',
    sort_by: 'popularity.desc',
  });
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getTVByProvider(providerId: number): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/discover/tv', {
    with_watch_providers: providerId.toString(),
    watch_region: 'US',
    sort_by: 'popularity.desc',
  });
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

export interface DiscoverParams {
  page?: number;
  genre?: number;
  year?: number;
  provider?: number;
}

export interface DiscoverResult {
  results: TMDBTrending[];
  totalPages: number;
  totalResults: number;
  page: number;
}

export async function discoverMovies(params: DiscoverParams = {}): Promise<DiscoverResult> {
  const queryParams: Record<string, string> = {
    sort_by: 'popularity.desc',
    page: (params.page || 1).toString(),
    watch_region: 'US',
  };
  if (params.genre) queryParams.with_genres = params.genre.toString();
  if (params.year) queryParams.primary_release_year = params.year.toString();
  if (params.provider) {
    queryParams.with_watch_providers = params.provider.toString();
  }

  const data = await fetchMergedList('/discover/movie', queryParams);
  return {
    results: data.results.map(r => ({ ...r, media_type: 'movie' })),
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    page: data.page || 1,
  };
}

export async function discoverTV(params: DiscoverParams = {}): Promise<DiscoverResult> {
  const queryParams: Record<string, string> = {
    sort_by: 'popularity.desc',
    page: (params.page || 1).toString(),
    watch_region: 'US',
  };
  if (params.genre) queryParams.with_genres = params.genre.toString();
  if (params.year) queryParams.first_air_date_year = params.year.toString();
  if (params.provider) {
    queryParams.with_watch_providers = params.provider.toString();
  }

  const data = await fetchMergedList('/discover/tv', queryParams);
  return {
    results: data.results.map(r => ({ ...r, media_type: 'tv' })),
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    page: data.page || 1,
  };
}

export async function searchMovies(query: string, page = 1): Promise<DiscoverResult> {
  const data = await fetchMergedList('/search/movie', { query, page: page.toString() });
  return {
    results: data.results.map(r => ({ ...r, media_type: 'movie' })),
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    page: data.page || 1,
  };
}

export async function searchTV(query: string, page = 1): Promise<DiscoverResult> {
  const data = await fetchMergedList('/search/tv', { query, page: page.toString() });
  return {
    results: data.results.map(r => ({ ...r, media_type: 'tv' })),
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    page: data.page || 1,
  };
}
