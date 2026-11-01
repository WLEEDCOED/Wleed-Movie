import 'server-only';
import { parseWatchCommand, type WatchCommand } from './watch-command';

const HUMAIN_URL = 'https://api.node.humain.com/v1/chat/completions';

interface HumainResponse {
  choices?: { finish_reason?: string; message?: { content?: string | null } }[];
}

/** Interpret colloquial watch requests; title matching and navigation stay under our control. */
export async function interpretWatchCommand(input: string): Promise<WatchCommand | null> {
  const key = process.env.HUMAIN_NODE_API_KEY;
  if (!key) return null;
  const castClue = /(?:حق|بطولة|بطل|الممثل|starring)/i.test(input);
  const fallback = parseWatchCommand(input);
  const spokenClue = castClue ? fallback.title.split(/\s+حق\s+/, 2) : [];
  const shortClue = spokenClue.length === 2 && spokenClue.every(value => value.trim().length > 1);
  const prompt = shortClue
    ? `انقل لفظ كلمتين إلى الإنجليزية. أرجع JSON فقط: {"title":"...","person":"..."}. العنوان: ${spokenClue[0]}. الشخص: ${spokenClue[1]}.`
    : castClue
      ? `استخرج كلمتين للبحث من النص: اسم العمل كما نُطق بالعامية لكن بحروف إنجليزية، واسم الشخص المذكور. لا تستنتج اسم عمل جديد. أرجع JSON: {"titleHint":"...","personHint":"...","episode":رقم أو null,"season":رقم أو null}. النص: «${input}»`
    : `استخرج حقول البحث من النص التالي. أرجع JSON فقط: {"title":"اسم العمل بالإنجليزية إن عرفته وإلا كما كُتب","type":"tv أو movie أو all","season":رقم أو null,"episode":رقم أو null}. لا تخترع أرقاماً. النص: «${input}»`;

  try {
    const response = await fetch(HUMAIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        model: 'humain-m3-preview',
        messages: [{
          role: 'user',
          content: prompt,
        }],
        response_format: { type: 'json_object' },
        max_tokens: castClue && !shortClue ? 500 : 350,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = await response.json() as HumainResponse;
    const choice = data.choices?.[0];
    if (choice?.finish_reason !== 'stop' || !choice.message?.content) return null;
    const parsed = JSON.parse(choice.message.content) as Record<string, unknown>;
    const titleValue = shortClue ? parsed.title : castClue ? parsed.titleHint : parsed.title;
    const title = typeof titleValue === 'string' ? titleValue.trim().slice(0, 100) : '';
    const season = typeof parsed.season === 'number' && Number.isSafeInteger(parsed.season) ? parsed.season : fallback.season;
    const episode = typeof parsed.episode === 'number' && Number.isSafeInteger(parsed.episode) ? parsed.episode : fallback.episode;
    if (title.length < 2 || title.length > 100 || season !== undefined && (season < 0 || season > 99)
      || episode !== undefined && (episode < 1 || episode > 999)) return null;
    const type = parsed.type === 'tv' || parsed.type === 'movie' ? parsed.type : fallback.type;
    const personValue = shortClue ? parsed.person : parsed.personHint;
    const personHint = castClue && typeof personValue === 'string' ? personValue.trim().slice(0, 80) : undefined;
    return { title, type: season !== undefined || episode !== undefined ? 'tv' : type,
      season, episode, personHint, continueWatching: false };
  } catch {
    return null;
  }
}
