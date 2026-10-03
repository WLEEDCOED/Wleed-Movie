export interface StreamServer {
  id: string;
  name: string;
  embedUrl: string;
  quality: string;
  isTrusted: boolean;
  language: string;
}

const DEFAULT_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://cinema-three-wheat.vercel.app';

export function getSubtitleVttUrl(tmdbId: number, type: 'movie' | 'tv' = 'movie', season?: number, episode?: number, origin = DEFAULT_ORIGIN): string {
  let url = `${origin}/api/subtitles/vtt?tmdbId=${tmdbId}&type=${type}`;
  if (type === 'tv' && season && episode) {
    url += `&season=${season}&episode=${episode}`;
  }
  return url;
}

export function getSubtitleDownloadUrl(tmdbId: number, type: 'movie' | 'tv' = 'movie', season?: number, episode?: number): string {
  let url = `/api/subtitles/vtt?tmdbId=${tmdbId}&type=${type}&download=true&format=srt`;
  if (type === 'tv' && season && episode) {
    url += `&season=${season}&episode=${episode}`;
  }
  return url;
}

export function generateTVServers(tmdbId: number, season: number, episode: number, origin = DEFAULT_ORIGIN): StreamServer[] {
  const subTvUrl = getSubtitleVttUrl(tmdbId, 'tv', season, episode, origin);
  const vidlinkTvUrl = `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=dc2626&secondaryColor=991b1b&subtitles=${encodeURIComponent(subTvUrl)}&subtitleLabel=${encodeURIComponent('العربية')}`;

  return [
    {
      id: 'vidlink',
      name: 'VidLink (مترجم تلقائياً)',
      embedUrl: vidlinkTvUrl,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم عربي تلقائي',
    },
    {
      id: 'cinesrc',
      name: 'CineSrc',
      embedUrl: `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}`,
      quality: '1080p',
      isTrusted: false,
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
  ];
}

export function generateMovieServers(tmdbId: number, origin = DEFAULT_ORIGIN): StreamServer[] {
  const subMovieUrl = getSubtitleVttUrl(tmdbId, 'movie', undefined, undefined, origin);
  const vidlinkMovieUrl = `https://vidlink.pro/movie/${tmdbId}?primaryColor=dc2626&secondaryColor=991b1b&subtitles=${encodeURIComponent(subMovieUrl)}&subtitleLabel=${encodeURIComponent('العربية')}`;

  return [
    {
      id: 'vidlink',
      name: 'VidLink (مترجم تلقائياً)',
      embedUrl: vidlinkMovieUrl,
      quality: '1080p',
      isTrusted: true,
      language: 'مترجم عربي تلقائي',
    },
    {
      id: 'cinesrc',
      name: 'CineSrc',
      embedUrl: `https://cinesrc.st/embed/movie/${tmdbId}`,
      quality: '1080p',
      isTrusted: false,
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
  ];
}
