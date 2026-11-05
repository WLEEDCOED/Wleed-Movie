import 'server-only';

interface HumainResponse {
  choices?: { finish_reason?: string; message?: { content?: string | null } }[];
}

export async function translateEpisodeOverview(source: string): Promise<string | null> {
  const key = process.env.HUMAIN_NODE_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch('https://api.node.humain.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        model: 'humain-m3-preview',
        messages: [
          { role: 'system', content: 'ترجم وصف حلقة المسلسل إلى العربية الطبيعية بدقة. حافظ على أسماء الشخصيات والأحداث كما هي، ولا تضف معلومات غير موجودة. أرجع الترجمة فقط دون مقدمة أو علامات اقتباس.' },
          { role: 'user', content: source.slice(0, 1800) },
        ],
        max_tokens: 500,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = await response.json() as HumainResponse;
    const choice = data.choices?.[0];
    const translated = choice?.message?.content?.trim().replace(/^['"«]+|['"»]+$/g, '');
    return choice?.finish_reason === 'stop' && translated && /[\u0600-\u06ff]/.test(translated)
      ? translated.slice(0, 2400) : null;
  } catch {
    return null;
  }
}
