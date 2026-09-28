import Link from 'next/link';

export const PROVIDERS = [
  { id: 8, name: 'Netflix', color: 'from-red-600 to-red-900', hoverBorder: 'hover:border-red-500', shadow: 'shadow-red-900/40', short: 'Netflix' },
  { id: 350, name: 'Apple TV+', color: 'from-slate-700 to-black', hoverBorder: 'hover:border-slate-400', shadow: 'shadow-slate-700/40', short: 'Apple' },
  { id: 1899, name: 'HBO Max', color: 'from-purple-600 to-indigo-900', hoverBorder: 'hover:border-purple-500', shadow: 'shadow-purple-900/40', short: 'HBO' },
  { id: 9, name: 'Amazon', color: 'from-blue-500 to-cyan-800', hoverBorder: 'hover:border-blue-400', shadow: 'shadow-blue-900/40', short: 'Amazon' },
  { id: 337, name: 'Disney+', color: 'from-blue-700 to-blue-900', hoverBorder: 'hover:border-blue-500', shadow: 'shadow-blue-900/40', short: 'Disney' },
];

interface Props {
  activeProviderId?: number | null;
  baseUrl: string;
}

export default function NetworkFilters({ activeProviderId, baseUrl }: Props) {
  return (
    <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide snap-x">
      <Link
        href={baseUrl}
        className={`shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border snap-start ${
          !activeProviderId 
            ? 'bg-white text-black border-transparent shadow-lg shadow-white/10 scale-105' 
            : 'bg-transparent text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-500'
        }`}
      >
        الكل
      </Link>
      {PROVIDERS.map(net => (
        <Link
          key={net.id}
          href={`${baseUrl}?provider=${net.id}`}
          className={`shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border snap-start ${
            activeProviderId === net.id 
              ? `bg-gradient-to-r ${net.color} text-white border-transparent shadow-lg ${net.shadow} scale-105` 
              : `bg-transparent text-neutral-400 border-neutral-800 hover:text-white ${net.hoverBorder}`
          }`}
        >
          {net.name}
        </Link>
      ))}
    </div>
  );
}
