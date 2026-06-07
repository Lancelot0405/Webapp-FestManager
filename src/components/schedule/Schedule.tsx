// =============================================================================
// src/components/schedule/Schedule.tsx
// =============================================================================

import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import AddEventForm from './AddEventForm';
import { computeEventStatus } from '../../lib/eventStatus';
import type { EventStatus, FestivalEvent } from '../../types';

interface ScheduleProps {
  onSelectEvent: (id: number) => void;
}

function parseDate(d: string): number {
  if (!d) return 0;
  const [dd, mm, yyyy] = d.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`).getTime();
}

type StatusFilter = 'Tất cả' | EventStatus;

const STATUS_FILTERS: StatusFilter[] = [
  'Tất cả',
  'Sắp tới',
  'Đang diễn ra',
  'Đã hoàn thành',
  'Lên kế hoạch',
];

export default function Schedule({ onSelectEvent }: ScheduleProps) {
  const { state, deleteEvent } = useApp();
  const { events, currentUser, staff } = state;
  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const [showAddForm,  setShowAddForm]  = useState(false);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Tất cả');

  // Staff chỉ thấy events được phân công; admin/manager thấy tất cả
  const myStaffMember = !canViewAll && currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;

  const visibleEvents = canViewAll
    ? events
    : events.filter(e => myStaffMember && e.staff.some(s => s.id === myStaffMember.id));

  // Compute effective status for each event
  const withComputedStatus = visibleEvents.map(e => ({
    ...e,
    status: computeEventStatus(e.date, e.endDate),
  }));

  const q = search.trim().toLowerCase();
  const filtered = withComputedStatus.filter(e => {
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'Tất cả' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Lịch sự kiện</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus size={16} />
            Thêm sự kiện
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc địa điểm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {showAddForm && isAdmin && (
        <AddEventForm onClose={() => setShowAddForm(false)} />
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Chưa có sự kiện nào</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              onSelect={() => onSelectEvent(event.id)}
              onDelete={() => {
                if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
                  deleteEvent(event.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  isAdmin,
  onSelect,
  onDelete,
}: {
  event: FestivalEvent;
  isAdmin: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const dateDisplay = event.endDate && event.endDate !== event.date
    ? `${event.date} → ${event.endDate}`
    : event.date;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:border-blue-200 transition-colors flex items-stretch">
      <button onClick={onSelect} className="flex-1 text-left p-4 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{event.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dateDisplay}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{event.location}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{event.staff.length} nhân viên</p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </button>
      {isAdmin && (
        <button
          onClick={onDelete}
          className="px-3 text-red-300 hover:text-red-500 hover:bg-red-50 border-l border-gray-100 dark:border-slate-700 transition-colors rounded-r-xl"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
