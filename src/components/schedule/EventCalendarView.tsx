import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { CalendarDate } from '@internationalized/date';
import { animations } from '../../lib/animations';
import StatusBadge from '../shared/StatusBadge';
import MiniAvatarGroup from './MiniAvatarGroup';
import { cn } from '@/lib/utils';
import type { EventStatus, FestivalEvent } from '../../types';

type RangeMode = 'day' | 'week' | 'month';
type EventWithStatus = FestivalEvent & { status: EventStatus };

const STATUS_RANK: Record<EventStatus, number> = {
  'Đang diễn ra': 0, 'Sắp tới': 1, 'Lên kế hoạch': 2, 'Đã hoàn thành': 3,
};

const STATUS_DOT: Record<EventStatus, string> = {
  'Đang diễn ra': 'bg-success',
  'Sắp tới':       'bg-accent',
  'Lên kế hoạch': 'bg-warning',
  'Đã hoàn thành': 'bg-muted-foreground',
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
  const eventDateColor = useMemo(() => {
    const map = new Map<string, EventStatus>();
    for (const e of events) {
      const start = ddmmToCalendarDate(e.date);
      const end = e.endDate ? ddmmToCalendarDate(e.endDate) : start;
      if (!start) continue;
      const endMs = cdMs(end ?? start);
      let cur = start;
      while (cdMs(cur) <= endMs) {
        const key = `${cur.year}-${cur.month}-${cur.day}`;
        const prev = map.get(key);
        if (!prev || STATUS_RANK[e.status] < STATUS_RANK[prev]) map.set(key, e.status);
        cur = cur.add({ days: 1 });
      }
    }
    return map;
  }, [events]);

  const dayEvents = useMemo(
    () => events.filter(e => eventContainsDate(e, selectedDate)),
    [events, selectedDate],
  );

  const selDateJs = useMemo(() => {
    return new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
  }, [selectedDate]);

  const selLabel = `${String(selectedDate.day).padStart(2,'0')}-${String(selectedDate.month).padStart(2,'0')}-${selectedDate.year}`;

  return (
    <div className="space-y-4">
      {/* Range toggle */}
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={rangeMode}
          onValueChange={val => {
            if (val) onRangeModeChange(val as RangeMode);
          }}
          className="bg-muted/40 p-1 rounded-xl border flex shrink-0"
        >
          <ToggleGroupItem value="month" className="text-xs px-3 h-8 rounded-lg font-semibold">Tháng</ToggleGroupItem>
          <ToggleGroupItem value="week"  className="text-xs px-3 h-8 rounded-lg font-semibold">Tuần</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Calendar with event dots */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selDateJs}
          onSelect={(d) => {
            if (d) {
              onDateChange(new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));
            }
          }}
          className="rounded-2xl border p-4 shadow-sm bg-surface"
          components={{
            DayButton: ({ day, modifiers, ...props }) => {
              const d = day.date;
              const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
              const eventStatus = eventDateColor.get(key);
              const isSelected = modifiers.selected;
              return (
                <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                  {eventStatus && (
                    <span className={cn(
                      "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors",
                      isSelected ? "bg-primary-foreground" : STATUS_DOT[eventStatus]
                    )} />
                  )}
                </CalendarDayButton>
              );
            }
          }}
        />
      </div>

      {/* Events for selected date */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider px-1">
          {selLabel} · {dayEvents.length} sự kiện
        </p>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-6 bg-surface/50 border border-dashed border-border rounded-xl">Không có sự kiện</p>
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
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface border border-border cursor-pointer hover:bg-default-100/60 dark:hover:bg-default-100/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                  <p className="text-xs text-foreground/50 truncate">{dateDisplay} · {event.location}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <MiniAvatarGroup members={event.staff} />
                  <StatusBadge status={event.status} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
