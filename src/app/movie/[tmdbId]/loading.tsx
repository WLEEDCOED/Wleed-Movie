export default function DetailsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-4 w-16 bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster Skeleton */}
        <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
          <div className="aspect-[2/3] w-full bg-neutral-800 rounded-2xl animate-pulse" />
        </div>

        {/* Info Skeleton */}
        <div className="flex-1 space-y-6">
          <div className="h-10 bg-neutral-800 rounded-lg w-3/4 animate-pulse" />
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-8 w-24 bg-neutral-800 rounded-full animate-pulse" />
            <div className="h-8 w-24 bg-neutral-800 rounded-full animate-pulse" />
            <div className="h-8 w-24 bg-neutral-800 rounded-full animate-pulse" />
          </div>

          <div className="space-y-3">
            <div className="h-4 bg-neutral-800 rounded w-full animate-pulse" />
            <div className="h-4 bg-neutral-800 rounded w-full animate-pulse" />
            <div className="h-4 bg-neutral-800 rounded w-3/4 animate-pulse" />
          </div>

          <div className="h-12 bg-neutral-800 rounded-xl w-48 animate-pulse mt-8" />
        </div>
      </div>
    </div>
  );
}
