'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PLAYER_PRESENCE_EVENT, type PlayerPresenceDetail } from '@/lib/analytics-events';

const VISITOR_KEY = 'wleedmovie-visitor-id';
const TAB_KEY = 'wleedmovie-tab-id';
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;

function idFromStorage(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing && UUID.test(existing)) return existing;
    const id = crypto.randomUUID();
    storage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function PresenceTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const visitorId = useRef('');
  const tabId = useRef('');
  const currentPath = useRef(pathname);
  const watching = useRef(false);
  const tracking = useRef(false);

  const send = useCallback((pageView = false, active = true) => {
    if (!enabled || !visitorId.current || !tabId.current) return;
    const body = JSON.stringify({
      visitorId: visitorId.current,
      tabId: tabId.current,
      path: currentPath.current,
      watching: watching.current,
      active,
      pageView,
    });
    void fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: !active,
    }).catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    visitorId.current ||= idFromStorage(localStorage, VISITOR_KEY);
    tabId.current ||= idFromStorage(sessionStorage, TAB_KEY);
    if (pathname.startsWith('/admin')) {
      if (tracking.current) send(false, false);
      tracking.current = false;
      return;
    }
    currentPath.current = pathname;
    watching.current = false;
    tracking.current = true;
    send(true);
  }, [enabled, pathname, send]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      if (tracking.current && document.visibilityState === 'visible') send();
    }, 30_000);
    const onVisibility = () => {
      if (tracking.current) send(false, document.visibilityState === 'visible');
    };
    const onPlayerPresence = (event: Event) => {
      watching.current = (event as CustomEvent<PlayerPresenceDetail>).detail?.watching === true;
      if (tracking.current) send(false, document.visibilityState === 'visible');
    };
    const onPageHide = () => {
      if (tracking.current) send(false, false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(PLAYER_PRESENCE_EVENT, onPlayerPresence);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(PLAYER_PRESENCE_EVENT, onPlayerPresence);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [enabled, send]);

  return null;
}
