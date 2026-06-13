import { Check, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { useUpdateExpenseStatus } from '../../hooks/queries/mutations/useUpdateExpenseStatus';
import type { FestivalEvent } from '../../types';

interface Props {
  filteredEvents: FestivalEvent[];
}

export default function ExpenseList({ filteredEvents }: Props) {
  const updateExpenseStatusMutation = useUpdateExpenseStatus();

  const pendingReceipts = filteredEvents.flatMap(e =>
    e.receipts
      .filter(r => r.status === 'pending')
      .map(r => ({ ...r, eventName: e.name, eventId: e.id }))
  );

  return (
    <div className="glass-card rounded-xl p-4">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Chi phí nhân viên chờ duyệt</h2>
      {pendingReceipts.length === 0 ? (
        <p className="text-sm text-[var(--success)]">Không có chi phí chờ duyệt ✓</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="text-left py-2 px-1 text-xs font-semibold text-[var(--text-muted)]">Nhân viên</th>
                <th className="text-left py-2 px-1 text-xs font-semibold text-[var(--text-muted)]">Loại</th>
                <th className="text-right py-2 px-1 text-xs font-semibold text-[var(--text-muted)]">Số tiền</th>
                <th className="hidden md:table-cell text-left py-2 px-1 text-xs font-semibold text-[var(--text-muted)]">Ngày</th>
                <th className="hidden lg:table-cell text-left py-2 px-1 text-xs font-semibold text-[var(--text-muted)]">Sự kiện</th>
                <th className="text-right py-2 px-1 text-xs font-semibold text-[var(--text-muted)]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingReceipts.map(r => (
                <tr key={`${r.eventId}-${r.id}`} className="border-b border-[var(--glass-border)] last:border-0">
                  <td className="py-2.5 px-1">
                    <p className="font-medium text-[var(--text-primary)] truncate max-w-[120px]">{r.staffName}</p>
                  </td>
                  <td className="py-2.5 px-1 text-[var(--text-secondary)]">{r.type}</td>
                  <td className="py-2.5 px-1 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {r.amount.toLocaleString('fr-FR')}€
                  </td>
                  <td className="hidden md:table-cell py-2.5 px-1 text-[var(--text-muted)] whitespace-nowrap">{r.date}</td>
                  <td className="hidden lg:table-cell py-2.5 px-1 text-[var(--primary)]/70 truncate max-w-[160px]">{r.eventName}</td>
                  <td className="py-2.5 px-1">
                    <div className="flex gap-1.5 justify-end">
                      <Button
                        onPress={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'approved' })}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-0.5 bg-[var(--success)]/10 hover:bg-[var(--success)]/20 text-[var(--success)] rounded-lg border border-[var(--success)]/20"
                      >
                        <Check size={12} /> Duyệt
                      </Button>
                      <Button
                        onPress={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'rejected' })}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-0.5 rounded-lg text-[var(--danger)] bg-[var(--danger-light)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20"
                      >
                        <X size={12} /> Từ chối
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
