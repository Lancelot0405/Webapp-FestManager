// =============================================================================
// src/components/schedule/tabs/EventInfoTab.tsx
// =============================================================================

import type { FestivalEvent } from '../../../types';
import StatusBadge from '../../shared/StatusBadge';

interface Props {
  event: FestivalEvent;
}

export default function EventInfoTab({ event }: Props) {
  const totalExpense = Object.values(event.financials.expenses).reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const profit = event.financials.income - totalExpense;

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <div className="bg-white dark:bg-espresso-700 rounded-xl p-4 shadow-card space-y-3">
        <Row label="Tên sự kiện" value={event.name} />
        <Row label="Ngày bắt đầu" value={event.date} />
        {event.endDate && <Row label="Ngày kết thúc" value={event.endDate} />}
        <Row label="Địa điểm" value={event.location} />
        <div className="flex justify-between items-center">
          <span className="text-sm text-brand-400 dark:text-brand-400">Trạng thái</span>
          <StatusBadge status={event.status} />
        </div>
        {event.extra.booth && <Row label="Quầy hàng" value={event.extra.booth} />}
        {event.extra.hygienePermit && <Row label="Giấy phép VS" value={event.extra.hygienePermit} />}
        {event.extra.organizerContact && <Row label="Liên hệ BTC" value={event.extra.organizerContact} />}
      </div>

      {/* Financials */}
      <div className="bg-white dark:bg-espresso-700 rounded-xl p-4 shadow-card">
        <h2 className="font-semibold text-brand-600 dark:text-gray-200 mb-3">Tài chính</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-brand-400 dark:text-brand-400">Doanh thu</span>
            <span className="font-semibold text-herb-600">{event.financials.income.toLocaleString('fr-FR')}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-400 dark:text-brand-400">Chi phí</span>
            <span className="font-semibold text-red-500">{totalExpense.toLocaleString('fr-FR')}€</span>
          </div>
          <div className="border-t border-brand-200 dark:border-espresso-700 pt-2 flex justify-between text-sm font-bold">
            <span className="text-brand-600 dark:text-gray-200">Lợi nhuận</span>
            <span className={profit >= 0 ? 'text-herb-600' : 'text-red-600'}>
              {profit.toLocaleString('fr-FR')}€
            </span>
          </div>
        </div>

        {/* Expense breakdown */}
        {Object.entries(event.financials.expenses ?? {}).length > 0 && (
          <div className="mt-3 pt-3 border-t border-brand-200 dark:border-espresso-700 space-y-1">
            <p className="text-xs font-semibold text-brand-400 dark:text-brand-400 uppercase tracking-wide mb-2">Chi tiết chi phí</p>
            {Object.entries(event.financials.expenses ?? {}).map(([key, val]) => (
              <div key={key} className="flex justify-between text-xs text-brand-400 dark:text-brand-400">
                <span>{key}</span>
                <span>{(val ?? 0).toLocaleString('fr-FR')}€</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-sm text-brand-400 dark:text-brand-400 shrink-0">{label}</span>
      <span className="text-sm text-espresso-800 dark:text-gray-100 text-right">{value}</span>
    </div>
  );
}
