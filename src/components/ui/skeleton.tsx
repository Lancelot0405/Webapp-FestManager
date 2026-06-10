import { Skeleton as HeroSkeleton } from "@heroui/react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <HeroSkeleton className={cn("rounded-md", className)} {...props} />
  )
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function RowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonList({ count = 5, className, variant = 'row' }: { count?: number; className?: string; variant?: 'row' | 'card' }) {
  return (
    <div className={cn(variant === 'card' ? "grid grid-cols-1 gap-3" : "divide-y divide-[var(--border)]", className)}>
      {Array.from({ length: count }).map((_, i) =>
        variant === 'card' ? <CardSkeleton key={i} /> : <RowSkeleton key={i} />
      )}
    </div>
  )
}

export { Skeleton, CardSkeleton, RowSkeleton, SkeletonList }
