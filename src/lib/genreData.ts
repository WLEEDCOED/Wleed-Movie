// Genre and year data - server-safe, no client hooks

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
