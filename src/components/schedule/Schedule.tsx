import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye } from 'lucide-react';
import {
  Button, Chip, Table,
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
  const [rangeMode,     setRangeMode]     = useState<RangeMode>('month');
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
            <ToggleButton id="month" className="flex-1 text-xs">Tháng</ToggleButton>
            <ToggleButton id="week"  className="flex-1 text-xs">Tuần</ToggleButton>
            <ToggleButton id="day"   className="flex-1 text-xs">Ngày</ToggleButton>
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
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Danh sách sự kiện">
                  <Table.Header>
                    <Table.Column isRowHeader className="text-xs font-medium text-default-500 py-3 pl-4 pr-3 bg-default-50 dark:bg-default-100/20">Sự kiện</Table.Column>
                    <Table.Column className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20 hidden md:table-cell">Ngày</Table.Column>
                    <Table.Column className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20 hidden md:table-cell">Địa điểm</Table.Column>
                    <Table.Column className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20 hidden md:table-cell">Nhân viên</Table.Column>
                    <Table.Column className="text-xs font-medium text-default-500 py-3 px-3 bg-default-50 dark:bg-default-100/20">Trạng thái</Table.Column>
                    <Table.Column className="text-xs font-medium text-default-500 py-3 pr-4 pl-3 text-right bg-default-50 dark:bg-default-100/20">Hành động</Table.Column>
                  </Table.Header>
                  <Table.Body renderEmptyState={() => (
                    <p className="text-sm text-foreground/50 text-center py-10">Chưa có sự kiện nào</p>
                  )}>
                    {sorted.map(event => {
                      const dateDisplay = event.endDate && event.endDate !== event.date
                        ? `${event.date} → ${event.endDate}`
                        : event.date;
                      return (
                        <Table.Row
                          key={event.id} id={String(event.id)}
                          onAction={() => navigate('/schedule/' + event.id)}
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
                          <Table.Cell className="py-3.5 pr-4 pl-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                isIconOnly size="sm" variant="ghost"
                                onPress={() => navigate('/schedule/' + event.id)}
                                aria-label="Xem chi tiết"
                                className="w-8 h-8 rounded-lg text-default-400 hover:text-foreground hover:bg-default-100"
                              >
                                <Eye size={14} />
                              </Button>
                              {isAdmin && (
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
                              )}
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

