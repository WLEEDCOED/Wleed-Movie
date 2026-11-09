export const CATALOG_COUNTRIES = [
  { id: 'US', name: 'United States' },
  { id: 'GB', name: 'United Kingdom' },
  { id: 'TR', name: 'Turkey' },
  { id: 'KR', name: 'South Korea' },
  { id: 'IN', name: 'India' },
  { id: 'JP', name: 'Japan' },
  { id: 'FR', name: 'France' },
];

export const WATCH_REGIONS = [...CATALOG_COUNTRIES, { id: 'SA', name: 'Saudi Arabia' }];

export function getCatalogWatchRegion(country?: string, region?: string): string {
  if (WATCH_REGIONS.some(item => item.id === region)) return region!;
  if (WATCH_REGIONS.some(item => item.id === country)) return country!;
  return 'US';
}
