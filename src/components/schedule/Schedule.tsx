import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, Users } from 'lucide-react';
import {
  Button, Card, Chip, ScrollShadow,
  ToggleButtonGroup, ToggleButton,
} from '@heroui/react';
import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date';
import { CalendarWithYearPicker } from '@/components/shared/AppDatePicker';

import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useDeleteEvent } from '../../hooks/queries/mutations/useDeleteEvent';
import StatusBadge from '../shared/StatusBadge';
import AddEventForm from './AddEventForm';
import CardSkeleton from '@/components/shared/skeletons/CardSkeleton';
import { computeEventStatus } from '../../lib/eventStatus';
import type { EventStatus, FestivalEvent, StaffRef } from '../../types';

type StatusFilter = 'Tất cả' | EventStatus;
type RangeMode = 'day' | 'week' | 'month';

const STATUS_FILTERS: StatusFilter[] = [
  'Tất cả', 'Sắp tới', 'Đang diễn ra', 'Đã hoàn thành', 'Lên kế hoạch',
];

const STATUS_BORDER: Record<EventStatus, string> = {
  'Lên kế hoạch': 'border-l-blue-400',
  'Sắp tới':       'border-l-amber-400',
  'Đang diễn ra':  'border-l-green-500',
  'Đã hoàn thành': 'border-l-default-300',
};

function ddmmToCalendarDate(d: string): CalendarDate | null {
  if (!d) return null;
  const parts = d.split('-');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  return new CalendarDate(parseInt(yyyy), parseInt(mm), parseInt(dd));
}

function cdMs(cd: CalendarDate): number {
  return new Date(cd.year, cd.month - 1, cd.day).getTime();
}

function eventContainsDate(event: FestivalEvent, sel: CalendarDate): boolean {
  const s = ddmmToCalendarDate(event.date);
  const e = event.endDate ? ddmmToCalendarDate(event.endDate) : s;
  if (!s) return false;
  const t = cdMs(sel);
  return t >= cdMs(s) && t <= cdMs(e ?? s);
}

function eventInWeek(event: FestivalEvent, anchor: CalendarDate): boolean {
  const s = ddmmToCalendarDate(event.date);
  const e = event.endDate ? ddmmToCalendarDate(event.endDate) : s;
  if (!s) return false;
  const anchorDate = anchor.toDate(getLocalTimeZone());
  const weekStart = anchorDate.getTime() - anchorDate.getDay() * 86400000;
  const weekEnd   = weekStart + 7 * 86400000 - 1;
  return cdMs(s) <= weekEnd && cdMs(e ?? s) >= weekStart;
}

