// =============================================================================
// src/components/shared/StatusBadge.tsx
// =============================================================================

import type { EventStatus, ExpenseStatus } from '../../types';

interface EventStatusBadgeProps {
  status: EventStatus;
}

export default function StatusBadge({ status }: EventStatusBadgeProps) {
  const map: Record<EventStatus, string> = {
    'Lên kế hoạch': 'bg-gray-100 text-gray-600',
    'Sắp tới':       'bg-blue-100 text-blue-700',
    'Đang diễn ra':  'bg-green-100 text-green-700',
    'Đã hoàn thành': 'bg-gray-200 text-gray-500',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${map[status]}`}>
      {status}
    </span>
  );
}

interface ExpenseStatusBadgeProps {
  status: ExpenseStatus;
}

export function ExpenseStatusBadge({ status }: ExpenseStatusBadgeProps) {
  const map: Record<ExpenseStatus, string> = {
    pending:  'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const label: Record<ExpenseStatus, string> = {
    pending:  'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
      {label[status]}
    </span>
  );
}
