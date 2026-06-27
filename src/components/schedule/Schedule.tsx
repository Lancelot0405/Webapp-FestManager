import { useState, useMemo, useCallback } from 'react';
import type { SortDescriptor } from 'react-aria-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { animations } from '../../lib/animations';
import { Trash2, Eye, List, CalendarDays } from 'lucide-react';
import {
  Button, Chip, Table, SearchField,
  ToggleButtonGroup, ToggleButton,
  DrawerRoot, DrawerBackdrop, DrawerContent, DrawerDialog,
} from '@heroui/react';
import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date';
import { CalendarWithYearPicker } from '@/components/shared/AppDatePicker';

import { useApp } from '../../context/AppContext';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useFABRegister } from '../../hooks/useFABRegister';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useDeleteEvent } from '../../hooks/queries/mutations/useDeleteEvent';
import StatusBadge from '../shared/StatusBadge';
import EventCalendarView from './EventCalendarView';
import EventDetailContent from './EventDetailContent';
import AddEventForm from './AddEventForm';
import CardSkeleton from '@/components/shared/skeletons/CardSkeleton';
import { computeEventStatus } from '../../lib/eventStatus';
import type { EventStatus, FestivalEvent, StaffRef } from '../../types';

type StatusFilter = 'Tất cả' | EventStatus;
type RangeMode = 'day' | 'week' | 'month';
type ViewMode = 'agenda' | 'calendar';

const STATUS_FILTERS: StatusFilter[] = [
  'Tất cả', 'Sắp tới', 'Đang diễn ra', 'Đã hoàn thành', 'Lên kế hoạch',
];

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

const STATUS_RANK: Record<EventStatus, number> = {
  'Đang diễn ra': 0, 'Sắp tới': 1, 'Lên kế hoạch': 2, 'Đã hoàn thành': 3,
};

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function MiniAvatarGroup({ members }: { members: StaffRef[] }) {
  if (members.length === 0) return <span className="text-xs text-foreground/40">–</span>;
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((m, i) => (
        <motion.div key={m.id} {...animations.listItem(i)} whileHover={{ scale: 1.2, zIndex: 10 }} transition={{ duration: 0.15 }}
          className="w-6 h-6 rounded-full bg-accent/10 ring-2 ring-background flex items-center justify-center">
          <span className="text-[9px] font-bold text-accent">{initials(m.name)}</span>
        </motion.div>
      ))}
      {extra > 0 && (
        <motion.div {...animations.listItem(shown.length)}
          className="w-6 h-6 rounded-full bg-default/80 ring-2 ring-background flex items-center justify-center">
          <span className="text-[9px] font-semibold text-foreground/60">+{extra}</span>
        </motion.div>
      )}
    </div>
  );
}

type EventWithStatus = FestivalEvent & { status: EventStatus };

