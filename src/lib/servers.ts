export interface StreamServer {
  id: string;
  name: string;
  embedUrl: string;
  quality: string;
  isTrusted: boolean;
  language: string;
}

export function getSubtitleDownloadUrl(tmdbId: number, type: 'movie' | 'tv' = 'movie', season?: number, episode?: number): string {
  if (type === 'tv' && season && episode) {
    return `/api/subtitles/vtt?tmdbId=${tmdbId}&type=tv&season=${season}&episode=${episode}&download=true&format=srt`;
  }
  return `/api/subtitles/vtt?tmdbId=${tmdbId}&type=movie&download=true&format=srt`;
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
      id: 'atlantic',
      name: 'Atlantic',
      embedUrl: `https://atlantic.st/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: 'HD',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidstuck',
      name: 'VidStuck',
      embedUrl: `https://vidstuck.cc/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidrift',
      name: 'Vidrift',
      embedUrl: `https://embed.vidrift.net/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: 'HD',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'embedwave',
      name: 'EmbedWave',
      embedUrl: `https://embedwave.cc/embed/tv/${tmdbId}/${season}/${episode}`,
      quality: 'HD',
      isTrusted: false,
      language: 'متعدد',
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
      id: 'atlantic',
      name: 'Atlantic',
      embedUrl: `https://atlantic.st/embed/movie/${tmdbId}`,
      quality: 'HD',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidstuck',
      name: 'VidStuck',
      embedUrl: `https://vidstuck.cc/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'vidrift',
      name: 'Vidrift',
      embedUrl: `https://embed.vidrift.net/embed/movie/${tmdbId}`,
      quality: 'HD',
      isTrusted: false,
      language: 'مترجم',
    },
    {
      id: 'embedwave',
      name: 'EmbedWave',
      embedUrl: `https://embedwave.cc/embed/movie/${tmdbId}`,
      quality: 'HD',
      isTrusted: false,
      language: 'متعدد',
    },
  ];
}
