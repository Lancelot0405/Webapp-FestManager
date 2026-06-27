import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ToggleButtonGroup, ToggleButton } from '@heroui/react';
import { CalendarDate } from '@internationalized/date';
import { animations } from '../../lib/animations';
import StatusBadge from '../shared/StatusBadge';
import type { EventStatus, FestivalEvent } from '../../types';

type RangeMode = 'day' | 'week' | 'month';
type EventWithStatus = FestivalEvent & { status: EventStatus };

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

interface EventCalendarViewProps {
  events: EventWithStatus[];
  selectedDate: CalendarDate;
  onDateChange: (d: CalendarDate) => void;
  rangeMode: RangeMode;
  onRangeModeChange: (m: RangeMode) => void;
  onNavigate: (id: number) => void;
}

export default function EventCalendarView({
  events,
  selectedDate,
  onDateChange,
  rangeMode,
  onRangeModeChange,
  onNavigate,
}: EventCalendarViewProps) {
  const eventDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      const start = ddmmToCalendarDate(e.date);
      const end = e.endDate ? ddmmToCalendarDate(e.endDate) : start;
      if (!start) continue;
      const endMs = cdMs(end ?? start);
      let cur = start;
      while (cdMs(cur) <= endMs) {
        set.add(`${cur.year}-${cur.month}-${cur.day}`);
        cur = cur.add({ days: 1 });
      }
    }
    return set;
  }, [events]);

  const dayEvents = useMemo(
    () => events.filter(e => eventContainsDate(e, selectedDate)),
    [events, selectedDate],
  );

  const visibleDuration = rangeMode === 'week'
    ? { weeks: 1 }
    : { months: 1 };

  const selLabel = `${String(selectedDate.day).padStart(2,'0')}-${String(selectedDate.month).padStart(2,'0')}-${selectedDate.year}`;

  return (
    <div className="space-y-4">
      {/* Range toggle */}
      <div className="flex justify-end">
        <ToggleButtonGroup
          selectionMode="single"
          disallowEmptySelection
          isDetached
          size="sm"
          selectedKeys={new Set([rangeMode])}
          onSelectionChange={keys => {
            const k = [...keys][0] as RangeMode;
            if (k) onRangeModeChange(k);
          }}
        >
          <ToggleButton id="month" className="text-xs px-3">Tháng</ToggleButton>
          <ToggleButton id="week"  className="text-xs px-3">Tuần</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* Calendar with event dots */}
      <div className="flex justify-center">
        <Calendar
          aria-label="Lịch sự kiện"
          value={selectedDate}
          onChange={d => d && onDateChange(d)}
          visibleDuration={visibleDuration}
        >
          <Calendar.Header>
            <Calendar.NavButton slot="previous" />
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="next" />
          </Calendar.Header>

          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }: { year: number; formattedYear: string; isSelected: boolean; isCurrentYear: boolean; isOpen: boolean }) => (
                <Calendar.YearPickerCell year={year} />
              )}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>

          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day: string) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date: CalendarDate) => (
                <Calendar.Cell date={date}>
                  {eventDateKeys.has(`${date.year}-${date.month}-${date.day}`) && (
                    <Calendar.CellIndicator className="w-1 h-1 rounded-full bg-accent" />
                  )}
                </Calendar.Cell>
              )}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </div>

      {/* Events for selected date */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider px-1">
          {selLabel} · {dayEvents.length} sự kiện
        </p>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-6">Không có sự kiện</p>
        ) : (
          dayEvents.map((event, i) => {
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
                <StatusBadge status={event.status} />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
