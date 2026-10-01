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
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
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
          ? 'bg-black/95 shadow-lg shadow-red-900/10 py-3'
          : 'bg-gradient-to-b from-black/80 to-transparent py-4'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="shrink-0 group">
            <span className="text-xl md:text-2xl font-black text-red-600 tracking-tight group-hover:text-red-500 transition-colors">
              WleedMovie
            </span>
          </Link>

          {/* Search - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchForm />
          </div>

          {/* Nav links - desktop */}
          <div className="hidden md:flex items-center gap-5 shrink-0">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  pathname === link.href ? 'text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="القائمة"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-3 pb-4 border-t border-neutral-800/50 pt-4 space-y-4">
            <SearchForm />
            <div className="flex flex-col gap-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === link.href
                      ? 'bg-red-600/20 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
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
