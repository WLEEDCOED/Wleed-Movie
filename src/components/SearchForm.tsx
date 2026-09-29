'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن فيلم أو مسلسل..."
        className="w-full bg-neutral-900/80 border border-neutral-700/60 rounded-full px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm shadow-lg backdrop-blur-sm"
      />
      <button
        type="submit"
        className="absolute left-1.5 top-1.5 bottom-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full px-4 sm:px-5 font-bold transition-all text-sm"
      >
        بحث
      </button>
    </form>
  );
}

