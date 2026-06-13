import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, ProgressBar } from '@heroui/react';
import type { FestivalEvent } from '../../types';

interface Props {
  filteredEvents: FestivalEvent[];
}

type SummaryType = 'income' | 'expense' | 'profit' | 'loss';

const summaryConfig: Record<SummaryType, { iconClass: string; valueClass: string }> = {
  income:  { iconClass: 'text-success',  valueClass: 'text-success'  },
  expense: { iconClass: 'text-danger',   valueClass: 'text-danger'   },
  profit:  { iconClass: 'text-accent',   valueClass: 'text-accent'   },
  loss:    { iconClass: 'text-warning',  valueClass: 'text-warning'  },
};

function SummaryCard({ icon, label, value, type }: {
  icon: React.ReactNode; label: string; value: number; type: SummaryType;
}) {
  const cfg = summaryConfig[type];
  return (
    <Card className="p-4 flex-row items-center gap-3">
      <div className={`shrink-0 ${cfg.iconClass}`}>{icon}</div>
      <div className="flex-1 flex justify-between items-center">
        <p className="text-sm text-muted">{label}</p>
        <p className={`text-xl font-bold ${cfg.valueClass}`}>{value.toLocaleString('fr-FR')}€</p>
      </div>
    </Card>
  );
}

function BarRow({ label, value, maxVal, color, showPct, totalVal }: {
  label: string; value: number; maxVal: number; color: string;
  showPct?: boolean; totalVal?: number;
}) {
  const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
  const pctOfTotal = totalVal && totalVal > 0 ? Math.round((value / totalVal) * 100) : null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1">
        <ProgressBar value={pct} aria-label={label} size="sm">
          <ProgressBar.Track className="bg-default">
            <ProgressBar.Fill className={color} />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
      <span className="text-xs font-medium text-foreground w-14 text-right shrink-0">
        {value.toLocaleString('fr-FR')}€
      </span>
      {showPct && pctOfTotal !== null && (
        <span className="text-xs text-muted w-8 text-right shrink-0">{pctOfTotal}%</span>
      )}
    </div>
  );
}

export default function FinanceSummaryCards({ filteredEvents }: Props) {
  const approvedReceiptsTotal = filteredEvents.reduce((sum, e) =>
    sum + e.receipts.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0), 0
  );
  const totalIncome = filteredEvents.reduce((sum, e) => sum + e.financials.income, 0);
  const totalExpense = filteredEvents.reduce((sum, e) => {
    const fixedExp = Object.values(e.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
    const approvedReceipts = e.receipts.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
    return sum + fixedExp + approvedReceipts;
  }, 0);
  const netProfit = totalIncome - totalExpense;

  const breakdownRent        = filteredEvents.reduce((s, e) => s + (e.financials.expenses.rent ?? 0), 0);
  const breakdownIngredients = filteredEvents.reduce((s, e) => s + (e.financials.expenses.ingredients ?? 0), 0);
  const breakdownTransport   = filteredEvents.reduce((s, e) => s + (e.financials.expenses.transport ?? 0), 0);
  const breakdownStaff       = filteredEvents.reduce((s, e) => s + (e.financials.expenses.staff ?? 0), 0);
  const knownKeys = new Set(['rent', 'ingredients', 'transport', 'staff']);
  const breakdownOther = filteredEvents.reduce((sum, e) =>
    sum + Object.entries(e.financials.expenses)
      .filter(([k]) => !knownKeys.has(k))
      .reduce<number>((s, [, v]) => s + (v ?? 0), 0), 0
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard icon={<TrendingUp size={20} />}   label="Tổng doanh thu" value={totalIncome}  type="income" />
        <SummaryCard icon={<TrendingDown size={20} />} label="Tổng chi phí"   value={totalExpense} type="expense" />
        <SummaryCard icon={<DollarSign size={20} />}   label="Lợi nhuận ròng" value={netProfit}    type={netProfit >= 0 ? 'profit' : 'loss'} />
      </div>

      {totalExpense > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-muted mb-3">Phân bổ chi phí</h2>
          <div className="space-y-2.5">
            {breakdownRent > 0         && <BarRow label="Booth/Thuê"  value={breakdownRent}        maxVal={totalExpense} color="bg-violet-400"   showPct totalVal={totalExpense} />}
            {breakdownIngredients > 0  && <BarRow label="Nguyên liệu" value={breakdownIngredients}  maxVal={totalExpense} color="bg-warning"       showPct totalVal={totalExpense} />}
            {breakdownTransport > 0    && <BarRow label="Vận chuyển"  value={breakdownTransport}    maxVal={totalExpense} color="bg-blue-400"      showPct totalVal={totalExpense} />}
            {breakdownStaff > 0        && <BarRow label="Lương NV"    value={breakdownStaff}        maxVal={totalExpense} color="bg-success"       showPct totalVal={totalExpense} />}
            {approvedReceiptsTotal > 0 && <BarRow label="Chi phí NV"  value={approvedReceiptsTotal} maxVal={totalExpense} color="bg-pink-400"      showPct totalVal={totalExpense} />}
            {breakdownOther > 0        && <BarRow label="Khác"        value={breakdownOther}        maxVal={totalExpense} color="bg-muted"         showPct totalVal={totalExpense} />}
          </div>
        </Card>
      )}
    </>
  );
}
