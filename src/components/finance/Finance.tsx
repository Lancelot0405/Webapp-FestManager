import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, Pencil, Check, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import type { ExpenseStatus, FestivalEvent } from '../../types';

interface FinanceProps {
  onSelectEvent: (id: number) => void;
}

export default function Finance({ onSelectEvent }: FinanceProps) {
  const { state, updateEvent, updateExpenseStatus } = useApp();
  const { events } = state;

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editIncome, setEditIncome] = useState<number>(0);
  const [editRent, setEditRent] = useState<number>(0);
  const [editIngredients, setEditIngredients] = useState<number>(0);
  const [editTransport, setEditTransport] = useState<number>(0);
  const [editStaff, setEditStaff] = useState<number>(0);

  const allMonths: string[] = [];
  events.forEach(e => {
    const parts = e.date.split('-');
    if (parts.length === 3) {
      const month = `${parts[1]}/${parts[2]}`;
      if (!allMonths.includes(month)) allMonths.push(month);
    }
  });
  allMonths.sort();

  const filteredEvents = selectedMonth === 'all'
    ? events
    : events.filter(e => {
        const parts = e.date.split('-');
        return parts.length === 3 && `${parts[1]}/${parts[2]}` === selectedMonth;
      });

  const allApprovedReceiptsTotal = filteredEvents.reduce((sum, e) =>
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
  const breakdownApprovedReceipts = allApprovedReceiptsTotal;

  const knownKeys = new Set(['rent', 'ingredients', 'transport', 'staff']);
  const breakdownOther = filteredEvents.reduce((sum, e) =>
    sum + Object.entries(e.financials.expenses)
      .filter(([k]) => !knownKeys.has(k))
      .reduce<number>((s, [, v]) => s + (v ?? 0), 0), 0
  );

  const pendingReceipts = filteredEvents.flatMap(e =>
    e.receipts
      .filter(r => r.status === 'pending')
      .map(r => ({ ...r, eventName: e.name, eventId: e.id }))
  );

  const startEditing = (event: FestivalEvent) => {
    setEditingEventId(event.id);
    setEditIncome(event.financials.income);
    setEditRent(event.financials.expenses.rent ?? 0);
    setEditIngredients(event.financials.expenses.ingredients ?? 0);
    setEditTransport(event.financials.expenses.transport ?? 0);
    setEditStaff(event.financials.expenses.staff ?? 0);
  };

  const saveEditing = (event: FestivalEvent) => {
    updateEvent({
      ...event,
      financials: {
        income: editIncome,
        expenses: { ...event.financials.expenses, rent: editRent, ingredients: editIngredients, transport: editTransport, staff: editStaff },
      },
    });
    setEditingEventId(null);
  };

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const rows = events.map(event => {
      const expTotal = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
      const approvedReceipts = event.receipts.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
      const totalExp = expTotal + approvedReceipts;
      return {
        'Sự kiện': event.name, 'Ngày': event.date, 'Địa điểm': event.location,
        'Trạng thái': event.status, 'Doanh thu (€)': event.financials.income,
        'Chi phí (€)': totalExp, 'Lợi nhuận (€)': event.financials.income - totalExp,
        'Số nhân viên': event.staff.length,
        'Số chi phí chờ duyệt': event.receipts.filter(r => r.status === 'pending').length,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo tài chính');
    XLSX.writeFile(wb, 'festmanager-bao-cao-tai-chinh.xlsx');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button
          onPress={handleExport}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 rounded-xl bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 border border-[var(--success)]/20"
        >
          <FileSpreadsheet size={15} /> Xuất Excel
        </Button>
      </div>

      {/* Month filter */}
      {allMonths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-x-visible">
          <Button
            variant="ghost"
            onPress={() => setSelectedMonth('all')}
            className={`h-auto min-w-0 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedMonth === 'all'
                ? 'bg-[var(--primary)] text-[var(--background)]'
                : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Tất cả
          </Button>
          {allMonths.map(m => (
            <Button
              key={m}
              variant="ghost"
              onPress={() => setSelectedMonth(m)}
              className={`h-auto min-w-0 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedMonth === m
                  ? 'bg-[var(--primary)] text-[var(--background)]'
                  : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {m}
            </Button>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard
          icon={<TrendingUp size={20} />}
          label="Tổng doanh thu"
          value={totalIncome}
          type="income"
        />
        <SummaryCard
          icon={<TrendingDown size={20} />}
          label="Tổng chi phí"
          value={totalExpense}
          type="expense"
        />
        <SummaryCard
          icon={<DollarSign size={20} />}
          label="Lợi nhuận ròng"
          value={netProfit}
          type={netProfit >= 0 ? 'profit' : 'loss'}
        />
      </div>

      {/* Cost breakdown */}
      {totalExpense > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Phân bổ chi phí</h2>
          <div className="space-y-2.5">
            {breakdownRent > 0 && (
              <BarRow label="Booth/Thuê" value={breakdownRent} maxVal={totalExpense} color="bg-purple-400" showPct totalVal={totalExpense} />
            )}
            {breakdownIngredients > 0 && (
              <BarRow label="Nguyên liệu" value={breakdownIngredients} maxVal={totalExpense} color="bg-[var(--warning)]" showPct totalVal={totalExpense} />
            )}
            {breakdownTransport > 0 && (
              <BarRow label="Vận chuyển" value={breakdownTransport} maxVal={totalExpense} color="bg-indigo-400" showPct totalVal={totalExpense} />
            )}
            {breakdownStaff > 0 && (
              <BarRow label="Lương NV" value={breakdownStaff} maxVal={totalExpense} color="bg-[var(--success)]" showPct totalVal={totalExpense} />
            )}
            {breakdownApprovedReceipts > 0 && (
              <BarRow label="Chi phí NV" value={breakdownApprovedReceipts} maxVal={totalExpense} color="bg-pink-400" showPct totalVal={totalExpense} />
            )}
            {breakdownOther > 0 && (
              <BarRow label="Khác" value={breakdownOther} maxVal={totalExpense} color="bg-[var(--text-muted)]" showPct totalVal={totalExpense} />
            )}
          </div>
        </div>
      )}

      {/* Pending staff expenses */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Chi phí nhân viên chờ duyệt</h2>
        {pendingReceipts.length === 0 ? (
          <p className="text-sm text-[var(--success)]">Không có chi phí chờ duyệt ✓</p>
        ) : (
          <div className="space-y-2">
            {pendingReceipts.map(r => (
              <div key={`${r.eventId}-${r.id}`} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--glass-border)] last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{r.staffName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{r.type} · {r.amount.toLocaleString('fr-FR')}€ · {r.date}</p>
                  <p className="text-xs text-[var(--primary)]/70">{r.eventName}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    onPress={() => updateExpenseStatus(r.eventId, r.id, 'approved' as ExpenseStatus)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-0.5 bg-[var(--success)]/10 hover:bg-[var(--success)]/20 text-[var(--success)] rounded-lg border border-[var(--success)]/20"
                  >
                    <Check size={12} /> Duyệt
                  </Button>
                  <Button
                    onPress={() => updateExpenseStatus(r.eventId, r.id, 'rejected' as ExpenseStatus)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-0.5 rounded-lg text-[var(--danger)] bg-[var(--danger-light)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20"
                  >
                    <X size={12} /> Từ chối
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-event breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Theo sự kiện</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map(event => {
            const fixedExp = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
            const approvedReceiptsForEvent = event.receipts
              .filter(r => r.status === 'approved')
              .reduce((s, r) => s + r.amount, 0);
            const expTotal = fixedExp + approvedReceiptsForEvent;
            const profit = event.financials.income - expTotal;
            const maxVal = Math.max(event.financials.income, expTotal, 1);
            const isEditing = editingEventId === event.id;

            return (
              <div key={event.id} className="glass-card rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <Button
                    variant="ghost"
                    onPress={() => onSelectEvent(event.id)}
                    className="h-auto min-w-0 flex-1 justify-start rounded-none p-0 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">{event.name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{event.date}</p>
                    </div>
                  </Button>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <StatusBadge status={event.status} />
                    <Button
                      onPress={() => isEditing ? setEditingEventId(null) : startEditing(event)}
                      variant="ghost"
                      isIconOnly
                      size="sm"
                      className="rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil size={14} />
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Doanh thu (€)', val: editIncome, set: setEditIncome },
                        { label: 'Booth (€)',      val: editRent,   set: setEditRent },
                        { label: 'Nguyên liệu (€)', val: editIngredients, set: setEditIngredients },
                        { label: 'Vận chuyển (€)', val: editTransport,   set: setEditTransport },
                        { label: 'Lương NV (€)',   val: editStaff,  set: setEditStaff },
                      ].map(({ label, val, set }) => (
                        <Input
                          key={label}
                          label={label}
                          type="number"
                          value={String(val)}
                          onChange={value => set(Number(value))}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onPress={() => saveEditing(event)} variant="primary" fullWidth>Lưu</Button>
                      <Button onPress={() => setEditingEventId(null)} variant="ghost" fullWidth>Hủy</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <BarRow label="Doanh thu" value={event.financials.income} maxVal={maxVal} color="bg-[var(--success)]" />
                      <BarRow label="Chi phí"   value={expTotal}                maxVal={maxVal} color="bg-[var(--danger)]"  />
                    </div>
                    {approvedReceiptsForEvent > 0 && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Bao gồm {approvedReceiptsForEvent.toLocaleString('fr-FR')}€ chi phí nhân viên
                      </p>
                    )}
                    <div className="mt-3 flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-muted)]">Lợi nhuận</span>
                      <span className={profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                        {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-FR')}€
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

type SummaryType = 'income' | 'expense' | 'profit' | 'loss';

const summaryConfig: Record<SummaryType, { icon: string; value: string; bg: string }> = {
  income:  { icon: 'text-[var(--success)]',  value: 'text-[var(--success)]',  bg: 'bg-[var(--success)]/10 border-[var(--success)]/15' },
  expense: { icon: 'text-[var(--danger)]',   value: 'text-[var(--danger)]',   bg: 'bg-[var(--danger)]/10 border-[var(--danger)]/15'   },
  profit:  { icon: 'text-[var(--primary)]',  value: 'text-[var(--primary)]',  bg: 'glass-card'                                        },
  loss:    { icon: 'text-[var(--warning)]',  value: 'text-[var(--warning)]',  bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/15' },
};

function SummaryCard({ icon, label, value, type }: { icon: React.ReactNode; label: string; value: number; type: SummaryType }) {
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

interface BarRowProps {
  label:     string;
  value:     number;
  maxVal:    number;
  color:     string;
  showPct?:  boolean;
  totalVal?: number;
}

function BarRow({ label, value, maxVal, color, showPct, totalVal }: BarRowProps) {
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
