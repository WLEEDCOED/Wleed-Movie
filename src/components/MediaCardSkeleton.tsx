export default function MediaCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="relative aspect-[2/3] w-full bg-neutral-800 rounded-xl overflow-hidden shadow-lg" />
      <div className="flex flex-col gap-1 mt-1">
        <div className="h-4 bg-neutral-800 rounded-md w-3/4" />
        <div className="h-3 bg-neutral-800 rounded-md w-1/2" />
      </div>
    </div>
  );
}
