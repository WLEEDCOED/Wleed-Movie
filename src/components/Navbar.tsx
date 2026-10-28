'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppearanceSettings from './AppearanceSettings';
import AmbientCanvas from './AmbientCanvas';

const links = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/movies', label: 'Movies', icon: '▧' },
  { href: '/series', label: 'Shows', icon: '▣' },
  { href: '/lists', label: 'My List', icon: '▱' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isWatchPage = pathname?.startsWith('/watch/');
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSearchOpen(false); setSettingsOpen(false); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSettingsOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  return <>
    {!isWatchPage && pathname !== '/admin' && <div className="ambient-scene" aria-hidden="true"><AmbientCanvas /></div>}
    <header className={`site-header${isWatchPage ? ' watch-header' : ''}`}>
      <Link href="/" className="site-logo" aria-label="WleedMovie home">
        <span className="logo-clapper">◩</span><span className="logo-word">WLEED<span>MOVIE</span></span>
      </Link>
      <nav className="floating-nav" aria-label="Main navigation">
        {links.map(link => <Link key={link.href} href={link.href} onClick={() => { setSearchOpen(false); setSettingsOpen(false); }} className={`nav-link ${pathname === link.href ? 'active' : ''}`}><span className="nav-icon">{link.icon}</span><span className="nav-label">{link.label}</span></Link>)}
        <span className="nav-divider" />
        <button type="button" className="nav-tool" aria-label="Search" onClick={() => { setSettingsOpen(false); setSearchOpen(true); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 5 5"/></svg></button>
        <button type="button" className="nav-tool" aria-label="Settings" aria-expanded={settingsOpen} onClick={() => { setSearchOpen(false); setSettingsOpen(value => !value); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 2h4l.6 2.2 1.8.8 2-.9 2.8 2.8-.9 2 .8 1.8L23 11v4l-2.2.6-.8 1.8.9 2-2.8 2.8-2-.9-1.8.8L14 24h-4l-.6-2.2-1.8-.8-2 .9-2.8-2.8.9-2-.8-1.8L1 15v-4l2.2-.6.8-1.8-.9-2L5.9 3.8l2 .9 1.8-.8L10 2Z" transform="translate(0 -1) scale(.96)"/><circle cx="12" cy="12" r="3"/></svg></button>
      </nav>
    </header>
    <AppearanceSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    {searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search movies and shows" onClick={() => setSearchOpen(false)}><div className="search-panel" onClick={event => event.stopPropagation()}><div className="search-panel-top"><span>Search</span><button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">✕</button></div><form onSubmit={search}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search movies and shows..." aria-label="Search movies and shows" /><button type="submit">Search</button></form><p>Press Enter to search the catalog.</p></div></div>}
  </>;
}
