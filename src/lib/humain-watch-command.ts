import 'server-only';
import type { WatchCommand } from './watch-command';

const HUMAIN_URL = 'https://api.node.humain.com/v1/chat/completions';

interface HumainResponse {
  choices?: { finish_reason?: string; message?: { content?: string | null } }[];
}

/** Interpret colloquial watch requests; title matching and navigation stay under our control. */
export async function interpretWatchCommand(input: string): Promise<WatchCommand | null> {
  const key = process.env.HUMAIN_NODE_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch(HUMAIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        model: 'humain-m3-preview',
        messages: [{
          role: 'user',
          content: `استخرج حقول البحث من النص التالي. أرجع JSON فقط: {"title":"اسم العمل بالإنجليزية إن عرفته وإلا كما كُتب","type":"tv أو movie أو all","season":رقم أو null,"episode":رقم أو null}. لا تخترع أرقاماً. النص: «${input}»`,
        }],
        response_format: { type: 'json_object' },
        max_tokens: 350,
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
    const title = typeof parsed.title === 'string' ? parsed.title.trim().slice(0, 100) : '';
    const season = typeof parsed.season === 'number' && Number.isSafeInteger(parsed.season) ? parsed.season : undefined;
    const episode = typeof parsed.episode === 'number' && Number.isSafeInteger(parsed.episode) ? parsed.episode : undefined;
    if (title.length < 2 || title.length > 100 || season !== undefined && (season < 0 || season > 99)
      || episode !== undefined && (episode < 1 || episode > 999)) return null;
    const type = parsed.type === 'tv' || parsed.type === 'movie' ? parsed.type : 'all';
    return { title, type: season !== undefined || episode !== undefined ? 'tv' : type,
      season, episode, continueWatching: false };
  } catch {
    return null;
  }
}
