import MediaCardSkeleton from '@/components/MediaCardSkeleton';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Hero Skeleton */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-neutral-900/50 p-8 md:p-12 border border-neutral-800/50 h-[300px] md:h-[400px] animate-pulse">
          <div className="relative z-10 h-full flex flex-col justify-center">
            <div className="h-12 md:h-16 bg-neutral-800 rounded-lg w-1/3 mb-4" />
            <div className="h-6 md:h-8 bg-neutral-800 rounded-lg w-1/2 mb-8" />
            <div className="h-14 bg-neutral-800 rounded-xl w-full max-w-lg" />
          </div>
        </div>
      </section>

      {/* Categories Skeleton */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-10 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 w-24 bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-neutral-800 rounded-lg w-48 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
