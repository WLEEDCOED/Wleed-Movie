'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchForm from './SearchForm';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/movies', label: 'الأفلام' },
    { href: '/series', label: 'المسلسلات' },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-colors duration-200 ${
        isScrolled || menuOpen
          ? 'bg-white/95 shadow-sm shadow-zinc-200/80 border-b border-zinc-100 py-2.5'
          : 'bg-white/80 py-3'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="shrink-0 group">
            <span className="text-xl md:text-2xl font-black tracking-tight">
              <span className="gradient-text">Wleed</span>
              <span className="text-zinc-800">Movie</span>
            </span>
          </Link>

          {/* Search - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchForm />
          </div>

          {/* Nav links - desktop */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  pathname === link.href
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="القائمة"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-zinc-100 pt-3 space-y-3">
            <SearchForm />
            <div className="flex flex-col gap-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    pathname === link.href
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