function eventInMonth(event: FestivalEvent, anchor: CalendarDate): boolean {
  const s = ddmmToCalendarDate(event.date);
  const e = event.endDate ? ddmmToCalendarDate(event.endDate) : s;
  if (!s) return false;
  const monthStart = new Date(anchor.year, anchor.month - 1, 1).getTime();
  const monthEnd   = new Date(anchor.year, anchor.month, 0, 23, 59, 59).getTime();
  return cdMs(s) <= monthEnd && cdMs(e ?? s) >= monthStart;
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function MiniAvatarGroup({ members }: { members: StaffRef[] }) {
  if (members.length === 0) return <span className="text-xs text-foreground/40">–</span>;
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map(m => (
        <div key={m.id} className="w-6 h-6 rounded-full bg-accent/10 ring-2 ring-background flex items-center justify-center">
          <span className="text-[9px] font-bold text-accent">{initials(m.name)}</span>
        </div>
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-default/80 ring-2 ring-background flex items-center justify-center">
          <span className="text-[9px] font-semibold text-foreground/60">+{extra}</span>
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const navigate = useNavigate();
  const { currentUser }                   = useApp();
  const { data: events = [], isLoading }  = useEventsQuery();
  const { data: staff = [] }              = useStaffQuery();
  const deleteEventMutation               = useDeleteEvent();

  const isAdmin    = currentUser?.role === 'admin';
  const isManager  = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const tz = getLocalTimeZone();
  const [selectedDate,  setSelectedDate]  = useState<CalendarDate>(today(tz));
  const [rangeMode,     setRangeMode]     = useState<RangeMode>('day');
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('Tất cả');
  const [showAddForm,   setShowAddForm]   = useState(false);

  const myStaffMember = !canViewAll && currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;

  const visibleEvents = canViewAll
    ? events
    : events.filter(e => myStaffMember && e.staff.some(s => s.id === myStaffMember.id));

  const withStatus = useMemo(() => visibleEvents.map(e => ({
    ...e,
    status: computeEventStatus(e.date, e.endDate),
  })), [visibleEvents]);

  const filtered = useMemo(() => {
    const byRange = withStatus.filter(e => {
      if (rangeMode === 'day')   return eventContainsDate(e, selectedDate);
      if (rangeMode === 'week')  return eventInWeek(e, selectedDate);
      return eventInMonth(e, selectedDate);
    });
    return byRange.filter(e => statusFilter === 'Tất cả' || e.status === statusFilter);
  }, [withStatus, selectedDate, rangeMode, statusFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      const ta = ddmmToCalendarDate(a.date);
      const tb = ddmmToCalendarDate(b.date);
      if (!ta || !tb) return 0;
      return cdMs(ta) - cdMs(tb);
    }),
    [filtered],
  );

  const rangeLabel: Record<RangeMode, string> = {
    day:   `${String(selectedDate.day).padStart(2,'0')}-${String(selectedDate.month).padStart(2,'0')}-${selectedDate.year}`,
    week:  'Tuần này',
    month: `Tháng ${selectedDate.month}/${selectedDate.year}`,
  };

  return (
    <div className="pb-24">
      {isAdmin && (
        <Button
          onPress={() => setShowAddForm(true)}
          isIconOnly
          aria-label="Thêm sự kiện"
          className="fixed bottom-24 right-4 md:bottom-8 z-30 h-14 w-14 rounded-full bg-accent text-white dark:text-foreground shadow-xl active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </Button>
      )}

      {showAddForm && isAdmin && <AddEventForm onClose={() => setShowAddForm(false)} />}

      <div className="flex flex-col md:flex-row md:gap-6 md:items-start">
        {/* ── Left panel: Calendar + Range toggle ── */}
        <div className="flex flex-col items-center gap-3 md:sticky md:top-4 md:flex-shrink-0">
          <CalendarWithYearPicker
            value={selectedDate}
            onChange={setSelectedDate}
          />

          <ToggleButtonGroup
            selectionMode="single"
            disallowEmptySelection
            isDetached
            size="sm"
            selectedKeys={new Set([rangeMode])}
            onSelectionChange={keys => {
              const k = [...keys][0] as RangeMode;
              if (k) setRangeMode(k);
            }}
            className="w-full"
          >
            <ToggleButton id="day"   className="flex-1 text-xs">Ngày</ToggleButton>
            <ToggleButton id="week"  className="flex-1 text-xs">Tuần</ToggleButton>
            <ToggleButton id="month" className="flex-1 text-xs">Tháng</ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* ── Right panel: Status filter + Events list ── */}
        <div className="flex-1 min-w-0 mt-4 md:mt-0 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(s => (
              <Chip
                key={s}
                variant="soft"
                color={statusFilter === s ? 'accent' : 'default'}
                className={`cursor-pointer select-none transition-opacity ${statusFilter !== s ? 'opacity-60' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Chip>
            ))}
          </div>

          <p className="text-sm font-semibold text-foreground/60">
            {rangeLabel[rangeMode]} · {sorted.length} sự kiện
          </p>

          {isLoading ? (
            <CardSkeleton count={3} />
          ) : sorted.length === 0 ? (
            <p className="text-sm text-foreground/50 text-center py-10">Chưa có sự kiện nào</p>
          ) : (
            <ScrollShadow className="space-y-2">
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
      </div>
    </div>
  );
}

function EventCard({ event, isAdmin, onSelect, onDelete }: {
  event: FestivalEvent & { status: EventStatus };
  isAdmin: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const dateDisplay = event.endDate && event.endDate !== event.date
    ? `${event.date} → ${event.endDate}`
    : event.date;

  const startXRef = useRef(0);
  const [revealed, setRevealed] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = startXRef.current - e.changedTouches[0].clientX;
    if (dx > 60)  setRevealed(true);
    if (dx < -30) setRevealed(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe-to-delete reveal layer (mobile only) */}
      {isAdmin && (
        <div className="md:hidden absolute inset-y-0 right-0 flex items-center bg-danger px-5 rounded-r-xl z-0">
          <Button
            isIconOnly variant="ghost" size="sm"
            onPress={() => { setRevealed(false); onDelete(); }}
            aria-label="Xóa sự kiện"
            className="text-white hover:bg-white/20"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )}

      {/* Card sliding layer */}
      <div
        style={{ transform: revealed ? 'translateX(-72px)' : 'translateX(0)', transition: 'transform 0.22s ease' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={revealed ? () => setRevealed(false) : undefined}
      >
        <Card className={`border-l-4 ${STATUS_BORDER[event.status]} shadow-sm hover:shadow-md hover:bg-default/30 dark:hover:bg-white/5 transition-all duration-150 rounded-xl`}>
          <Card.Content className="p-0">
            <div className="flex items-stretch">
              <Button
                variant="ghost"
                onPress={!revealed ? onSelect : undefined}
                className="flex-1 h-auto min-w-0 justify-start rounded-none rounded-r-none p-3 text-left hover:bg-transparent"
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{event.name}</p>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-foreground/60">
                    <MapPin size={11} className="flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <p className="text-xs text-foreground/50">{dateDisplay}</p>
                  <div className="flex items-center gap-2">
                    <Users size={11} className="text-foreground/40 flex-shrink-0" />
                    <MiniAvatarGroup members={event.staff} />
                    {event.staff.length > 0 && (
                      <span className="text-xs text-foreground/50">{event.staff.length} nhân viên</span>
                    )}
                  </div>
                </div>
              </Button>

              {/* Desktop: always-visible delete button */}
              {isAdmin && (
                <Button
                  isIconOnly variant="ghost"
                  onPress={onDelete}
                  aria-label="Xóa sự kiện"
                  className="hidden md:flex h-auto rounded-none rounded-r-xl px-3 text-foreground/40 hover:text-danger hover:bg-danger/10 border-l border-separator transition-colors"
                >
                  <Trash2 size={15} />
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
