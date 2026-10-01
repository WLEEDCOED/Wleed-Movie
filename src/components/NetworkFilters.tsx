import Link from 'next/link';

export const PROVIDERS = [
  { id: 8,    name: 'Netflix',   hoverBorder: 'hover:border-red-500',    activeColor: 'bg-red-600/20 text-red-400 border-red-500/60',    short: 'Netflix' },
  { id: 350,  name: 'Apple TV+', hoverBorder: 'hover:border-slate-400',  activeColor: 'bg-slate-700/20 text-slate-300 border-slate-500/60', short: '+Apple TV' },
  { id: 1899, name: 'HBO Max',   hoverBorder: 'hover:border-purple-500', activeColor: 'bg-purple-600/20 text-purple-400 border-purple-500/60', short: 'HBO Max' },
  { id: 9,    name: 'Amazon',    hoverBorder: 'hover:border-blue-400',   activeColor: 'bg-blue-600/20 text-blue-400 border-blue-500/60',   short: 'Amazon' },
  { id: 337,  name: 'Disney+',   hoverBorder: 'hover:border-blue-500',   activeColor: 'bg-blue-700/20 text-blue-400 border-blue-600/60',   short: '+Disney' },
];

interface NetworkFiltersProps {
  activeProviderId: number | null;
  baseUrl: string;
}

export default function NetworkFilters({ activeProviderId, baseUrl }: NetworkFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      <Link
        href={baseUrl}
        className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
          !activeProviderId
            ? 'bg-white/10 text-white border-white/20'
            : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
        }`}
      >
        الكل
      </Link>
      {PROVIDERS.map((p) => (
        <Link
          key={p.id}
          href={activeProviderId === p.id ? baseUrl : `${baseUrl}?provider=${p.id}`}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
            activeProviderId === p.id
              ? p.activeColor
              : `border-neutral-700 text-neutral-400 ${p.hoverBorder} hover:text-white`
          }`}
        >
          {p.short}
        </Link>
      ))}
    </div>
  );
}
