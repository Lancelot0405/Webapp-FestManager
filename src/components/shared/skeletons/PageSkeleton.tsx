import { Skeleton, SkeletonList } from '@/components/ui/skeleton';

export default function PageSkeleton() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-48 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <SkeletonList count={4} variant="card" />
    </div>
  );
}
