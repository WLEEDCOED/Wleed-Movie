import MediaCardSkeleton from '@/components/MediaCardSkeleton';

export default function MoviesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="h-10 bg-neutral-800 rounded-lg w-48 animate-pulse" />
        <div className="w-full md:w-96 h-12 bg-neutral-800 rounded-xl animate-pulse" />
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3 mb-10 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
        {Array.from({ length: 18 }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
