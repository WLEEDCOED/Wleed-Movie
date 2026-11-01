'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWatchHistory } from '@/lib/watch-history';
import { parseWatchCommand } from '@/lib/watch-command';

interface Choice { id: number; title: string; year: string; type: string }
interface ResolveResponse { href?: string; title?: string; choices?: Choice[]; error?: string }
interface Message { role: 'assistant' | 'user'; text: string; choices?: Choice[]; query?: string }

export default function AIChatPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'هلا! اكتب لي بالعامية الفيلم أو المسلسل والحلقة اللي تبيها، وبفتحها لك هنا.' },
  ]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  async function submit(query: string, selectedId?: number) {
    const command = query.trim();
    if (!command || busy) return;
    if (!selectedId) {
      setMessages(current => [...current, { role: 'user', text: command }]);
      setInput('');
    }
    setBusy(true);
    try {
      const parsed = parseWatchCommand(command);
      if (parsed.continueWatching && !selectedId) {
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
        setMessages(current => [...current, { role: 'assistant', text: 'ما لقيت هذا العمل في Continue Watching على هذا الجهاز. جرّب تكتب اسمه ورقم الحلقة.' }]);
        return;
      }

      const response = await fetch('/api/watch-command', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: command, ...(selectedId ? { selectedId } : {}) }),
      });
      const result = await response.json() as ResolveResponse;
      if (!response.ok || result.error) {
        setMessages(current => [...current, { role: 'assistant', text: result.error || 'ما قدرت أبحث الآن، جرّب مرة ثانية.' }]);
      } else if (result.href) {
        onClose();
        router.push(result.href);
      } else if (result.choices?.length) {
        setMessages(current => [...current, { role: 'assistant', text: 'لقيت أكثر من عمل بهذا الاسم. أي واحد تقصد؟', choices: result.choices, query: command }]);
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
        {messages.map((message, index) => <div className={`ai-chat-message ${message.role}`} key={index} dir="auto">
          <p>{message.text}</p>
          {message.choices && <div className="ai-chat-choices" dir="rtl">{message.choices.map(choice =>
            <button type="button" key={`${choice.type}-${choice.id}`} disabled={busy} onClick={() => void submit(message.query || '', choice.id)}>
              <strong>{choice.title}</strong><span>{choice.year || '—'} · {choice.type === 'tv' ? 'مسلسل' : 'فيلم'}</span>
            </button>)}</div>}
        </div>)}
        {busy && <div className="ai-chat-message assistant ai-chat-thinking" role="status">أدور لك عليه<span aria-hidden="true">…</span></div>}
      </div>
      {messages.length === 1 && <div className="ai-chat-examples" dir="rtl">
        <button type="button" onClick={() => setInput('ابي الحلقه الثانيه من مسلسل برذر حق ماثيو')}>برذر حق ماثيو، الحلقة الثانية</button>
        <button type="button" onClick={() => setInput('كمّل اللي كنت أتابعه')}>كمّل اللي كنت أتابعه</button>
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
