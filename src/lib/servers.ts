export interface StreamServer {
  id: string;
  name: string;
  embedUrl: string;
  quality: string;
  isTrusted: boolean;
  language: string;
}

export function generateTVServers(tmdbId: number, season: number, episode: number): StreamServer[] {
  return [
    {
      id: 'vidstuck',
      name: 'VidStuck',
      embedUrl: `https://vidstuck.xyz/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم',
    },
  ];
}

export function generateMovieServers(tmdbId: number): StreamServer[] {
  return [
    {
      id: 'vidstuck',
      name: 'VidStuck',
      embedUrl: `https://vidstuck.xyz/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم',
    },
  ];
}
