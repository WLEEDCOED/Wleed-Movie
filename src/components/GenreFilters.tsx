import Link from 'next/link';

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

export default function GenreFilters({
  genres,
  activeGenre,
  activeYear,
  baseUrl,
  currentProvider,
}: GenreFiltersProps) {
  const buildUrl = (params: { genre?: number | null; year?: number | null }) => {
    const url = new URLSearchParams();
    if (currentProvider) url.set('provider', currentProvider.toString());
    if (params.genre) url.set('genre', params.genre.toString());
    if (params.year) url.set('year', params.year.toString());
    const qs = url.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

  return (
    <div className="space-y-2.5 mb-6">

      {/* ── Genre row ──────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {/* "الكل" chip */}
        <Link
          href={buildUrl({ year: activeYear })}
          className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            !activeGenre
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
          }`}
        >
          الكل
        </Link>

        {genres.map((g) => (
          <Link
            key={g.id}
            href={buildUrl({ genre: activeGenre === g.id ? null : g.id, year: activeYear })}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              activeGenre === g.id
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            {g.name}
          </Link>
        ))}
      </div>

      {/* ── Year row ───────────────────────────────── */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Link
          href={buildUrl({ genre: activeGenre })}
          className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            !activeYear
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
          }`}
        >
          كل السنوات
        </Link>

        {YEARS.map((y) => (
          <Link
            key={y}
            href={buildUrl({ genre: activeGenre, year: activeYear === y ? null : y })}
            className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              activeYear === y
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

    </div>
  );
}
