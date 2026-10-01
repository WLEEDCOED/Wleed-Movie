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
      id: 'vidlink',
      name: 'سيرفر VIP (نظيف وخفيف)',
      embedUrl: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=dc2626&secondaryColor=991b1b`,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم',
    },
    {
      id: 'vidstuck',
      name: 'سيرفر 2 (VidStuck)',
      embedUrl: `https://vidstuck.xyz/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidsrc-pro',
      name: 'سيرفر 3 (VidSrc Pro)',
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
      id: 'vidlink',
      name: 'سيرفر VIP (نظيف وخفيف)',
      embedUrl: `https://vidlink.pro/movie/${tmdbId}?primaryColor=dc2626&secondaryColor=991b1b`,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم',
    },
    {
      id: 'vidstuck',
      name: 'سيرفر 2 (VidStuck)',
      embedUrl: `https://vidstuck.xyz/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidsrc-pro',
      name: 'سيرفر 3 (VidSrc Pro)',
      embedUrl: `https://vidsrc.pro/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
  ];
}
