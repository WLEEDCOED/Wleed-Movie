const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const ARABIC_OVERVIEW_FALLBACK = 'لا يتوفر وصف عربي لهذا العمل حاليًا.';

function arabicText(value?: string | null): string | null {
  const text = value?.trim();
  return text && /[\u0600-\u06ff]/.test(text) ? text : null;
}

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
  original_name?: string;
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
  images?: { logos?: { file_path: string; iso_639_1: string | null }[] };
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number | null;
  genres: { id: number; name: string }[];
  status: string;
  imdb_id: string | null;
  original_language?: string;
  budget?: number;
  revenue?: number;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  images?: { logos?: { file_path: string; iso_639_1: string | null }[] };
}

export interface TMDBMovieHeroExtras {
  cast: { id: number; name: string; character: string; profile_path: string | null }[];
  directors: string[];
  certification: string | null;
}

export interface TMDBSeriesHeroExtras {
  cast: TMDBMovieHeroExtras['cast'];
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
        // Preserve the correct title field for each media type.
        title: item.title || item.original_title,
        name: item.name || item.original_name,
        // Poster in English:
        poster_path: item.poster_path,
        // Backdrop from English or fallback:
        backdrop_path: item.backdrop_path || arItem?.backdrop_path || null,
        // Overview in Arabic:
        overview: arabicText(arItem?.overview) || ARABIC_OVERVIEW_FALLBACK,
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
  return item.title || item.name || item.original_title || item.original_name || 'Untitled';
}

export function getLink(item: TMDBTrending): string {
  return item.media_type === 'tv' ? `/series/${item.id}` : `/movie/${item.id}`;
}

export function getYear(item: TMDBTrending): string {
  const date = item.first_air_date || item.release_date;
  return date ? date.substring(0, 4) : '';
}

export function getMediaTypeLabel(item: TMDBTrending): string {
  return item.media_type === 'tv' ? 'TV Series' : 'Movie';
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

export async function getTopRatedMovies(): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/movie/top_rated');
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getTopRatedTV(): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/tv/top_rated');
  return data.results.map(r => ({ ...r, media_type: 'tv' }));
}

export async function getUpcomingMovies(): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/movie/upcoming', { region: 'US' });
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getNowPlayingMovies(): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/movie/now_playing', { region: 'US' });
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getMoviesByGenre(genreId: number): Promise<TMDBTrending[]> {
  const data = await fetchMergedList('/discover/movie', {
    with_genres: String(genreId),
    sort_by: 'vote_average.desc',
    'vote_count.gte': '1000',
  });
  return data.results.map(r => ({ ...r, media_type: 'movie' }));
}

export async function getSeriesDetail(tmdbId: number): Promise<TMDBSeriesDetail> {
  const [enSeries, arSeries] = await Promise.all([
    tmdbFetch<TMDBSeriesDetail>(`/tv/${tmdbId}`, { language: 'en-US', append_to_response: 'images', include_image_language: 'en,null' }),
    tmdbFetch<TMDBSeriesDetail>(`/tv/${tmdbId}`, { language: 'ar-SA' }).catch(() => null),
  ]);

  return {
    ...enSeries,
    name: enSeries.name || enSeries.original_name || 'Series',
    poster_path: enSeries.poster_path,
    backdrop_path: enSeries.backdrop_path || arSeries?.backdrop_path || null,
    overview: arabicText(arSeries?.overview) || ARABIC_OVERVIEW_FALLBACK,
    genres: enSeries.genres,
  };
}

export async function getMovieDetail(tmdbId: number): Promise<TMDBMovieDetail> {
  const [enMovie, arMovie] = await Promise.all([
    tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`, { language: 'en-US', append_to_response: 'images', include_image_language: 'en,null' }),
    tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`, { language: 'ar-SA' }).catch(() => null),
  ]);

  return {
    ...enMovie,
    title: enMovie.title || enMovie.original_title || 'Movie',
    poster_path: enMovie.poster_path,
    backdrop_path: enMovie.backdrop_path || arMovie?.backdrop_path || null,
    overview: arabicText(arMovie?.overview) || ARABIC_OVERVIEW_FALLBACK,
    genres: enMovie.genres,
  };
}

/** Optional hero details; a failed supplemental request never blocks movie playback. */
export async function getMovieHeroExtras(tmdbId: number): Promise<TMDBMovieHeroExtras> {
  type Credits = {
    cast?: TMDBMovieHeroExtras['cast'];
    crew?: { name: string; job: string }[];
  };
  type ReleaseDates = {
    results?: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };

  const [credits, ratings] = await Promise.all([
    tmdbFetch<Credits>(`/movie/${tmdbId}/credits`).catch(() => null),
    tmdbFetch<ReleaseDates>(`/movie/${tmdbId}/release_dates`).catch(() => null),
  ]);
  const certification = ['US', 'SA', 'GB', 'CA']
    .flatMap(country => ratings?.results?.find(result => result.iso_3166_1 === country)?.release_dates ?? [])
    .map(release => release.certification?.trim())
    .find(Boolean) ?? null;

  return {
    cast: credits?.cast?.slice(0, 18) ?? [],
    directors: [...new Set(credits?.crew?.filter(member => member.job === 'Director').map(member => member.name) ?? [])],
    certification,
  };
}

/** Cast is optional and must not delay or block the episode list on API errors. */
export async function getSeriesHeroExtras(tmdbId: number): Promise<TMDBSeriesHeroExtras> {
  const credits = await tmdbFetch<{ cast?: TMDBSeriesHeroExtras['cast'] }>(`/tv/${tmdbId}/credits`).catch(() => null);
  return { cast: credits?.cast?.slice(0, 18) ?? [] };
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
      overview: arabicText(arEp?.overview) || 'لا يتوفر وصف عربي لهذه الحلقة حاليًا.',
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
  sort?: string;
  country?: string;
}

export interface DiscoverResult {
  results: TMDBTrending[];
  totalPages: number;
  totalResults: number;
  page: number;
}

export async function getCategoryPage(type: 'movie' | 'tv', category: 'trending' | 'top_rated' | 'upcoming' | 'now_playing', page = 1): Promise<DiscoverResult> {
  const endpoint = category === 'trending' ? `/trending/${type}/week` : `/${type}/${category}`;
  const data = await fetchMergedList(endpoint, { page: String(page), ...(category === 'upcoming' || category === 'now_playing' ? { region: 'US' } : {}) });
  return {
    results: data.results.map(item => ({ ...item, media_type: type })),
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    page: data.page || page,
  };
}

export async function discoverMovies(params: DiscoverParams = {}): Promise<DiscoverResult> {
  const queryParams: Record<string, string> = {
    sort_by: params.sort || 'popularity.desc',
    page: (params.page || 1).toString(),
    watch_region: 'US',
  };
  if (params.genre) queryParams.with_genres = params.genre.toString();
  if (params.year) queryParams.primary_release_year = params.year.toString();
  if (params.country) queryParams.with_origin_country = params.country;
  if (params.sort === 'vote_average.desc') queryParams['vote_count.gte'] = '200';
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
    sort_by: params.sort === 'primary_release_date.desc' ? 'first_air_date.desc' : params.sort || 'popularity.desc',
    page: (params.page || 1).toString(),
    watch_region: 'US',
  };
  if (params.genre) queryParams.with_genres = params.genre.toString();
  if (params.year) queryParams.first_air_date_year = params.year.toString();
  if (params.country) queryParams.with_origin_country = params.country;
  if (params.sort === 'vote_average.desc') queryParams['vote_count.gte'] = '200';
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
