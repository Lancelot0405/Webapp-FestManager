import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { animations } from '../../lib/animations';
import { Trash2, Eye, List, CalendarDays, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date';
import { CalendarWithYearPicker } from '@/components/shared/AppDatePicker';
import EmptyState from '@/components/shared/EmptyState';

import { useApp } from '../../context/AppContext';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useFABRegister } from '../../hooks/useFABRegister';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useDeleteEvent } from '../../hooks/queries/mutations/useDeleteEvent';
import StatusBadge from '../shared/StatusBadge';
import MiniAvatarGroup from './MiniAvatarGroup';
import EventCalendarView from './EventCalendarView';
import EventDetailContent from './EventDetailContent';
import AddEventForm from './AddEventForm';
import CardSkeleton from '@/components/shared/skeletons/CardSkeleton';
import { computeEventStatus } from '../../lib/eventStatus';
import type { EventStatus, FestivalEvent } from '../../types';

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

type EventWithStatus = FestivalEvent & { status: EventStatus };

interface SortDescriptor {
  column: 'name' | 'date' | 'status';
  direction: 'ascending' | 'descending';
}

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
    return <EmptyState icon={<CalendarDays size={26} />} title="Chưa có sự kiện nào" description="Tạo sự kiện đầu tiên để bắt đầu quản lý." />;
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
                  className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface border border-border cursor-pointer hover:bg-default-100/60 dark:hover:bg-default-100/5 transition-colors"
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
                          type="button"
                          variant="ghost"
                          onClick={() => onDelete(event.id, event.name)}
                          aria-label="Xóa sự kiện"
                          className="w-7 h-7 rounded-lg text-default-400 hover:text-danger hover:bg-danger/10 p-0 flex items-center justify-center"
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

  const handleSort = (column: SortDescriptor['column']) => {
    setSortDescriptor(prev => {
      const isAsc = prev.column === column && prev.direction === 'ascending';
      return {
        column,
        direction: isAsc ? 'descending' : 'ascending',
      };
    });
  };

  const renderSortArrow = (column: SortDescriptor['column']) => {
    if (sortDescriptor.column !== column) return null;
    return sortDescriptor.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <div className="pb-32">
      {showAddForm && isAdmin && <AddEventForm onClose={() => setShowAddForm(false)} />}

      {/* Calendar view: full-width layout */}
      {viewMode === 'calendar' && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(s => {
                const isActive = statusFilter === s;
                return (
                  <Badge
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`cursor-pointer select-none px-2.5 py-0.5 rounded-full border-none font-semibold text-xs transition-all hover:bg-opacity-95 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground opacity-60 hover:opacity-100'
                    }`}
                  >
                    {s}
                  </Badge>
                );
              })}
            </div>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={val => { if (val) setViewMode(val as ViewMode); }}
              className="bg-muted/40 p-1 rounded-xl border flex shrink-0"
            >
              <ToggleGroupItem value="agenda" aria-label="Danh sách" className="w-8 h-8 p-0 rounded-lg">
                <List size={14} />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Lịch" className="w-8 h-8 p-0 rounded-lg">
                <CalendarDays size={14} />
              </ToggleGroupItem>
            </ToggleGroup>
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

          <ToggleGroup
            type="single"
            value={rangeMode}
            onValueChange={val => { if (val) setRangeMode(val as RangeMode); }}
            className="w-full bg-muted/40 p-1 rounded-xl border flex"
          >
            <ToggleGroupItem value="month" className="flex-1 text-xs h-8 rounded-lg font-semibold">Tháng</ToggleGroupItem>
            <ToggleGroupItem value="week"  className="flex-1 text-xs h-8 rounded-lg font-semibold">Tuần</ToggleGroupItem>
            <ToggleGroupItem value="day"   className="flex-1 text-xs h-8 rounded-lg font-semibold">Ngày</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* ── Right panel: View switcher + Status filter + Content ── */}
        <div className="flex-1 min-w-0 mt-4 md:mt-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(s => {
                const isActive = statusFilter === s;
                return (
                  <Badge
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`cursor-pointer select-none px-2.5 py-0.5 rounded-full border-none font-semibold text-xs transition-all hover:bg-opacity-95 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground opacity-60 hover:opacity-100'
                    }`}
                  >
                    {s}
                  </Badge>
                );
              })}
            </div>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={val => { if (val) setViewMode(val as ViewMode); }}
              className="bg-muted/40 p-1 rounded-xl border flex shrink-0"
            >
              <ToggleGroupItem value="agenda" aria-label="Danh sách" className="w-8 h-8 p-0 rounded-lg">
                <List size={14} />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Lịch" className="w-8 h-8 p-0 rounded-lg">
                <CalendarDays size={14} />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm theo tên hoặc địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
              aria-label="Tìm sự kiện"
            />
          </div>

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
            <div className="relative w-full overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer select-none text-xs font-medium text-muted-foreground py-3 pl-4 pr-3 bg-muted/50 dark:bg-default-100/20">
                      Sự kiện{renderSortArrow('name')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('date')} className="cursor-pointer select-none text-xs font-medium text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20 hidden md:table-cell">
                      Ngày{renderSortArrow('date')}
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20 hidden md:table-cell">Địa điểm</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20 hidden md:table-cell">Nhân viên</TableHead>
                    <TableHead onClick={() => handleSort('status')} className="cursor-pointer select-none text-xs font-medium text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20">
                      Trạng thái{renderSortArrow('status')}
                    </TableHead>
                    {isAdmin && <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-4 pl-3 text-right bg-muted/50 dark:bg-default-100/20 hidden sm:table-cell">Hành động</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableSorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                        <EmptyState icon={<CalendarDays size={26} />} title="Chưa có sự kiện nào" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableSorted.map(event => {
                      const dateDisplay = event.endDate && event.endDate !== event.date
                        ? `${event.date} → ${event.endDate}`
                        : event.date;
                      return (
                        <TableRow
                          key={event.id}
                          onClick={() => openEvent(event.id)}
                          className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 dark:hover:bg-default-100/5 transition-colors"
                        >
                          <TableCell className="py-3.5 pl-4 pr-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                              <p className="text-xs text-muted truncate md:hidden">{dateDisplay} · {event.location}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-3 hidden md:table-cell">
                            <p className="text-sm text-default-500 whitespace-nowrap">{dateDisplay}</p>
                          </TableCell>
                          <TableCell className="py-3.5 px-3 hidden md:table-cell">
                            <p className="text-sm text-default-500 truncate">{event.location}</p>
                          </TableCell>
                          <TableCell className="py-3.5 px-3 hidden md:table-cell">
                            <MiniAvatarGroup members={event.staff} />
                          </TableCell>
                          <TableCell className="py-3.5 px-3">
                            <StatusBadge status={event.status} />
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="py-3.5 pr-4 pl-3 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => openEvent(event.id)}
                                  aria-label="Xem chi tiết"
                                  className="w-8 h-8 rounded-lg text-default-400 hover:text-foreground hover:bg-default-100 p-0 flex items-center justify-center"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
                                      deleteEventMutation.mutate(event.id);
                                    }
                                  }}
                                  aria-label="Xóa sự kiện"
                                  className="w-8 h-8 rounded-lg text-default-400 hover:text-danger hover:bg-danger/10 p-0 flex items-center justify-center"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>}

      {/* Desktop: chi tiết sự kiện trong Drawer phải */}
      <Sheet open={drawerEvent != null} onOpenChange={(open) => { if (!open) setDrawerEventId(null); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[min(44rem,100vw)] max-w-full p-4 outline-none border-l border-border bg-background shadow-2xl overflow-y-auto h-full"
        >
          {drawerEvent && (
            <EventDetailContent
              event={drawerEvent}
              variant="drawer"
              onClose={() => setDrawerEventId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
