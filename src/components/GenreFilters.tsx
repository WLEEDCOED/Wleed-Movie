import Link from 'next/link';

export const MOVIE_GENRES = [
  { id: 28, name: 'أكشن', emoji: '💥' },
  { id: 35, name: 'كوميدي', emoji: '😂' },
  { id: 18, name: 'دراما', emoji: '🎭' },
  { id: 27, name: 'رعب', emoji: '👻' },
  { id: 10749, name: 'رومانسي', emoji: '❤️' },
  { id: 878, name: 'خيال علمي', emoji: '🚀' },
  { id: 53, name: 'إثارة', emoji: '🔪' },
  { id: 16, name: 'أنيمي', emoji: '⛩️' },
  { id: 12, name: 'مغامرة', emoji: '🗺️' },
  { id: 80, name: 'جريمة', emoji: '🕵️' },
  { id: 99, name: 'وثائقي', emoji: '🎥' },
  { id: 14, name: 'فانتازيا', emoji: '🧙' },
];

export const TV_GENRES = [
  { id: 10759, name: 'أكشن', emoji: '💥' },
  { id: 35, name: 'كوميدي', emoji: '😂' },
  { id: 18, name: 'دراما', emoji: '🎭' },
  { id: 9648, name: 'غموض', emoji: '🕵️' },
  { id: 10765, name: 'خيال علمي', emoji: '🚀' },
  { id: 10768, name: 'حرب', emoji: '⚔️' },
  { id: 10749, name: 'رومانسي', emoji: '❤️' },
  { id: 16, name: 'أنيمي', emoji: '⛩️' },
  { id: 80, name: 'جريمة', emoji: '🔪' },
  { id: 99, name: 'وثائقي', emoji: '🎥' },
  { id: 10764, name: 'ريالتي', emoji: '📺' },
  { id: 10751, name: 'عائلي', emoji: '👨‍👩‍👧' },
];

// Generate recent years list
const currentYear = new Date().getFullYear();
export const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

interface GenreFiltersProps {
  genres: { id: number; name: string; emoji: string }[];
  activeGenre?: number | null;
  activeYear?: number | null;
  baseUrl: string;
  currentProvider?: number | null;
  currentPage?: number;
}

export default function GenreFilters({
  genres,
  activeGenre,
  activeYear,
  baseUrl,
  currentProvider,
  currentPage,
}: GenreFiltersProps) {
  const buildUrl = (params: { genre?: number | null; year?: number | null }) => {
    const url = new URLSearchParams();
    if (currentProvider) url.set('provider', currentProvider.toString());
    if (params.genre) url.set('genre', params.genre.toString());
    if (params.year) url.set('year', params.year.toString());
    return `${baseUrl}?${url.toString()}`;
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Genre chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildUrl({ year: activeYear })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            !activeGenre
              ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/30'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-400 hover:text-violet-600'
          }`}
        >
          الكل
        </Link>
        {genres.map((g) => (
          <Link
            key={g.id}
            href={buildUrl({ genre: activeGenre === g.id ? null : g.id, year: activeYear })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              activeGenre === g.id
                ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/30'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-400 hover:text-violet-600'
            }`}
          >
            <span>{g.emoji}</span>
            {g.name}
          </Link>
        ))}
      </div>

      {/* Year chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Link
          href={buildUrl({ genre: activeGenre })}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            !activeYear
              ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-cyan-400 hover:text-cyan-600'
          }`}
        >
          كل السنوات
        </Link>
        {YEARS.map((y) => (
          <Link
            key={y}
            href={buildUrl({ genre: activeGenre, year: activeYear === y ? null : y })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              activeYear === y
                ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-cyan-400 hover:text-cyan-600'
            }`}
          >
            {y}
          </Link>
        ))}
      </div>
    </div>
  );
}
