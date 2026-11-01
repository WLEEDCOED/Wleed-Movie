export interface WatchCommand {
  title: string;
  type: 'movie' | 'tv' | 'all';
  season?: number;
  episode?: number;
  continueWatching: boolean;
}

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

export function parseWatchCommand(input: string): WatchCommand {
  let text = input.trim().replace(/[٠-٩۰-۹]/g, digit =>
    String(Math.max(arabicDigits.indexOf(digit), persianDigits.indexOf(digit))));
  const continueWatching = /^(?:كمّل|كمل|اكمل|أكمل|continue|resume)(?:\s|$)/i.test(text);
  const type = /(?:مسلسل|مسلسلات|series|show|tv)/i.test(text) ? 'tv'
    : /(?:فيلم|movie|film)/i.test(text) ? 'movie' : 'all';

  const compact = text.match(/\bS\s*(\d{1,2})\s*[·.xX:/\- ]\s*E\s*(\d{1,3})\b/i)
    || text.match(/\b(\d{1,2})\s*[xX]\s*(\d{1,3})\b/);
  let season = compact ? Number(compact[1]) : undefined;
  let episode = compact ? Number(compact[2]) : undefined;
  if (compact) text = text.replace(compact[0], ' ');

  const seasonMatch = text.match(/(?:الموسم|موسم|season|s)\s*[:#-]?\s*(\d{1,2})/i);
  if (seasonMatch) {
    season = Number(seasonMatch[1]);
    text = text.replace(seasonMatch[0], ' ');
  }
  const episodeMatch = text.match(/(?:الحلقة|حلقه|حلقة|episode|ep|e)\s*[:#-]?\s*(\d{1,3})/i);
  if (episodeMatch) {
    episode = Number(episodeMatch[1]);
    text = text.replace(episodeMatch[0], ' ');
  }

  text = text
    .replace(/[،؟?!]+/g, ' ')
    .replace(/(?:^|\s)(?:شغّل|شغل|شغلي|افتح|فتح|ابحث|دور|أبي|ابي|ابغى|اريد|أريد|ودي|خلني|مشاهدة|شاهد|تابع|كمّل|كمل|اكمل|أكمل|لي|من|في|عن|مسلسل|مسلسلات|فيلم|الجزء|اللي|كنت|أتابعه|اتابعه)(?=\s|$)/gi, ' ')
    .replace(/\b(?:play|watch|open|find|search|for|me|please|movie|film|series|show|tv|continue|resume)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { title: text, type: season !== undefined || episode !== undefined ? 'tv' : type,
    season, episode, continueWatching };
}
