// =============================================================================
// src/components/shared/StatusBadge.tsx
// =============================================================================

import type { EventStatus, ExpenseStatus } from '../../types';

interface EventStatusBadgeProps {
  status: EventStatus;
}

export default function StatusBadge({ status }: EventStatusBadgeProps) {
  const map: Record<EventStatus, string> = {
    'Lên kế hoạch': 'bg-amber-50 text-amber-600 border border-amber-200',
    'Sắp tới':       'bg-blue-50 text-blue-600 border border-blue-200',
    'Đang diễn ra':  'bg-emerald-50 text-emerald-600 border border-emerald-200',
    'Đã hoàn thành': 'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${map[status]}`}>
      {status}
    </span>
  );
}

interface ExpenseStatusBadgeProps {
  status: ExpenseStatus;
}

export function ExpenseStatusBadge({ status }: ExpenseStatusBadgeProps) {
  const map: Record<ExpenseStatus, string> = {
    pending:  'bg-yellow-50 text-yellow-600 border border-yellow-200',
    approved: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
  };
  const label: Record<ExpenseStatus, string> = {
    pending:  'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>
      {label[status]}
    </span>
  );
}
