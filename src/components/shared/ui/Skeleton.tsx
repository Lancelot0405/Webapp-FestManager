interface SkeletonProps { className?: string }

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`shimmer rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-espresso-700 rounded-2xl p-4 shadow-card space-y-2.5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white dark:bg-espresso-700 rounded-2xl shadow-card">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?:   number;
  variant?: 'card' | 'row';
}

export function SkeletonList({ count = 4, variant = 'card' }: SkeletonListProps) {
  const Item = variant === 'card' ? CardSkeleton : RowSkeleton;
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <Item key={i} />)}
    </div>
  );
}
