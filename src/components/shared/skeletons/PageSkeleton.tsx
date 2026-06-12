export default function PageSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse py-5">
      {/* Title skeleton */}
      <div className="h-8 w-48 bg-[var(--glass-bg)] rounded-lg"></div>
      
      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-[var(--glass-bg)] rounded-xl"></div>
        <div className="h-32 bg-[var(--glass-bg)] rounded-xl"></div>
        <div className="h-32 bg-[var(--glass-bg)] rounded-xl"></div>
      </div>
      
      {/* Table/List skeleton */}
      <div className="h-64 bg-[var(--glass-bg)] rounded-xl"></div>
    </div>
  );
}
