import type { EventStatus, ExpenseStatus } from '../../types';

interface EventStatusBadgeProps { status: EventStatus }

export default function StatusBadge({ status }: EventStatusBadgeProps) {
  const map: Record<EventStatus, string> = {
    'Lên kế hoạch': 'bg-saffron-100 text-saffron-600 border border-saffron-300 dark:bg-saffron-500/20 dark:text-saffron-300 dark:border-saffron-500/40',
    'Sắp tới':       'bg-brand-50   text-brand-600  border border-brand-200  dark:bg-brand-900/30  dark:text-brand-300  dark:border-brand-700',
    'Đang diễn ra':  'bg-herb-500/10 text-herb-600  border border-herb-500/30 dark:bg-herb-500/20   dark:text-herb-400   dark:border-herb-500/40',
    'Đã hoàn thành': 'bg-gray-100    text-gray-500   border border-gray-200   dark:bg-gray-700/30   dark:text-gray-400   dark:border-gray-600',
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
    pending:  'bg-saffron-100 text-saffron-600 border border-saffron-300 dark:bg-saffron-500/20 dark:text-saffron-300 dark:border-saffron-500/40',
    approved: 'bg-herb-500/10 text-herb-600   border border-herb-500/30 dark:bg-herb-500/20  dark:text-herb-400  dark:border-herb-500/40',
    rejected: 'bg-red-50      text-red-500     border border-red-200     dark:bg-red-900/20   dark:text-red-400   dark:border-red-800',
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
