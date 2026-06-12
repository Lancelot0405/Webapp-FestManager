import type { ReactNode } from 'react';

export type SummaryType = 'income' | 'expense' | 'profit' | 'loss';

const summaryConfig: Record<SummaryType, { icon: string; value: string; bg: string }> = {
  income:  { icon: 'text-[var(--success)]',  value: 'text-[var(--success)]',  bg: 'bg-[var(--success)]/10 border-[var(--success)]/15' },
  expense: { icon: 'text-[var(--danger)]',   value: 'text-[var(--danger)]',   bg: 'bg-[var(--danger)]/10 border-[var(--danger)]/15'   },
  profit:  { icon: 'text-[var(--primary)]',  value: 'text-[var(--primary)]',  bg: 'glass-card'                                        },
  loss:    { icon: 'text-[var(--warning)]',  value: 'text-[var(--warning)]',  bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/15' },
};

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  type: SummaryType;
}

export default function SummaryCard({ icon, label, value, type }: SummaryCardProps) {
  const cfg = summaryConfig[type];
  return (
    <div className={`rounded-xl p-4 flex items-center gap-3 border ${cfg.bg}`}>
      <div className={`shrink-0 ${cfg.icon}`}>{icon}</div>
      <div className="flex-1 flex justify-between items-center">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <p className={`text-xl font-bold ${cfg.value}`}>{value.toLocaleString('fr-FR')}€</p>
      </div>
    </div>
  );
}
