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
      id: 'cinesrc',
      name: 'CineSrc',
      embedUrl: `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}`,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم',
    },
    {
      id: 'vidstuck',
      name: 'VidStuck',
      embedUrl: `https://vidstuck.xyz/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidlink',
      name: 'VidLink',
      embedUrl: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=dc2626&secondaryColor=991b1b`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidsrc-pro',
      name: 'VidSrc Pro',
      embedUrl: `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
  ];
}

export function generateMovieServers(tmdbId: number): StreamServer[] {
  return [
    {
      id: 'cinesrc',
      name: 'CineSrc',
      embedUrl: `https://cinesrc.st/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم',
    },
    {
      id: 'vidstuck',
      name: 'VidStuck',
      embedUrl: `https://vidstuck.xyz/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidlink',
      name: 'VidLink',
      embedUrl: `https://vidlink.pro/movie/${tmdbId}?primaryColor=dc2626&secondaryColor=991b1b`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidsrc-pro',
      name: 'VidSrc Pro',
      embedUrl: `https://vidsrc.pro/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
  ];
}
