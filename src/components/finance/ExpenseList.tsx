import { Check, X } from 'lucide-react';
import { Button } from '@heroui/react';
import type { ExpenseStatus } from '../../types';
import { useUpdateExpenseStatusMutation } from '../../hooks/queries/useMutations';

interface PendingReceipt {
  id: number;
  staffName: string;
  type: string;
  amount: number;
  date: string;
  eventName: string;
  eventId: number;
}

interface ExpenseListProps {
  pendingReceipts: PendingReceipt[];
}

export default function ExpenseList({ pendingReceipts }: ExpenseListProps) {
  const updateExpenseStatusMutation = useUpdateExpenseStatusMutation();

  return (
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
                  onPress={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'approved' as ExpenseStatus })}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-0.5 bg-[var(--success)]/10 hover:bg-[var(--success)]/20 text-[var(--success)] rounded-lg border border-[var(--success)]/20"
                  isDisabled={updateExpenseStatusMutation.isPending}
                >
                  <Check size={12} /> Duyệt
                </Button>
                <Button
                  onPress={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'rejected' as ExpenseStatus })}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-0.5 rounded-lg text-[var(--danger)] bg-[var(--danger-light)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20"
                  isDisabled={updateExpenseStatusMutation.isPending}
                >
                  <X size={12} /> Từ chối
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
