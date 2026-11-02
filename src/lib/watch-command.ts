export interface WatchCommand {
  title: string;
  type: 'movie' | 'tv' | 'all';
  intent?: 'watch' | 'recommend' | 'chat' | 'clarify';
  reply?: string;
  alternateTitles?: string[];
  season?: number;
  episode?: number;
  personHint?: string;
  continueWatching: boolean;
}

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

function numberFromText(value: string): number | undefined {
  if (/^\d+$/.test(value)) return Number(value);
  const word = value.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/^ال/, '');
  const ordinal: Record<string, number> = {
    اول: 1, اولى: 1, ثاني: 2, ثانيه: 2, ثالث: 3, ثالثه: 3,
    رابع: 4, رابعه: 4, خامس: 5, خامسه: 5, سادس: 6, سادسه: 6,
    سابع: 7, سابعه: 7, ثامن: 8, ثامنه: 8, تاسع: 9, تاسعه: 9,
    عاشر: 10, عاشره: 10,
  };
  return ordinal[word];
}

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

  const seasonMatch = text.match(/(?:الموسم|موسم|season|s)\s*[:#-]?\s*(\d{1,2}|[ء-ي]+)/i);
  if (seasonMatch && numberFromText(seasonMatch[1]) !== undefined) {
    season = numberFromText(seasonMatch[1]);
    text = text.replace(seasonMatch[0], ' ');
  }
  const episodeMatch = text.match(/(?:الحلقة|الحلقه|حلقه|حلقة|episode|ep|e)\s*[:#-]?\s*(\d{1,3}|[ء-ي]+)/i);
  if (episodeMatch && numberFromText(episodeMatch[1]) !== undefined) {
    episode = numberFromText(episodeMatch[1]);
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
