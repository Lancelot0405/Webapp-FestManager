import { Chip } from '@heroui/react';
import type { EventStatus, ExpenseStatus } from '../../types';

interface EventStatusBadgeProps { status: EventStatus }

const EVENT_COLOR: Record<EventStatus, 'default' | 'accent' | 'success' | 'warning'> = {
  'Lên kế hoạch': 'warning',
  'Sắp tới':       'accent',
  'Đang diễn ra':  'success',
  'Đã hoàn thành': 'default',
};

export default function StatusBadge({ status }: EventStatusBadgeProps) {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={EVENT_COLOR[status]}
      className="text-[10px] font-bold tracking-wide shrink-0 whitespace-nowrap"
    >
      {status}
    </Chip>
  );
}

interface ExpenseStatusBadgeProps { status: ExpenseStatus }

const EXPENSE_COLOR: Record<ExpenseStatus, 'default' | 'accent' | 'success' | 'danger'> = {
  pending:  'accent',
  approved: 'success',
  rejected: 'danger',
};

const EXPENSE_LABEL: Record<ExpenseStatus, string> = {
  pending:  'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export function ExpenseStatusBadge({ status }: ExpenseStatusBadgeProps) {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={EXPENSE_COLOR[status]}
      className="text-[10px] font-bold tracking-wide"
    >
      {EXPENSE_LABEL[status]}
    </Chip>
  );
}
