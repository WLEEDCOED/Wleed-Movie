import { prisma } from './prisma';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const OPENSUBTITLES_API_KEY = process.env.OPENSUBTITLES_API_KEY || '';
const SUBDL_API_KEY = process.env.SUBDL_API_KEY || '';

interface SubtitleResult {
  content: string;
}

interface EpisodeWithSeries {
  id: number;
  imdbId: string | null;
  tmdbId: string | null;
  seasonNumber: number;
  episodeNumber: number;
  series: {
    title: string;
  };
}

export async function getArabicSubtitle(episodeId: number) {
  const existing = await prisma.subtitle.findFirst({
    where: { episodeId, language: 'ar', isActive: true },
  });
  if (existing) return existing;

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { series: true },
  });
  if (!episode) return null;

  let result: SubtitleResult | null = null;
  let source = 'OpenSubtitles';

  try {
    result = await searchOpenSubtitles(episode);
  } catch (err) {
    console.error('OpenSubtitles search failed:', err);
  }

  if (!result) {
    try {
      result = await searchSubDL(episode);
      source = 'SubDL';
    } catch (err) {
      console.error('SubDL search failed:', err);
    }
  }

  if (!result) return null;

  const vttContent = convertSrtToVtt(result.content);
  const fileName = `episode-${episodeId}-ar.vtt`;
  const filePath = `/subtitles/${fileName}`;
  const fullPath = path.join(process.cwd(), 'public', 'subtitles', fileName);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, vttContent, 'utf-8');

  return await prisma.subtitle.create({
    data: { episodeId, language: 'ar', label: 'مترجم عربي', filePath, source },
  });
}

async function searchOpenSubtitles(
  episode: EpisodeWithSeries
): Promise<SubtitleResult | null> {
  if (!OPENSUBTITLES_API_KEY || OPENSUBTITLES_API_KEY === 'your_key') return null;

  try {
    const params: Record<string, string> = {
      languages: 'ar',
    };

    if (episode.imdbId) {
      params.imdb_id = episode.imdbId.replace('tt', '');
    } else if (episode.tmdbId) {
      params.tmdb_id = episode.tmdbId;
    } else {
      params.query = episode.series.title;
    }

    params.season_number = String(episode.seasonNumber);
    params.episode_number = String(episode.episodeNumber);

    const searchResponse = await axios.get(
      'https://api.opensubtitles.com/api/v1/subtitles',
      {
        params,
        headers: {
          'Api-Key': OPENSUBTITLES_API_KEY,
          'Content-Type': 'application/json',
          'User-Agent': 'CinemaApp v1.0',
        },
      }
    );

    const subtitles = searchResponse.data?.data;
    if (!subtitles || subtitles.length === 0) return null;

    const fileId =
      subtitles[0]?.attributes?.files?.[0]?.file_id;
    if (!fileId) return null;

    const downloadResponse = await axios.post(
      'https://api.opensubtitles.com/api/v1/download',
      { file_id: fileId },
      {
        headers: {
          'Api-Key': OPENSUBTITLES_API_KEY,
          'Content-Type': 'application/json',
          'User-Agent': 'CinemaApp v1.0',
        },
      }
    );

    const downloadLink = downloadResponse.data?.link;
    if (!downloadLink) return null;

    const fileResponse = await axios.get(downloadLink, {
      responseType: 'text',
    });

    return { content: fileResponse.data };
  } catch (error) {
    console.error('OpenSubtitles API error:', error);
    return null;
  }
}

async function searchSubDL(
  episode: EpisodeWithSeries
): Promise<SubtitleResult | null> {
  if (!SUBDL_API_KEY || SUBDL_API_KEY === 'your_key') return null;

  try {
    const params: Record<string, string> = {
      api_key: SUBDL_API_KEY,
      languages: 'ar',
      type: 'episode',
      season_number: String(episode.seasonNumber),
      episode_number: String(episode.episodeNumber),
    };

    if (episode.imdbId) {
      params.imdb_id = episode.imdbId;
    } else if (episode.tmdbId) {
      params.tmdb_id = episode.tmdbId;
    } else {
      params.film_name = episode.series.title;
    }

    const searchResponse = await axios.get(
      'https://api.subdl.com/api/v1/subtitles',
      { params }
    );

    const subtitles = searchResponse.data?.subtitles;
    if (!subtitles || subtitles.length === 0) return null;

    const subtitleUrl = subtitles[0]?.url;
    if (!subtitleUrl) return null;

    const fileResponse = await axios.get(
      `https://dl.subdl.com${subtitleUrl}`,
      { responseType: 'arraybuffer' }
    );

    // SubDL returns a zip file, extract the first .srt file
    // For simplicity, try to get the content as text
    const content = Buffer.from(fileResponse.data).toString('utf-8');
    return { content };
  } catch (error) {
    console.error('SubDL API error:', error);
    return null;
  }
}

function convertSrtToVtt(srt: string): string {
  let vtt = 'WEBVTT\n\n';
  vtt += srt
    .replace(/\r+/g, '')
    .replace(/^\d+\s*$/gm, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    .trim();
  return vtt;
}
