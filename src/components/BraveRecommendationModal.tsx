'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const DISMISSED_KEY = 'wleedmovie-brave-guide-dismissed-v1';

export default function BraveRecommendationModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const checkedThisVisit = useRef(false);
  const visible = open && pathname !== '/admin';

  useEffect(() => {
    if (pathname === '/admin' || checkedThisVisit.current) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    } catch { /* Private browsing can block storage. */ }
    const timer = window.setTimeout(() => {
      checkedThisVisit.current = true;
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const dismiss = useCallback(() => {
    if (remember) {
      try { localStorage.setItem(DISMISSED_KEY, '1'); }
      catch { /* The dialog still closes if storage is unavailable. */ }
    }
    setOpen(false);
  }, [remember]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
      if (event.key !== 'Tab') return;
      const focusable = dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [visible, dismiss]);

  if (!visible) return null;

  return <div className="brave-prompt-overlay" onMouseDown={event => { if (event.target === event.currentTarget) dismiss(); }}>
    <section ref={dialog} className="brave-prompt" role="dialog" aria-modal="true" aria-labelledby="brave-prompt-title" aria-describedby="brave-prompt-description" dir="rtl">
      <button ref={closeButton} className="brave-prompt-close" type="button" aria-label="إغلاق الرسالة" onClick={dismiss}>×</button>
      <div className="brave-prompt-badge" aria-hidden="true">✦</div>
      <p className="brave-prompt-kicker">تجربة مشاهدة أفضل</p>
      <h2 id="brave-prompt-title">مرحبًا بك في WLEEDMOVIE</h2>
      <p id="brave-prompt-description" className="brave-prompt-description">ننصحك باستخدام متصفح Brave لتقليل الإعلانات والنوافذ المنبثقة من مشغلات الفيديو الخارجية. وتجد في دليلنا شرحًا لاختيار الترجمة وتحميلها وضبط توقيتها.</p>
      <div className="brave-prompt-actions">
        <a href="https://apps.apple.com/app/id1052879175" target="_blank" rel="noopener noreferrer">تحميل Brave للآيفون والآيباد <span aria-hidden="true">↗</span></a>
        <a href="https://brave.com/download/" target="_blank" rel="noopener noreferrer">تحميل Brave لويندوز <span aria-hidden="true">↗</span></a>
      </div>
      <Link className="brave-prompt-guide" href="/guide" onClick={dismiss}>شاهد دليل الترجمة <span aria-hidden="true">←</span></Link>
      <label className="brave-prompt-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>لا تُظهر هذه الرسالة مرة أخرى</span></label>
      <button className="brave-prompt-continue" type="button" onClick={dismiss}>متابعة إلى الموقع</button>
    </section>
  </div>;
}
