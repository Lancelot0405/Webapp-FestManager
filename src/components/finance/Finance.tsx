import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileSpreadsheet } from 'lucide-react';
import { Button } from '@heroui/react';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import SummaryCard from './SummaryCard';
import BarRow from './BarRow';
import ExpenseList from './ExpenseList';
import EventFinanceCard from './EventFinanceCard';

export default function Finance() {
  const { data: events = [] } = useEventsQuery();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

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
      <ExpenseList pendingReceipts={pendingReceipts} />

      {/* Per-event breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Theo sự kiện</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map(event => (
            <EventFinanceCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