function AgendaView({
  events,
  onNavigate,
  isAdmin,
  onDelete,
}: {
  events: EventWithStatus[];
  onNavigate: (id: number) => void;
  isAdmin: boolean;
  onDelete: (id: number, name: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, EventWithStatus[]>();
    for (const e of events) {
      const parts = e.date.split('-');
      const key = parts.length === 3 ? `Tháng ${parseInt(parts[1])}/${parts[2]}` : 'Không rõ';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  if (events.length === 0) {
    return <p className="text-sm text-foreground/50 text-center py-10">Chưa có sự kiện nào</p>;
  }

  return (
    <div className="space-y-5">
      {[...grouped.entries()].map(([month, monthEvents]) => (
        <div key={month}>
          <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider px-1 mb-2">{month}</p>
          <div className="space-y-1.5">
            {monthEvents.map((event, i) => {
              const dateDisplay = event.endDate && event.endDate !== event.date
                ? `${event.date} → ${event.endDate}`
                : event.date;
              return (
                <motion.div
                  key={event.id}
                  {...animations.listItem(i)}
                  onClick={() => onNavigate(event.id)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface border border-separator cursor-pointer hover:bg-default-100/60 dark:hover:bg-default-100/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                    <p className="text-xs text-foreground/50 truncate">{dateDisplay} · {event.location}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <MiniAvatarGroup members={event.staff} />
                    <StatusBadge status={event.status} />
                    {isAdmin && (
                      <div onClick={e => e.stopPropagation()}>
                        <Button
                          isIconOnly size="sm" variant="ghost"
                          onPress={() => onDelete(event.id, event.name)}
                          aria-label="Xóa sự kiện"
                          className="w-7 h-7 rounded-lg text-default-400 hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
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

  const isDesktop = useIsDesktop(1024);
  const tz = getLocalTimeZone();
  const [selectedDate,  setSelectedDate]  = useState<CalendarDate>(today(tz));
  const [rangeMode,     setRangeMode]     = useState<RangeMode>('month');
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('Tất cả');
  const [viewMode,      setViewMode]      = useState<ViewMode>('agenda');
  const [search,        setSearch]        = useState('');
  const [drawerEventId, setDrawerEventId] = useState<number | null>(null);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'date', direction: 'ascending',
  });

  const openEvent = useCallback((id: number) => {
    if (isDesktop) setDrawerEventId(id);
    else navigate('/schedule/' + id);
  }, [isDesktop, navigate]);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const openAddForm = useCallback(() => setShowAddForm(true), []);
  useFABRegister(isAdmin ? openAddForm : null, 'Thêm sự kiện');

  const myStaffMember = !canViewAll && currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;

  const visibleEvents = canViewAll
    ? events
    : events.filter(e => myStaffMember && e.staff.some(s => s.id === myStaffMember.id));

  const withStatus = useMemo<EventWithStatus[]>(() => visibleEvents.map(e => ({
    ...e,
    status: computeEventStatus(e.date, e.endDate),
  })), [visibleEvents]);

  const filtered = useMemo(() => {
    const byRange = withStatus.filter(e => {
      if (rangeMode === 'day')   return eventContainsDate(e, selectedDate);
      if (rangeMode === 'week')  return eventInWeek(e, selectedDate);
      return eventInMonth(e, selectedDate);
    });
    const byStatus = byRange.filter(e => statusFilter === 'Tất cả' || e.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(e =>
      e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
  }, [withStatus, selectedDate, rangeMode, statusFilter, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      const ta = ddmmToCalendarDate(a.date);
      const tb = ddmmToCalendarDate(b.date);
      if (!ta || !tb) return 0;
      return cdMs(ta) - cdMs(tb);
    }),
    [filtered],
  );

  const tableSorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDescriptor.direction === 'descending' ? -1 : 1;
    switch (sortDescriptor.column) {
      case 'name':
        return list.sort((a, b) => dir * a.name.localeCompare(b.name, 'vi'));
      case 'status':
        return list.sort((a, b) => dir * (STATUS_RANK[a.status] - STATUS_RANK[b.status]));
      default:
        return list.sort((a, b) => {
          const ta = ddmmToCalendarDate(a.date);
          const tb = ddmmToCalendarDate(b.date);
          if (!ta || !tb) return 0;
          return dir * (cdMs(ta) - cdMs(tb));
        });
    }
  }, [filtered, sortDescriptor]);

  const drawerEvent = drawerEventId != null ? withStatus.find(e => e.id === drawerEventId) ?? null : null;

  const rangeLabel: Record<RangeMode, string> = {
    day:   `${String(selectedDate.day).padStart(2,'0')}-${String(selectedDate.month).padStart(2,'0')}-${selectedDate.year}`,
    week:  'Tuần này',
    month: `Tháng ${selectedDate.month}/${selectedDate.year}`,
  };

  return (
    <div className="pb-32">
      {showAddForm && isAdmin && <AddEventForm onClose={() => setShowAddForm(false)} />}

      {/* Calendar view: full-width layout */}
      {viewMode === 'calendar' && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
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
            <ToggleButtonGroup
              selectionMode="single"
              disallowEmptySelection
              isDetached
              size="sm"
              selectedKeys={new Set([viewMode])}
              onSelectionChange={keys => {
                const k = [...keys][0] as ViewMode;
                if (k) setViewMode(k);
              }}
              className="flex-shrink-0"
            >
              <ToggleButton id="agenda" aria-label="Danh sách" className="w-8 h-8 p-0">
                <List size={14} />
              </ToggleButton>
              <ToggleButton id="calendar" aria-label="Lịch" className="w-8 h-8 p-0">
                <CalendarDays size={14} />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          <EventCalendarView
            events={withStatus.filter(e => statusFilter === 'Tất cả' || e.status === statusFilter)}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            rangeMode={rangeMode}
            onRangeModeChange={setRangeMode}
            onNavigate={openEvent}
          />
        </div>
      )}

      {/* Agenda view: 2-column layout */}
      {viewMode === 'agenda' && <div className="flex flex-col md:flex-row md:gap-6 md:items-start">
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
            <ToggleButton id="month" className="flex-1 text-xs">Tháng</ToggleButton>
            <ToggleButton id="week"  className="flex-1 text-xs">Tuần</ToggleButton>
            <ToggleButton id="day"   className="flex-1 text-xs">Ngày</ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* ── Right panel: View switcher + Status filter + Content ── */}
        <div className="flex-1 min-w-0 mt-4 md:mt-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
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
            <ToggleButtonGroup
              selectionMode="single"
              disallowEmptySelection
              isDetached
              size="sm"
              selectedKeys={new Set([viewMode])}
              onSelectionChange={keys => {
                const k = [...keys][0] as ViewMode;
                if (k) setViewMode(k);
              }}
              className="flex-shrink-0"
            >
              <ToggleButton id="agenda" aria-label="Danh sách" className="w-8 h-8 p-0">
                <List size={14} />
              </ToggleButton>
              <ToggleButton id="calendar" aria-label="Lịch" className="w-8 h-8 p-0">
                <CalendarDays size={14} />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          <SearchField value={search} onChange={setSearch} aria-label="Tìm sự kiện">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Tìm theo tên hoặc địa điểm..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <p className="text-sm font-semibold text-foreground/60">
            {rangeLabel[rangeMode]} · {filtered.length} sự kiện
          </p>

          {isLoading ? (
            <CardSkeleton count={3} />
          ) : !isDesktop ? (
            <AgendaView
              events={sorted}
              onNavigate={openEvent}
              isAdmin={isAdmin}
              onDelete={(id, name) => {
                if (window.confirm(`Xóa sự kiện "${name}"?\nThao tác này không thể hoàn tác.`)) {
                  deleteEventMutation.mutate(id);
                }
              }}
            />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Danh sách sự kiện"
                  sortDescriptor={sortDescriptor}
                  onSortChange={setSortDescriptor}
                >
                  <Table.Header>
                    <Table.Column isRowHeader allowsSorting id="name" className="text-xs font-medium text-default-500 py-3 pl-4 pr-3 bg-default-50 dark:bg-default-100/20">
                      {({ sortDirection }) => (
                        <Table.SortableColumnHeader sortDirection={sortDirection}>Sự kiện</Table.SortableColumnHeader>
                      )}
                    </Table.Column>
                    <Table.Column allowsSorting id="date" className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20 hidden md:table-cell">
                      {({ sortDirection }) => (
                        <Table.SortableColumnHeader sortDirection={sortDirection}>Ngày</Table.SortableColumnHeader>
                      )}
                    </Table.Column>
                    <Table.Column className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20 hidden md:table-cell">Địa điểm</Table.Column>
                    <Table.Column className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20 hidden md:table-cell">Nhân viên</Table.Column>
                    <Table.Column allowsSorting id="status" className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20">
                      {({ sortDirection }) => (
                        <Table.SortableColumnHeader sortDirection={sortDirection}>Trạng thái</Table.SortableColumnHeader>
                      )}
                    </Table.Column>
                    {isAdmin && <Table.Column className="text-xs font-medium text-default-500 py-3 pr-4 pl-3 text-right bg-default-50 dark:bg-default-100/20 hidden sm:table-cell">Hành động</Table.Column>}
                  </Table.Header>
                  <Table.Body renderEmptyState={() => (
                    <p className="text-sm text-foreground/50 text-center py-10">Chưa có sự kiện nào</p>
                  )}>
                    {tableSorted.map(event => {
                      const dateDisplay = event.endDate && event.endDate !== event.date
                        ? `${event.date} → ${event.endDate}`
                        : event.date;
                      return (
                        <Table.Row
                          key={event.id} id={String(event.id)}
                          onAction={() => openEvent(event.id)}
                          className="border-b border-default-100 dark:border-default-200/20 last:border-0 cursor-pointer hover:bg-default-100/50 dark:hover:bg-default-100/5 transition-colors"
                        >
                          <Table.Cell className="py-3.5 pl-4 pr-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                              <p className="text-xs text-default-400 truncate md:hidden">{dateDisplay} · {event.location}</p>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="py-3.5 px-3 hidden md:table-cell">
                            <p className="text-sm text-default-500 whitespace-nowrap">{dateDisplay}</p>
                          </Table.Cell>
                          <Table.Cell className="py-3.5 px-3 hidden md:table-cell">
                            <p className="text-sm text-default-500 truncate">{event.location}</p>
                          </Table.Cell>
                          <Table.Cell className="py-3.5 px-3 hidden md:table-cell">
                            <MiniAvatarGroup members={event.staff} />
                          </Table.Cell>
                          <Table.Cell className="py-3.5 px-3">
                            <StatusBadge status={event.status} />
                          </Table.Cell>
                          {isAdmin && (
                            <Table.Cell className="py-3.5 pr-4 pl-3 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  isIconOnly size="sm" variant="ghost"
                                  onPress={() => openEvent(event.id)}
                                  aria-label="Xem chi tiết"
                                  className="w-8 h-8 rounded-lg text-default-400 hover:text-foreground hover:bg-default-100"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  isIconOnly size="sm" variant="ghost"
                                  onPress={() => {
                                    if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
                                      deleteEventMutation.mutate(event.id);
                                    }
                                  }}
                                  aria-label="Xóa sự kiện"
                                  className="w-8 h-8 rounded-lg text-default-400 hover:text-danger hover:bg-danger/10"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </Table.Cell>
                          )}
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </div>
      </div>}

      {/* Desktop: chi tiết sự kiện trong Drawer phải */}
      <DrawerRoot isOpen={drawerEvent != null} onOpenChange={(open) => { if (!open) setDrawerEventId(null); }}>
        <DrawerBackdrop isDismissable className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm">
          <DrawerContent
            placement="right"
            className="fixed right-0 top-0 bottom-0 z-[201] w-[min(44rem,100vw)] outline-none border-l border-separator bg-background shadow-2xl"
          >
            <DrawerDialog aria-label="Chi tiết sự kiện" className="relative outline-none h-full overflow-y-auto p-4">
              {drawerEvent && (
                <EventDetailContent
                  event={drawerEvent}
                  variant="drawer"
                  onClose={() => setDrawerEventId(null)}
                />
              )}
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </DrawerRoot>
    </div>
  );
}

