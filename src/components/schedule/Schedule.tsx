import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button, ScrollShadow } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import AddEventForm from './AddEventForm';
import { SkeletonList } from '@/components/ui/skeleton';
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

  const myStaffMember = !canViewAll && currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;

  const visibleEvents = canViewAll
    ? events
    : events.filter(e => myStaffMember && e.staff.some(s => s.id === myStaffMember.id));

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
      {isAdmin && (
        <div className="flex justify-end">
          <Button
            onPress={() => setShowAddForm(true)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1 rounded-xl font-semibold"
          >
            <Plus size={16} />
            Thêm sự kiện
          </Button>
        </div>
      )}

      {/* Search input */}
      <Input
        type="text"
        placeholder="Tìm theo tên hoặc địa điểm..."
        value={search}
        onChange={setSearch}
        startContent={<Search size={15} />}
      />

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === s
                ? 'bg-[var(--primary)] text-[var(--background)] border-[var(--primary)]'
                : 'glass-card border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {showAddForm && isAdmin && (
        <AddEventForm onClose={() => setShowAddForm(false)} />
      )}

      {state.loading ? (
        <SkeletonList count={3} variant="card" />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-10">Chưa có sự kiện nào</p>
      ) : (
        <ScrollShadow className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
        </ScrollShadow>
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
    <div className="glass-card rounded-xl overflow-hidden flex items-stretch active:bg-[var(--glass-bg)] transition-all">
      <button
        onClick={onSelect}
        className="flex-1 text-left p-4 min-w-0"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] truncate">{event.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{dateDisplay}</p>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{event.location}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{event.staff.length} nhân viên</p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </button>
      {isAdmin && (
        <button
          onClick={onDelete}
          className="px-3 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 border-l border-[var(--glass-border)] transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
