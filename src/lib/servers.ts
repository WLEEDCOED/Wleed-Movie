export interface StreamServer {
  id: string;
  name: string;
  embedUrl: string;
  quality: string;
  isTrusted: boolean;
  language: string;
}

export const SUBTITLE_SOURCE_NAMES = { subdl: 'SubDL', opensubtitles: 'OpenSubtitles' } as const;
export type SubtitleSourceId = keyof typeof SUBTITLE_SOURCE_NAMES;
export type SubtitleSource = { id: SubtitleSourceId; pageUrl?: string };

export function getSubtitleDownloadUrl(tmdbId: number, type: 'movie' | 'tv' = 'movie', season?: number, episode?: number, source?: SubtitleSourceId): string {
  const params = new URLSearchParams({ tmdbId: String(tmdbId), type, download: 'true', format: 'srt' });
  if (type === 'tv' && season && episode) {
    params.set('season', String(season));
    params.set('episode', String(episode));
  }
  if (source) params.set('source', source);
  return `/api/subtitles/vtt?${params}`;
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
      id: 'vidora',
      name: 'Vidora',
      embedUrl: `https://vidora.ac/tv/${tmdbId}/${season}/${episode}`,
      quality: 'HD',
      isTrusted: false,
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
      id: 'vidora',
      name: 'Vidora',
      embedUrl: `https://vidora.ac/movie/${tmdbId}`,
      quality: 'HD',
      isTrusted: false,
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
  ];
}
