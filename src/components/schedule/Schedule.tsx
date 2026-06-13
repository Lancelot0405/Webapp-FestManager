import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button, ScrollShadow } from '@heroui/react';
import { Input } from '@/components/shared/GlassInput';

import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useDeleteEvent } from '../../hooks/queries/mutations/useDeleteEvent';
import StatusBadge from '../shared/StatusBadge';
import AddEventForm from './AddEventForm';
import CardSkeleton from '@/components/shared/skeletons/CardSkeleton';
import { computeEventStatus } from '../../lib/eventStatus';
import type { EventStatus, FestivalEvent } from '../../types';

function parseDate(d: string): number {
  if (!d) return 0;
  const [dd, mm, yyyy] = d.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`).getTime();
}

type StatusFilter = 'Tất cả' | EventStatus;

const STATUS_FILTERS: StatusFilter[] = [
  'Tất cả', 'Sắp tới', 'Đang diễn ra', 'Đã hoàn thành', 'Lên kế hoạch',
];

export default function Schedule() {
  const navigate = useNavigate();
  const { currentUser }                   = useApp();
  const { data: events = [], isLoading }  = useEventsQuery();
  const { data: staff = [] }              = useStaffQuery();
  const deleteEventMutation               = useDeleteEvent();

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
        <>
          <div className="hidden md:flex justify-end">
            <Button onPress={() => setShowAddForm(true)} variant="primary" size="sm" className="flex items-center gap-1 rounded-xl font-semibold">
              <Plus size={16} />
              Thêm sự kiện
            </Button>
          </div>
          <Button onPress={() => setShowAddForm(true)} isIconOnly aria-label="Thêm sự kiện" className="md:hidden fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-accent text-white dark:text-foreground shadow-xl active:scale-95 transition-transform">
          <Plus size={24} />
        </Button>
        </>
      )}

      <Input type="text" placeholder="Tìm theo tên hoặc địa điểm..." value={search} onChange={setSearch} startContent={<Search size={15} />} />

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(s => (
          <Button key={s} variant="ghost" onPress={() => setStatusFilter(s)}
            className={`h-auto min-w-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusFilter === s ? 'bg-accent text-white dark:text-foreground border-accent' : 'bg-surface border border-separator rounded-xl border-separator text-foreground/80 hover:text-foreground'}`}>
            {s}
          </Button>
        ))}
      </div>

      {showAddForm && isAdmin && <AddEventForm onClose={() => setShowAddForm(false)} />}

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">Chưa có sự kiện nào</p>
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

function EventCard({ event, isAdmin, onSelect, onDelete }: {
  event: FestivalEvent; isAdmin: boolean; onSelect: () => void; onDelete: () => void;
}) {
  const dateDisplay = event.endDate && event.endDate !== event.date
    ? `${event.date} → ${event.endDate}` : event.date;
  return (
    <div className="group bg-surface border border-separator rounded-xl shadow-sm overflow-hidden flex items-stretch hover:shadow-lg active:scale-[0.99] transition-all duration-150">
      <Button variant="ghost" onPress={onSelect} className="flex-1 h-auto min-w-0 justify-start rounded-none p-4 text-left hover:bg-default/50">
        <div className="flex w-full justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{event.name}</p>
            <p className="text-xs text-muted mt-0.5">{dateDisplay}</p>
            <p className="text-xs text-muted truncate mt-0.5">{event.location}</p>
            <p className="text-xs text-muted mt-1">{event.staff.length} nhân viên</p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </Button>
      {isAdmin && (
        <Button isIconOnly variant="ghost" onPress={onDelete} aria-label="Xóa sự kiện"
          className="h-auto rounded-none px-3 text-muted hover:text-danger hover:bg-danger/10 border-l border-separator transition-colors">
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}
