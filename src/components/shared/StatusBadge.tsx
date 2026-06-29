import { Badge } from '@/components/ui/badge';
import type { EventStatus, ExpenseStatus } from '../../types';

interface EventStatusBadgeProps { status: EventStatus }

const EVENT_CLASS: Record<EventStatus, string> = {
  'Lên kế hoạch': 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
  'Sắp tới':       'bg-primary/10 text-primary border-primary/20',
  'Đang diễn ra':  'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
  'Đã hoàn thành': 'bg-muted text-muted-foreground border-border',
};

export default function StatusBadge({ status }: EventStatusBadgeProps) {
  return (
    <Badge
      className={`${EVENT_CLASS[status]} text-[10px] font-bold tracking-wide shrink-0 whitespace-nowrap px-2 py-0.5 border rounded-full`}
    >
      {status}
    </Badge>
  );
}

interface ExpenseStatusBadgeProps { status: ExpenseStatus }

const EXPENSE_CLASS: Record<ExpenseStatus, string> = {
  pending:  'bg-primary/10 text-primary border-primary/20',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const EXPENSE_LABEL: Record<ExpenseStatus, string> = {
  pending:  'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export function ExpenseStatusBadge({ status }: ExpenseStatusBadgeProps) {
  return (
    <Badge
      className={`${EXPENSE_CLASS[status]} text-[10px] font-bold tracking-wide px-2 py-0.5 border rounded-full`}
    >
      {EXPENSE_LABEL[status]}
    </Badge>
  );
}

