import type { EventStatus, ExpenseStatus } from '../../types';

interface EventStatusBadgeProps { status: EventStatus }

export default function StatusBadge({ status }: EventStatusBadgeProps) {
  const map: Record<EventStatus, string> = {
    'Lên kế hoạch': 'bg-indigo-50  text-indigo-600 border border-indigo-200',
    'Sắp tới':       'bg-brand-50   text-brand-600  border border-brand-200',
    'Đang diễn ra':  'bg-herb-500/10 text-herb-600  border border-herb-500/30',
    'Đã hoàn thành': 'bg-gray-100    text-gray-500   border border-gray-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

interface ExpenseStatusBadgeProps { status: ExpenseStatus }

export function ExpenseStatusBadge({ status }: ExpenseStatusBadgeProps) {
  const map: Record<ExpenseStatus, string> = {
    pending:  'bg-indigo-50  text-indigo-600 border border-indigo-200',
    approved: 'bg-herb-500/10 text-herb-600  border border-herb-500/30',
    rejected: 'bg-red-50      text-red-500   border border-red-200',
  };
  const label: Record<ExpenseStatus, string> = {
    pending:  'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide ${map[status]}`}>
      {label[status]}
    </span>
  );
}
