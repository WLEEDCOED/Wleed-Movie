import Link from 'next/link';

export const PROVIDERS = [
  { id: 8, name: 'Netflix', color: 'from-red-600 to-red-900', short: 'Netflix' },
  { id: 350, name: 'Apple TV+', color: 'from-slate-700 to-black', short: 'Apple' },
  { id: 384, name: 'HBO Max', color: 'from-purple-600 to-indigo-900', short: 'HBO' },
  { id: 9, name: 'Amazon', color: 'from-blue-500 to-cyan-800', short: 'Amazon' },
  { id: 337, name: 'Disney+', color: 'from-blue-700 to-blue-900', short: 'Disney' },
];

interface Props {
  activeProviderId?: number | null;
  baseUrl: string;
}

export default function NetworkFilters({ activeProviderId, baseUrl }: Props) {
  return (
    <div className="flex flex-wrap gap-2 md:gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
      <Link
        href={baseUrl}
        className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
          !activeProviderId ? 'bg-white text-black shadow-lg shadow-white/20' : 'glass text-neutral-300 hover:bg-white/10'
        }`}
      >
        الكل
      </Link>
      {PROVIDERS.map(net => (
        <Link
          key={net.id}
          href={`${baseUrl}?provider=${net.id}`}
          className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
            activeProviderId === net.id 
              ? `bg-gradient-to-r ${net.color} text-white shadow-lg` 
              : 'glass text-neutral-300 hover:bg-white/10'
          }`}
        >
          {net.name}
        </Link>
      ))}
    </div>
  );
}
