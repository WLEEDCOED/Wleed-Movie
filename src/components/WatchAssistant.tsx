'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWatchHistory } from '@/lib/watch-history';
import { parseWatchCommand } from '@/lib/watch-command';

interface Choice { id: number; title: string; year: string; type: string }
interface ResolveResponse { href?: string; title?: string; choices?: Choice[]; error?: string }

export default function WatchAssistant() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [choices, setChoices] = useState<Choice[]>([]);

  async function openCommand(selectedId?: number) {
    const command = input.trim();
    if (!command || busy) return;
    setBusy(true);
    setError('');
    setChoices([]);
    try {
      const parsed = parseWatchCommand(command);
      if (parsed.continueWatching && !selectedId) {
        const history = getWatchHistory();
        const entry = parsed.title
          ? history.find(item => item.title.toLocaleLowerCase().includes(parsed.title.toLocaleLowerCase()))
          : history[0];
        if (entry) {
          try { sessionStorage.setItem('refresh-subtitles-on-continue', `${entry.mediaType}-${entry.mediaId}-${entry.season ?? 0}-${entry.episode ?? 0}`); } catch { /* Storage may be unavailable. */ }
          router.push(entry.href);
          return;
        }
        setError('ما لقيت هذا العمل في قائمة Continue Watching على هذا الجهاز.');
        return;
      }

      const response = await fetch('/api/watch-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: command, ...(selectedId ? { selectedId } : {}) }),
      });
      const result = await response.json() as ResolveResponse;
      if (!response.ok || result.error) {
        setError(result.error || 'تعذّر فتح العمل الآن. حاول مرة ثانية.');
      } else if (result.href) {
        router.push(result.href);
      } else if (result.choices?.length) {
        setChoices(result.choices);
      }
    } catch {
      setError('تعذّر الاتصال الآن. حاول مرة ثانية.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="watch-assistant" aria-label="Watch assistant">
    <div className="watch-assistant-heading"><span className="watch-assistant-icon" aria-hidden="true">✦</span><div><strong>AI Watch Assistant</strong><p>اكتب بالعامية اللي تبي تشاهده، ونفتح لك صفحة الحلقة مباشرة.</p></div></div>
    <form className="watch-assistant-form" onSubmit={event => { event.preventDefault(); void openCommand(); }}>
      <label className="sr-only" htmlFor="watch-command">What would you like to watch?</label>
      <input id="watch-command" dir="auto" autoComplete="off" value={input} maxLength={160}
        onChange={event => { setInput(event.target.value); setError(''); setChoices([]); }}
        placeholder="أبي الحلقة الثالثة من الموسم الثاني من مودرن فاميلي" />
      <button type="submit" disabled={busy || !input.trim()}>{busy ? 'جاري البحث…' : 'افتح ↗'}</button>
    </form>
    <div className="watch-assistant-examples" dir="rtl"><span>جرّب:</span>
      {['أبي الحلقة الثالثة من الموسم الثاني من مودرن فاميلي', 'شغّل فيلم The Matrix', 'كمّل اللي كنت أتابعه'].map(example =>
        <button key={example} type="button" onClick={() => { setInput(example); setError(''); setChoices([]); }}>{example}</button>)}
    </div>
    <div aria-live="polite" dir="rtl">
      {error && <p className="watch-assistant-error">{error}</p>}
      {choices.length > 0 && <div className="watch-assistant-choices"><p>لقيت أكثر من عمل بهذا الاسم. اختر المقصود:</p><div>
        {choices.map(choice => <button key={`${choice.type}-${choice.id}`} type="button" disabled={busy} onClick={() => void openCommand(choice.id)}>
          <strong>{choice.title}</strong><span>{choice.year || '—'} · {choice.type === 'tv' ? 'مسلسل' : 'فيلم'}</span>
        </button>)}
      </div></div>}
    </div>
  </section>;
}
