interface BarRowProps {
  label:     string;
  value:     number;
  maxVal:    number;
  color:     string;
  showPct?:  boolean;
  totalVal?: number;
}

export default function BarRow({ label, value, maxVal, color, showPct, totalVal }: BarRowProps) {
  const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
  const pctOfTotal = totalVal && totalVal > 0 ? Math.round((value / totalVal) * 100) : null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)] w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-[var(--text-secondary)] w-14 text-right shrink-0">
        {value.toLocaleString('fr-FR')}€
      </span>
      {showPct && pctOfTotal !== null && (
        <span className="text-xs text-[var(--text-muted)] w-8 text-right shrink-0">{pctOfTotal}%</span>
      )}
    </div>
  );
}
