'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const MOVIE_GENRES = [
  { id: 28,    name: 'أكشن' },
  { id: 35,    name: 'كوميدي' },
  { id: 18,    name: 'دراما' },
  { id: 27,    name: 'رعب' },
  { id: 10749, name: 'رومانسي' },
  { id: 878,   name: 'خيال علمي' },
  { id: 53,    name: 'إثارة' },
  { id: 16,    name: 'أنيمي' },
  { id: 12,    name: 'مغامرة' },
  { id: 80,    name: 'جريمة' },
  { id: 99,    name: 'وثائقي' },
  { id: 14,    name: 'فانتازيا' },
];

export const TV_GENRES = [
  { id: 10759, name: 'أكشن' },
  { id: 35,    name: 'كوميدي' },
  { id: 18,    name: 'دراما' },
  { id: 9648,  name: 'غموض' },
  { id: 10765, name: 'خيال علمي' },
  { id: 10768, name: 'حرب' },
  { id: 10749, name: 'رومانسي' },
  { id: 16,    name: 'أنيمي' },
  { id: 80,    name: 'جريمة' },
  { id: 99,    name: 'وثائقي' },
  { id: 10764, name: 'ريالتي' },
  { id: 10751, name: 'عائلي' },
];

const currentYear = new Date().getFullYear();
export const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

interface GenreFiltersProps {
  genres: { id: number; name: string }[];
  activeGenre?: number | null;
  activeYear?: number | null;
  baseUrl: string;
  currentProvider?: number | null;
}

function Dropdown({
  label,
  items,
  activeId,
  onSelect,
}: {
  label: string;
  items: { id: number; name: string }[];
  activeId: number | null | undefined;
  onSelect: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeItem = items.find(i => i.id === activeId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
          activeId
            ? 'bg-neutral-100 text-neutral-900 border-neutral-100'
            : 'border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white'
        }`}
      >
        {activeItem ? activeItem.name : label}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-50 w-44 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Reset option */}
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${
              !activeId
                ? 'bg-neutral-700 text-white font-semibold'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            الكل
          </button>
          <div className="h-px bg-neutral-800" />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id === activeId ? null : item.id); setOpen(false); }}
                className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${
                  item.id === activeId
                    ? 'bg-neutral-700 text-white font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GenreFilters({
  genres,
  activeGenre,
  activeYear,
  baseUrl,
  currentProvider,
}: GenreFiltersProps) {
  const router = useRouter();

  const navigate = (newGenre: number | null, newYear: number | null) => {
    const params = new URLSearchParams();
    if (currentProvider) params.set('provider', currentProvider.toString());
    if (newGenre)         params.set('genre', newGenre.toString());
    if (newYear)          params.set('year', newYear.toString());
    const qs = params.toString();
    router.push(qs ? `${baseUrl}?${qs}` : baseUrl);
  };

  const yearItems = YEARS.map(y => ({ id: y, name: String(y) }));

  return (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      <Dropdown
        label="التصنيف"
        items={genres}
        activeId={activeGenre}
        onSelect={(id) => navigate(id, activeYear ?? null)}
      />
      <Dropdown
        label="السنة"
        items={yearItems}
        activeId={activeYear}
        onSelect={(id) => navigate(activeGenre ?? null, id)}
      />

      {/* Clear all button — only show when something is active */}
      {(activeGenre || activeYear) && (
        <button
          onClick={() => navigate(null, null)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-neutral-500 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          مسح الفلاتر
        </button>
      )}
    </div>
  );
}
