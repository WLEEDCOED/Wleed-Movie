import Link from 'next/link';

export const PROVIDERS = [
  { id: 8,    name: 'Netflix',   color: 'from-red-500 to-red-700',      border: 'border-red-200 hover:border-red-400',   textActive: 'text-red-700 bg-red-50',   short: 'Netflix' },
  { id: 350,  name: 'Apple TV+', color: 'from-zinc-700 to-black',        border: 'border-zinc-200 hover:border-zinc-400', textActive: 'text-zinc-800 bg-zinc-100', short: 'Apple' },
  { id: 1899, name: 'HBO Max',   color: 'from-violet-600 to-indigo-800', border: 'border-violet-200 hover:border-violet-400', textActive: 'text-violet-700 bg-violet-50', short: 'HBO' },
  { id: 9,    name: 'Amazon',    color: 'from-sky-500 to-blue-700',      border: 'border-sky-200 hover:border-sky-400',   textActive: 'text-sky-700 bg-sky-50',   short: 'Amazon' },
  { id: 337,  name: 'Disney+',   color: 'from-blue-600 to-blue-900',     border: 'border-blue-200 hover:border-blue-400', textActive: 'text-blue-700 bg-blue-50', short: 'Disney+' },
];

interface NetworkFiltersProps {
  activeProviderId: number | null;
  baseUrl: string;
}

export default function NetworkFilters({ activeProviderId, baseUrl }: NetworkFiltersProps) {
  const buildUrl = (id: number | null) => {
    if (!id || id === activeProviderId) return baseUrl;
    return `${baseUrl}?provider=${id}`;
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      <Link
        href={baseUrl}
        className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
          !activeProviderId
            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
            : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800'
        }`}
      >
        الكل
      </Link>
      {PROVIDERS.map((p) => (
        <Link
          key={p.id}
          href={buildUrl(p.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
            activeProviderId === p.id
              ? `${p.textActive} border-current shadow-sm`
              : `${p.border} text-zinc-500 hover:text-zinc-800`
          }`}
        >
          {p.short}
        </Link>
      ))}
    </div>
  );
}
