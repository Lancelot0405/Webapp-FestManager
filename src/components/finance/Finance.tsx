// =============================================================================
// src/components/finance/Finance.tsx  (admin only)
// =============================================================================

import { TrendingUp, TrendingDown, DollarSign, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { computeFinancialSummary } from '../../data/mockData';
import StatusBadge from '../shared/StatusBadge';

interface FinanceProps {
  onSelectEvent: (id: number) => void;
}

export default function Finance({ onSelectEvent }: FinanceProps) {
  const { state } = useApp();
  const { events } = state;
  const { totalIncome, totalExpense, netProfit } = computeFinancialSummary(events);

  const handleExport = () => {
    const rows = events.map(event => {
      const expTotal = Object.values(event.financials.expenses).reduce<number>(
        (s, v) => s + (v ?? 0), 0
      );
      const profit = event.financials.income - expTotal;
      const pendingExpenses = event.receipts.filter(r => r.status === 'pending').length;

      return {
        'Sự kiện': event.name,
        'Ngày': event.date,
        'Địa điểm': event.location,
        'Trạng thái': event.status,
        'Doanh thu (€)': event.financials.income,
        'Chi phí (€)': expTotal,
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Tài chính</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
        >
          <FileSpreadsheet size={15} />
          Xuất Excel
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3">
        <SummaryCard
          icon={<TrendingUp size={20} className="text-green-500" />}
          label="Tổng doanh thu"
          value={totalIncome}
          color="text-green-600"
          bg="bg-green-50"
        />
        <SummaryCard
          icon={<TrendingDown size={20} className="text-red-500" />}
          label="Tổng chi phí"
          value={totalExpense}
          color="text-red-600"
          bg="bg-red-50"
        />
        <SummaryCard
          icon={<DollarSign size={20} className={netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'} />}
          label="Lợi nhuận ròng"
          value={netProfit}
          color={netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}
          bg={netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}
        />
      </div>

      {/* Per-event breakdown */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Theo sự kiện</h2>
        <div className="space-y-3">
          {events.map(event => {
            const expTotal = Object.values(event.financials.expenses).reduce<number>(
              (s, v) => s + (v ?? 0), 0
            );
            const profit = event.financials.income - expTotal;
            const maxVal = Math.max(event.financials.income, expTotal, 1);

            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{event.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.date}</p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>

                {/* Bar comparison */}
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

                <div className="mt-3 flex justify-between text-xs font-semibold">
                  <span className="text-gray-500">Lợi nhuận</span>
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-FR')}€
                  </span>
                </div>
              </button>
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
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 flex justify-between items-center">
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('fr-FR')}€</p>
      </div>
    </div>
  );
}

interface BarRowProps {
  label: string;
  value: number;
  maxVal: number;
  color: string;
}

function BarRow({ label, value, maxVal, color }: BarRowProps) {
  const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-14 text-right shrink-0">
        {value.toLocaleString('fr-FR')}€
      </span>
    </div>
  );
}
