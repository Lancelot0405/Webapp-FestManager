import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button, ScrollShadow } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import AddEventForm from './AddEventForm';
import CardSkeleton from '../shared/skeletons/CardSkeleton';
import { computeEventStatus } from '../../lib/eventStatus';
import type { EventStatus, FestivalEvent } from '../../types';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useDeleteEventMutation } from '../../hooks/queries/useMutations';

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

export default function Schedule() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventsQuery();
  const deleteEventMutation = useDeleteEventMutation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Tất cả');
  const [showAddForm, setShowAddForm] = useState(false);

  const isAdmin = state.currentUser?.role === 'admin';

  const processed = events.map(e => ({
    ...e,
    status: computeEventStatus(e.date, e.endDate),
  }));

  const filtered = processed.filter(e => {
    const term = search.toLowerCase();
    const nameMatch = e.name.toLowerCase().includes(term);
    const locMatch  = e.location.toLowerCase().includes(term);
    if (!nameMatch && !locMatch) return false;

    if (statusFilter !== 'Tất cả' && e.status !== statusFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  return (
    <div className="space-y-4 pb-20">
      {/* Page header */}
      {isAdmin && (
        <>
          <div className="hidden md:flex justify-end">
            <Button
              onPress={() => setShowAddForm(true)}
              variant="primary"
              className="flex items-center gap-1 rounded-xl font-semibold"
            >
              <Plus size={16} />
              Thêm sự kiện
            </Button>
          </div>
          <Button
            onPress={() => setShowAddForm(true)}
            isIconOnly
            aria-label="Thêm sự kiện"
            className="md:hidden fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-[var(--primary)] text-[var(--background)] shadow-[var(--shadow-hero)] active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </Button>
        </>
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
          <Button
            key={s}
            variant="ghost"
            onPress={() => setStatusFilter(s)}
            className={`h-auto min-w-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === s
                ? 'bg-[var(--primary)] text-[var(--background)] border-[var(--primary)]'
                : 'glass-card border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {s}
          </Button>
        ))}
      </div>

      {showAddForm && isAdmin && (
        <AddEventForm onClose={() => setShowAddForm(false)} />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-10">Chưa có sự kiện nào</p>
      ) : (
        <ScrollShadow className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              onSelect={() => navigate('/schedule/' + event.id)}
              onDelete={() => {
                if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
                  deleteEventMutation.mutate(event.id);
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
      <Button
        variant="ghost"
        onPress={onSelect}
        className="flex-1 h-auto min-w-0 justify-start rounded-none p-4 text-left"
      >
        <div className="flex w-full justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] truncate">{event.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{dateDisplay}</p>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{event.location}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{event.staff.length} nhân viên</p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </Button>
      {isAdmin && (
        <Button
          isIconOnly
          variant="ghost"
          onPress={onDelete}
          aria-label="Xóa sự kiện"
          className="h-auto rounded-none px-3 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 border-l border-[var(--glass-border)] transition-colors"
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}
