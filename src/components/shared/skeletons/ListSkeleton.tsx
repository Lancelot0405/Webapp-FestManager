export default function ListSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse w-full">
      <div className="h-14 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)]"></div>
      <div className="h-14 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)]"></div>
      <div className="h-14 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)]"></div>
      <div className="h-14 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)]"></div>
    </div>
  );
}
