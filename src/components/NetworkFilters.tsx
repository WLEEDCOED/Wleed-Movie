import Link from 'next/link';

export const PROVIDERS = [
  { id: 8,    short: 'Netflix' },
  { id: 350,  short: 'Apple TV+' },
  { id: 1899, short: 'HBO Max' },
  { id: 9,    short: 'Amazon' },
  { id: 337,  short: 'Disney+' },
];

interface NetworkFiltersProps {
  activeProviderId: number | null;
  baseUrl: string;
}

export default function NetworkFilters({ activeProviderId, baseUrl }: NetworkFiltersProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
      <Link
        href={baseUrl}
        className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
          !activeProviderId
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
        }`}
      >
        الكل
      </Link>

      {PROVIDERS.map((p) => (
        <Link
          key={p.id}
          href={activeProviderId === p.id ? baseUrl : `${baseUrl}?provider=${p.id}`}
          className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            activeProviderId === p.id
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
          }`}
        >
          {p.short}
        </Link>
      ))}
    </div>
  );
}
