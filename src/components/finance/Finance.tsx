// =============================================================================
// src/components/finance/Finance.tsx  (admin only)
// =============================================================================

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, Pencil, Check, X } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import type { ExpenseStatus, FestivalEvent } from '../../types';

interface FinanceProps {
  onSelectEvent: (id: number) => void;
}

export default function Finance({ onSelectEvent }: FinanceProps) {
  const { state, updateEvent, updateExpenseStatus } = useApp();
  const { events } = state;

  // Month filter
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Edit state
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editIncome, setEditIncome] = useState<number>(0);
  const [editRent, setEditRent] = useState<number>(0);
  const [editIngredients, setEditIngredients] = useState<number>(0);
  const [editTransport, setEditTransport] = useState<number>(0);
  const [editStaff, setEditStaff] = useState<number>(0);

  // Collect available months from all events
  const allMonths: string[] = [];
  events.forEach(e => {
    const parts = e.date.split('-');
    if (parts.length === 3) {
      const month = `${parts[1]}/${parts[2]}`; // MM/YYYY
      if (!allMonths.includes(month)) allMonths.push(month);
    }
  });
  allMonths.sort();

  // Filter events by selected month
  const filteredEvents = selectedMonth === 'all'
    ? events
    : events.filter(e => {
        const parts = e.date.split('-');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[2]}` === selectedMonth;
        }
        return false;
      });

  // Compute totals from filtered events
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

  // Cost breakdown by category across filtered events
  const breakdownRent = filteredEvents.reduce((s, e) => s + (e.financials.expenses.rent ?? 0), 0);
  const breakdownIngredients = filteredEvents.reduce((s, e) => s + (e.financials.expenses.ingredients ?? 0), 0);
  const breakdownTransport = filteredEvents.reduce((s, e) => s + (e.financials.expenses.transport ?? 0), 0);
  const breakdownStaff = filteredEvents.reduce((s, e) => s + (e.financials.expenses.staff ?? 0), 0);
  const breakdownApprovedReceipts = allApprovedReceiptsTotal;

  // Extra keys
  const knownKeys = new Set(['rent', 'ingredients', 'transport', 'staff']);
  const breakdownOther = filteredEvents.reduce((sum, e) => {
    return sum + Object.entries(e.financials.expenses)
      .filter(([k]) => !knownKeys.has(k))
      .reduce<number>((s, [, v]) => s + (v ?? 0), 0);
  }, 0);

  // Pending receipts across filtered events
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
        expenses: {
          ...event.financials.expenses,
          rent: editRent,
          ingredients: editIngredients,
          transport: editTransport,
          staff: editStaff,
        },
      },
    });
    setEditingEventId(null);
  };

  const handleExport = async () => {
    // Tải xlsx động — thư viện nặng, chỉ nạp khi người dùng thực sự export.
    const XLSX = await import('xlsx');
    const rows = events.map(event => {
      const expTotal = Object.values(event.financials.expenses).reduce<number>(
        (s, v) => s + (v ?? 0), 0
      );
      const approvedReceipts = event.receipts.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
      const totalExp = expTotal + approvedReceipts;
      const profit = event.financials.income - totalExp;
      const pendingExpenses = event.receipts.filter(r => r.status === 'pending').length;

      return {
        'Sự kiện': event.name,
        'Ngày': event.date,
        'Địa điểm': event.location,
        'Trạng thái': event.status,
        'Doanh thu (€)': event.financials.income,
        'Chi phí (€)': totalExp,
        'Lợi nhuận (€)': profit,
        'Số nhân viên': event.staff.length,
        'Số chi phí chờ duyệt': pendingExpenses,
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Tài chính</h1>
        <Button
          onPress={handleExport}
          variant="primary"
          size="sm"
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          <FileSpreadsheet size={15} />
          Xuất Excel
        </Button>
      </div>

      {/* Month filter */}
      {allMonths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            onPress={() => setSelectedMonth('all')}
            variant={selectedMonth === 'all' ? 'primary' : 'ghost'}
            size="sm"
            className="shrink-0 rounded-full"
          >
            Tất cả
          </Button>
          {allMonths.map(m => (
            <Button
              key={m}
              onPress={() => setSelectedMonth(m)}
              variant={selectedMonth === m ? 'primary' : 'ghost'}
              size="sm"
              className="shrink-0 rounded-full"
            >
              {m}
            </Button>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3">
        <SummaryCard
          icon={<TrendingUp size={20} className="text-green-500" />}
          label="Tổng doanh thu"
          value={totalIncome}
          color="text-green-600 dark:text-green-400"
          bg="bg-green-50 dark:bg-green-500/10"
        />
        <SummaryCard
          icon={<TrendingDown size={20} className="text-red-500" />}
          label="Tổng chi phí"
          value={totalExpense}
          color="text-red-600 dark:text-red-400"
          bg="bg-red-50 dark:bg-red-500/10"
        />
        <SummaryCard
          icon={<DollarSign size={20} className={netProfit >= 0 ? 'text-brand-500' : 'text-orange-500'} />}
          label="Lợi nhuận ròng"
          value={netProfit}
          color={netProfit >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-orange-600 dark:text-orange-400'}
          bg={netProfit >= 0 ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-orange-50 dark:bg-orange-500/10'}
        />
      </div>

      {/* Cost breakdown chart */}
      {totalExpense > 0 && (
        <Card className="rounded-xl p-4">
          <h2 className="text-base font-semibold text-[var(--text-secondary)] mb-3">Phân bổ chi phí (tất cả sự kiện)</h2>
          <div className="space-y-2">
            {breakdownRent > 0 && (
              <BarRow label="Booth/Thuê" value={breakdownRent} maxVal={totalExpense} color="bg-purple-400" showPct totalVal={totalExpense} />
            )}
            {breakdownIngredients > 0 && (
              <BarRow label="Nguyên liệu" value={breakdownIngredients} maxVal={totalExpense} color="bg-orange-400" showPct totalVal={totalExpense} />
            )}
            {breakdownTransport > 0 && (
              <BarRow label="Vận chuyển" value={breakdownTransport} maxVal={totalExpense} color="bg-blue-400" showPct totalVal={totalExpense} />
            )}
            {breakdownStaff > 0 && (
              <BarRow label="Lương NV" value={breakdownStaff} maxVal={totalExpense} color="bg-yellow-400" showPct totalVal={totalExpense} />
            )}
            {breakdownApprovedReceipts > 0 && (
              <BarRow label="Chi phí NV" value={breakdownApprovedReceipts} maxVal={totalExpense} color="bg-pink-400" showPct totalVal={totalExpense} />
            )}
            {breakdownOther > 0 && (
              <BarRow label="Khác" value={breakdownOther} maxVal={totalExpense} color="bg-gray-400" showPct totalVal={totalExpense} />
            )}
          </div>
        </Card>
      )}

      {/* Pending staff expenses */}
      <Card className="rounded-xl p-4">
        <h2 className="text-base font-semibold text-[var(--text-secondary)] mb-3">Chi phí nhân viên chờ duyệt</h2>
        {pendingReceipts.length === 0 ? (
          <p className="text-sm text-green-600">Không có chi phí chờ duyệt ✓</p>
        ) : (
          <div className="space-y-2">
            {pendingReceipts.map(r => (
              <div key={`${r.eventId}-${r.id}`} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--border-color)] last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{r.staffName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{r.type} · {r.amount.toLocaleString('fr-FR')}€ · {r.date}</p>
                  <p className="text-xs text-brand-500">{r.eventName}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    onPress={() => updateExpenseStatus(r.eventId, r.id, 'approved' as ExpenseStatus)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
                  >
                    <Check size={12} /> Duyệt
                  </Button>
                  <Button
                    onPress={() => updateExpenseStatus(r.eventId, r.id, 'rejected' as ExpenseStatus)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-0.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                  >
                    <X size={12} /> Từ chối
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Per-event breakdown */}
      <div>
        <h2 className="text-base font-semibold text-[var(--text-secondary)] mb-3">Theo sự kiện</h2>
        <div className="space-y-3">
          {filteredEvents.map(event => {
            const fixedExp = Object.values(event.financials.expenses).reduce<number>(
              (s, v) => s + (v ?? 0), 0
            );
            const approvedReceiptsForEvent = event.receipts
              .filter(r => r.status === 'approved')
              .reduce((s, r) => s + r.amount, 0);
            const expTotal = fixedExp + approvedReceiptsForEvent;
            const profit = event.financials.income - expTotal;
            const maxVal = Math.max(event.financials.income, expTotal, 1);
            const isEditing = editingEventId === event.id;

            return (
              <Card
                key={event.id}
                className="rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <Button
                    onPress={() => onSelectEvent(event.id)}
                    variant="ghost"
                    className="min-w-0 flex-1 text-left justify-start h-auto p-0"
                  >
                    <p className="font-semibold text-[var(--text-primary)] truncate">{event.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{event.date}</p>
                  </Button>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <StatusBadge status={event.status} />
                    <Button
                      onPress={() => isEditing ? setEditingEventId(null) : startEditing(event)}
                      variant="ghost"
                      isIconOnly
                      size="sm"
                      className="rounded-lg"
                    >
                      <Pencil size={14} />
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Doanh thu (€)</label>
                        <input
                          type="number"
                          value={editIncome}
                          onChange={e => setEditIncome(Number(e.target.value))}
                          className="w-full border border-brand-200 dark:border-[var(--border-color)] rounded-lg px-2 py-1.5 text-sm mt-0.5 bg-[var(--card-bg)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Chi phí - Booth (€)</label>
                        <input
                          type="number"
                          value={editRent}
                          onChange={e => setEditRent(Number(e.target.value))}
                          className="w-full border border-brand-200 dark:border-[var(--border-color)] rounded-lg px-2 py-1.5 text-sm mt-0.5 bg-[var(--card-bg)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Chi phí - Nguyên liệu (€)</label>
                        <input
                          type="number"
                          value={editIngredients}
                          onChange={e => setEditIngredients(Number(e.target.value))}
                          className="w-full border border-brand-200 dark:border-[var(--border-color)] rounded-lg px-2 py-1.5 text-sm mt-0.5 bg-[var(--card-bg)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Chi phí - Vận chuyển (€)</label>
                        <input
                          type="number"
                          value={editTransport}
                          onChange={e => setEditTransport(Number(e.target.value))}
                          className="w-full border border-brand-200 dark:border-[var(--border-color)] rounded-lg px-2 py-1.5 text-sm mt-0.5 bg-[var(--card-bg)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Chi phí - Lương (€)</label>
                        <input
                          type="number"
                          value={editStaff}
                          onChange={e => setEditStaff(Number(e.target.value))}
                          className="w-full border border-brand-200 dark:border-[var(--border-color)] rounded-lg px-2 py-1.5 text-sm mt-0.5 bg-[var(--card-bg)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        onPress={() => saveEditing(event)}
                        variant="primary"
                        fullWidth
                      >
                        Lưu
                      </Button>
                      <Button
                        onPress={() => setEditingEventId(null)}
                        variant="ghost"
                        fullWidth
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <BarRow
                        label="Doanh thu"
                        value={event.financials.income}
                        maxVal={maxVal}
                        color="bg-green-400"
                      />
                      <BarRow
                        label="Chi phí"
                        value={expTotal}
                        maxVal={maxVal}
                        color="bg-red-400"
                      />
                    </div>
                    {approvedReceiptsForEvent > 0 && (
                      <p className="text-xs text-brand-300 mt-1">
                        Bao gồm {approvedReceiptsForEvent.toLocaleString('fr-FR')}€ chi phí nhân viên
                      </p>
                    )}
                    <div className="mt-3 flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-muted)]">Lợi nhuận</span>
                      <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-FR')}€
                      </span>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Sub-components
interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}

function SummaryCard({ icon, label, value, color, bg }: SummaryCardProps) {
  return (
    <Card variant="secondary" className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 flex justify-between items-center">
        <p className="text-sm text-brand-600">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('fr-FR')}€</p>
      </div>
    </Card>
  );
}

interface BarRowProps {
  label: string;
  value: number;
  maxVal: number;
  color: string;
  showPct?: boolean;
  totalVal?: number;
}

function BarRow({ label, value, maxVal, color, showPct, totalVal }: BarRowProps) {
  const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
  const pctOfTotal = totalVal && totalVal > 0 ? Math.round((value / totalVal) * 100) : null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)] w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-[var(--muted)] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--text-secondary)] w-14 text-right shrink-0">
        {value.toLocaleString('fr-FR')}€
      </span>
      {showPct && pctOfTotal !== null && (
        <span className="text-xs text-brand-300 dark:text-brand-400 w-8 text-right shrink-0">{pctOfTotal}%</span>
      )}
    </div>
  );
}
