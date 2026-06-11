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
      <div className="glass-card rounded-xl p-4 space-y-3">
        <Row label="Tên sự kiện" value={event.name} />
        <Row label="Ngày bắt đầu" value={event.date} />
        {event.endDate && <Row label="Ngày kết thúc" value={event.endDate} />}
        <Row label="Địa điểm" value={event.location} />
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-muted)]">Trạng thái</span>
          <StatusBadge status={event.status} />
        </div>
        {event.extra.booth && <Row label="Quầy hàng" value={event.extra.booth} />}
        {event.extra.hygienePermit && <Row label="Giấy phép VS" value={event.extra.hygienePermit} />}
        {event.extra.organizerContact && <Row label="Liên hệ BTC" value={event.extra.organizerContact} />}
      </div>

      {/* Financials */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="font-semibold text-[var(--text-primary)] mb-3">Tài chính</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Doanh thu</span>
            <span className="font-semibold text-[var(--success)]">{event.financials.income.toLocaleString('fr-FR')}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Chi phí</span>
            <span className="font-semibold text-[var(--danger)]">{totalExpense.toLocaleString('fr-FR')}€</span>
          </div>
          <div className="border-t border-[var(--glass-border)] pt-2 flex justify-between text-sm font-bold">
            <span className="text-[var(--text-primary)]">Lợi nhuận</span>
            <span className={profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
              {profit.toLocaleString('fr-FR')}€
            </span>
          </div>
        </div>

        {/* Expense breakdown */}
        {Object.entries(event.financials.expenses ?? {}).length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--glass-border)] space-y-1">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Chi tiết chi phí</p>
            {Object.entries(event.financials.expenses ?? {}).map(([key, val]) => (
              <div key={key} className="flex justify-between text-xs text-[var(--text-muted)]">
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
      <span className="text-sm text-[var(--text-muted)] shrink-0">{label}</span>
      <span className="text-sm text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );
}
