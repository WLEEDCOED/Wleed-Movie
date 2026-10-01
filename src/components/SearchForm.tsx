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
        className="w-full bg-zinc-100 border border-zinc-200 rounded-full px-4 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all text-sm"
      />
      <button
        type="submit"
        className="absolute left-1.5 top-1.5 bottom-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full px-4 sm:px-5 font-bold transition-all text-sm"
      >
        بحث
      </button>
    </form>
  );
}
