'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import SearchForm from './SearchForm';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-md shadow-lg shadow-red-900/10 py-3' : 'bg-gradient-to-b from-black/80 to-transparent py-5'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <span className="text-2xl md:text-3xl font-black text-red-600 tracking-tight group-hover:text-red-500 transition-colors">
              WleedMovie
            </span>
          </Link>
          <div className="flex-1 max-w-md mx-2">
            <SearchForm />
          </div>

          <div className="flex items-center gap-2 md:gap-6 shrink-0 hidden sm:flex">
            <Link
              href="/"
              className="text-sm md:text-base font-medium text-neutral-300 hover:text-white transition-colors px-2 py-1"
            >
              الرئيسية
            </Link>
            <Link
              href="/movies"
              className="text-sm md:text-base font-medium text-neutral-300 hover:text-white transition-colors px-2 py-1"
            >
              الأفلام
            </Link>
            <Link
              href="/series"
              className="text-sm md:text-base font-medium text-neutral-300 hover:text-white transition-colors px-2 py-1"
            >
              المسلسلات
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
