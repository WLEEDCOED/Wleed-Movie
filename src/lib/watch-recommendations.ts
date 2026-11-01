import 'server-only';
import { discoverMovies, discoverTV, getCategoryPage, getLink, getTitle, getYear, type TMDBTrending } from './tmdb';

const GENRES: Record<string, { movie: number; tv: number; label: string }> = {
  action: { movie: 28, tv: 10759, label: 'أكشن' },
  comedy: { movie: 35, tv: 35, label: 'كوميديا' },
  drama: { movie: 18, tv: 18, label: 'دراما' },
  horror: { movie: 27, tv: 9648, label: 'رعب وغموض' },
  thriller: { movie: 53, tv: 80, label: 'تشويق' },
  mystery: { movie: 9648, tv: 9648, label: 'غموض' },
  romance: { movie: 10749, tv: 18, label: 'رومانسي' },
  scifi: { movie: 878, tv: 10765, label: 'خيال علمي' },
  fantasy: { movie: 14, tv: 10765, label: 'فانتازيا' },
  crime: { movie: 80, tv: 80, label: 'جريمة' },
  animation: { movie: 16, tv: 16, label: 'أنيميشن' },
  documentary: { movie: 99, tv: 99, label: 'وثائقي' },
};

type RecommendationType = 'movie' | 'tv' | 'all';
interface Preferences { type: RecommendationType; genre?: keyof typeof GENRES; country?: string; year?: number }
interface HumainResponse { choices?: { message?: { content?: string | null } }[] }

export interface Recommendation {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  href: string;
  year: string;
  rating: number;
  overview: string;
  poster: string | null;
}

export function isRecommendationRequest(input: string) {
  return /(?:انصحني|نصحني|رشح(?:لي| لي|وا)?|ترشيحات|توصيات|اقترح|إقترح|اقتراح|وش اشوف|وش أشوف|وش اتابع|وش أتابع|ابي شي|أبي شي|ابغى شي|أبغى شي|recommend|suggest|what (?:should|to) watch)/i.test(input);
}

function localPreferences(input: string): Preferences {
  const asksForTV = /(?:مسلسل|مسلسلات|series|shows?)/i.test(input);
  const asksForMovies = /(?:فيلم|افلام|أفلام|movies?|films?)/i.test(input);
  const type: RecommendationType = asksForTV && asksForMovies ? 'all' : asksForTV ? 'tv' : asksForMovies ? 'movie' : 'all';
  const genres: [keyof typeof GENRES, RegExp][] = [
    ['action', /اكشن|أكشن|حماس|مطارد|action/i],
    ['comedy', /كوميد|يضحك|مضحك|ضحك|comedy|funny/i],
    ['horror', /رعب|يخوف|مرعب|horror|scary/i],
    ['thriller', /تشويق|thrill/i],
    ['mystery', /غموض|mystery/i],
    ['romance', /رومان|حب|romance|romantic/i],
    ['scifi', /خيال علمي|فضاء|sci.?fi/i],
    ['fantasy', /فانتاز|سحر|fantasy/i],
    ['crime', /جريم|تحقيق|crime|detective/i],
    ['animation', /انمي|أنمي|كرتون|animation|anime/i],
    ['documentary', /وثائق|documentary/i],
    ['drama', /دراما|drama/i],
  ];
  const genre = genres.find(([, pattern]) => pattern.test(input))?.[0];
  const country = /تركي|تركية|تركيه|turkish/i.test(input) ? 'TR'
    : /كوري|كورية|كوريه|korean/i.test(input) ? 'KR' : undefined;
  const yearMatch = input.match(/\b(19\d{2}|20\d{2})\b/);
  return { type, genre, country, year: yearMatch ? Number(yearMatch[1]) : undefined };
}

async function preferencesFromAI(input: string, fallback: Preferences): Promise<Preferences> {
  if (fallback.genre || fallback.country || fallback.year) return fallback;
  const key = process.env.HUMAIN_NODE_API_KEY;
  if (!key) return fallback;
  try {
    const response = await fetch('https://api.node.humain.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        model: 'humain-m3-preview',
        messages: [{ role: 'user', content: `استخرج تفضيلات توصية مشاهدة من الطلب. أرجع JSON فقط: {"type":"movie|tv|all","genre":"action|comedy|drama|horror|thriller|mystery|romance|scifi|fantasy|crime|animation|documentary|null","country":"TR|KR|null","year":رقم أو null}. لا تخترع تفضيلًا غير مذكور. إذا طلب أفلامًا ومسلسلات معًا اختر all. الطلب: «${input}»` }],
        response_format: { type: 'json_object' }, max_tokens: 180, temperature: 0,
      }),
      signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!response.ok) return fallback;
    const data = await response.json() as HumainResponse;
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as Record<string, unknown>;
    return {
      type: parsed.type === 'movie' || parsed.type === 'tv' || parsed.type === 'all' ? parsed.type : fallback.type,
      genre: typeof parsed.genre === 'string' && parsed.genre in GENRES ? parsed.genre : fallback.genre,
      country: parsed.country === 'TR' || parsed.country === 'KR' ? parsed.country : fallback.country,
      year: typeof parsed.year === 'number' && Number.isInteger(parsed.year) && parsed.year >= 1900 && parsed.year <= new Date().getFullYear() ? parsed.year : fallback.year,
    };
  } catch {
    return fallback;
  }
}

export async function getWatchRecommendations(input: string, excludedIds: number[] = []) {
  const preferences = await preferencesFromAI(input, localPreferences(input));
  const types: ('movie' | 'tv')[] = preferences.type === 'all' ? ['tv', 'movie'] : [preferences.type];
  const pages = await Promise.all(types.map(async type => {
    const genre = preferences.genre ? GENRES[preferences.genre][type] : undefined;
    const minVotes = preferences.country ? 50 : preferences.year ? 100 : 700;
    const result = genre || preferences.country || preferences.year
      ? type === 'movie'
        ? await discoverMovies({ genre, country: preferences.country, year: preferences.year, sort: 'vote_average.desc', minVotes })
        : await discoverTV({ genre, country: preferences.country, year: preferences.year, sort: 'vote_average.desc', minVotes })
      : await getCategoryPage(type, 'top_rated');
    return result.results;
  }));
  const today = new Date().toISOString().slice(0, 10);
  const excluded = new Set(excludedIds);
  const candidates = pages.flat().filter(item => {
    const date = item.release_date || item.first_air_date;
    return !excluded.has(item.id) && Boolean(date && date <= today) && item.vote_average >= 6.5
      && (item.vote_count || 0) >= (preferences.country ? 50 : preferences.year ? 100 : 700) && item.poster_path;
  });
  const selected: TMDBTrending[] = [];
  if (preferences.type === 'all') {
    for (const type of types) {
      selected.push(...candidates.filter(candidate => candidate.media_type === type).slice(0, 2));
    }
  }
  for (const item of candidates) {
    if (selected.length >= 4) break;
    if (!selected.some(chosen => chosen.id === item.id && chosen.media_type === item.media_type)) selected.push(item);
  }
  const recommendations: Recommendation[] = selected.map(item => ({
    id: item.id, title: getTitle(item), type: item.media_type === 'tv' ? 'tv' : 'movie',
    href: getLink(item), year: getYear(item), rating: Math.round(item.vote_average * 10) / 10,
    overview: item.overview, poster: item.poster_path,
  }));
  const description = [preferences.genre && GENRES[preferences.genre].label,
    preferences.country === 'TR' ? 'تركي' : preferences.country === 'KR' ? 'كوري' : undefined,
    preferences.year].filter(Boolean).join(' · ');
  return { recommendations, description };
}
