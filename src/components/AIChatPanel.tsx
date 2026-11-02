'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWatchHistory } from '@/lib/watch-history';
import { isMoreRecommendationsRequest, parseWatchCommand } from '@/lib/watch-command';

interface Choice { id: number; title: string; year: string; type: 'movie' | 'tv'; season?: number; episode?: number }
interface Recommendation { id: number; title: string; year: string; type: 'movie' | 'tv'; href: string; rating: number; overview: string; poster: string | null }
interface ResolveResponse { href?: string; title?: string; choices?: Choice[]; recommendations?: Recommendation[]; recommendationQuery?: string; description?: string; message?: string; error?: string }
interface Message { role: 'assistant' | 'user'; text: string; choices?: Choice[]; recommendations?: Recommendation[]; query?: string }

export default function AIChatPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'هلا! اكتب لي الفيلم أو الحلقة اللي تبيها، أو قل لي وش جوّك وأرشح لك أفلام ومسلسلات.' },
  ]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  async function submit(query: string, selection?: Choice) {
    const command = query.trim();
    if (!command || busy) return;
    if (!selection) {
      setMessages(current => [...current, { role: 'user', text: command }]);
      setInput('');
    }
    setBusy(true);
    try {
      const parsed = parseWatchCommand(command);
      if (parsed.continueWatching && !selection) {
        const history = getWatchHistory();
        const entry = parsed.title
          ? history.find(item => item.title.toLocaleLowerCase().includes(parsed.title.toLocaleLowerCase()))
          : history[0];
        if (entry) {
          try { sessionStorage.setItem('refresh-subtitles-on-continue', `${entry.mediaType}-${entry.mediaId}-${entry.season ?? 0}-${entry.episode ?? 0}`); } catch { /* Storage may be unavailable. */ }
          onClose();
          router.push(entry.href);
          return;
        }
        setMessages(current => [...current, { role: 'assistant', text: 'وش العمل اللي تبي تكمله؟ اكتب اسمه ورقم الحلقة وأفتحه لك.' }]);
        return;
      }

      const previous = [...messages].reverse().find(message => message.recommendations?.length);
      const moreRecommendations = isMoreRecommendationsRequest(command);
      const response = await fetch('/api/watch-command', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: command, ...(selection ? {
          selectedId: selection.id, selectedType: selection.type, season: selection.season, episode: selection.episode,
        } : {}),
          context: messages.filter(message => message.role === 'user').slice(-3).map(message => message.text),
          ...(moreRecommendations ? {
            recommendationContext: previous?.query,
            excludedIds: messages.flatMap(message => message.recommendations?.map(item => `${item.type}:${item.id}`) || []),
          } : {}),
        }),
      });
      const result = await response.json() as ResolveResponse;
      if (!response.ok || result.error) {
        setMessages(current => [...current, { role: 'assistant', text: result.error || 'ما قدرت أبحث الآن، جرّب مرة ثانية.' }]);
      } else if (result.href) {
        onClose();
        router.push(result.href);
      } else if (result.recommendations?.length) {
        const description = result.description ? ` على جو ${result.description}` : '';
        setMessages(current => [...current, { role: 'assistant', text: `هذي ترشيحاتي لك${description}. اختر عملًا عشان تشوف تفاصيله:`,
          recommendations: result.recommendations, query: result.recommendationQuery || command }]);
      } else if (result.choices?.length) {
        setMessages(current => [...current, { role: 'assistant', text: result.message || 'أي واحد تقصد؟', choices: result.choices, query: command }]);
      } else if (result.message) {
        const reply = result.message;
        setMessages(current => [...current, { role: 'assistant', text: reply }]);
      }
    } catch {
      setMessages(current => [...current, { role: 'assistant', text: 'تعذّر الاتصال الآن. جرّب مرة ثانية.' }]);
    } finally {
      setBusy(false);
    }
  }

  return <div className="ai-chat-root">
    <div className="ai-chat-backdrop" onClick={onClose} aria-hidden="true" />
    <section className="ai-chat-panel" role="dialog" aria-modal="true" aria-labelledby="ai-chat-title">
      <header className="ai-chat-header">
        <Image src="/ai-mascot.png" alt="" width={48} height={48} className="ai-chat-avatar" />
        <div><h2 id="ai-chat-title">WLEED AI</h2><p>مساعد المشاهدة</p></div>
        <button type="button" className="ai-chat-close" onClick={onClose} aria-label="إغلاق المحادثة">×</button>
      </header>
      <div ref={messagesRef} className="ai-chat-messages" aria-live="polite" aria-busy={busy}>
        {messages.map((message, index) => <div className={`ai-chat-message ${message.role}${message.recommendations ? ' with-recommendations' : ''}`} key={index} dir="auto">
          <p>{message.text}</p>
          {message.choices && <div className="ai-chat-choices" dir="rtl">{message.choices.map(choice =>
            <button type="button" key={`${choice.type}-${choice.id}`} disabled={busy} onClick={() => void submit(message.query || '', choice)}>
              <strong>{choice.title}</strong><span>{choice.year || '—'} · {choice.type === 'tv' ? 'مسلسل' : 'فيلم'}</span>
            </button>)}</div>}
          {message.recommendations && <div className="ai-chat-recommendations" dir="rtl">{message.recommendations.map(item =>
            <button type="button" key={`${item.type}-${item.id}`} onClick={() => { onClose(); router.push(item.href); }}>
              {item.poster ? <Image src={`https://image.tmdb.org/t/p/w92${item.poster}`} alt={`بوستر ${item.title}`} width={48} height={72} />
                : <span className="ai-chat-poster-fallback" aria-hidden="true">◩</span>}
              <span className="ai-chat-recommendation-copy"><strong>{item.title}</strong>
                <small>{item.type === 'tv' ? 'مسلسل' : 'فيلم'} · {item.year || '—'} · ★ {item.rating.toFixed(1)}</small>
                {item.overview && !item.overview.startsWith('لا يتوفر وصف') && <span className="ai-chat-recommendation-overview">{item.overview}</span>}
              </span>
            </button>)}</div>}
        </div>)}
        {busy && <div className="ai-chat-message assistant ai-chat-thinking" role="status">أدور لك عليه<span aria-hidden="true">…</span></div>}
      </div>
      {messages.length === 1 && <div className="ai-chat-examples" dir="rtl">
        <button type="button" onClick={() => setInput('ابي الحلقه الثانيه من مسلسل برذر حق ماثيو')}>برذر حق ماثيو، الحلقة الثانية</button>
        <button type="button" onClick={() => setInput('كمّل اللي كنت أتابعه')}>كمّل اللي كنت أتابعه</button>
        <button type="button" onClick={() => setInput('انصحني بمسلسل تشويق')}>انصحني بمسلسل تشويق</button>
      </div>}
      <form className="ai-chat-form" onSubmit={event => { event.preventDefault(); void submit(input); }}>
        <label className="sr-only" htmlFor="ai-chat-input">اكتب طلب المشاهدة</label>
        <input ref={inputRef} id="ai-chat-input" dir="auto" value={input} maxLength={160} autoComplete="off"
          onChange={event => setInput(event.target.value)} placeholder="اكتب لي وش تبي تشاهد..." />
        <button type="submit" disabled={busy || !input.trim()} aria-label="إرسال الطلب">➤</button>
      </form>
    </section>
  </div>;
}
