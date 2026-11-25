export type CatalogMediaType = 'movie' | 'tv';

const excludedGenres = {
  movie: [99],
  tv: [99, 10763, 10764, 10767],
} satisfies Record<CatalogMediaType, number[]>;

const excludedSeriesTypes = new Set(['Documentary', 'News', 'Reality', 'Talk Show']);

export function isCatalogTitleAllowed(mediaType: string, genreIds?: readonly number[] | null, seriesType?: string): boolean {
  if (mediaType !== 'movie' && mediaType !== 'tv') return false;
  if (mediaType === 'tv' && seriesType && excludedSeriesTypes.has(seriesType)) return false;
  return !genreIds?.some(id => excludedGenres[mediaType].includes(id));
}

export function catalogDiscoverFilters(mediaType: CatalogMediaType): Record<string, string> {
  return {
    without_genres: excludedGenres[mediaType].join(','),
    // TMDB types: Miniseries, Scripted, and Video.
    ...(mediaType === 'tv' ? { with_type: '2|4|6' } : {}),
  };
}
