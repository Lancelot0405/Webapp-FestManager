import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button, Calendar, Popover } from '@heroui/react';
import { parseDate, CalendarDate } from '@internationalized/date';

interface AppDatePickerProps {
  label?: string;
  value: string;           // YYYY-MM-DD
  onChange: (iso: string) => void;
  error?: string;
  minValue?: string;       // YYYY-MM-DD
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
}

function isoToCalDate(iso: string): CalendarDate | null {
  if (!iso) return null;
  try { return parseDate(iso); } catch { return null; }
}

function calDateToISO(cd: CalendarDate): string {
  return `${cd.year}-${String(cd.month).padStart(2, '0')}-${String(cd.day).padStart(2, '0')}`;
}

function displayISO(iso: string): string {
  if (!iso) return '';
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

export default function AppDatePicker({
  label,
  value,
  onChange,
  error,
  minValue,
  placeholder = 'Chọn ngày...',
  isRequired,
  className = '',
}: AppDatePickerProps) {
  const [open, setOpen] = useState(false);
  const calDate    = isoToCalDate(value);
  const minCalDate = isoToCalDate(minValue ?? '');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-foreground/80">
          {label}{isRequired && <span className="text-danger ml-0.5">*</span>}
        </span>
      )}

      <Popover isOpen={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal h-10 px-3 gap-2 ${
              !value ? 'text-foreground/40' : 'text-foreground'
            } ${error ? 'border-danger' : ''}`}
          >
            <CalendarIcon size={14} className="shrink-0" />
            <span>{value ? displayISO(value) : placeholder}</span>
          </Button>
        </Popover.Trigger>
        <Popover.Content className="p-0 overflow-hidden rounded-2xl border border-separator shadow-xl">
          <Popover.Dialog aria-label={label ?? 'Chọn ngày'}>
            <CalendarWithYearPicker
              value={calDate ?? undefined}
              minValue={minCalDate ?? undefined}
              onChange={(cd) => {
                if (cd) { onChange(calDateToISO(cd)); setOpen(false); }
              }}
            />
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

interface CalWithYPProps {
  value?: CalendarDate;
  minValue?: CalendarDate;
  onChange: (cd: CalendarDate) => void;
}

export function CalendarWithYearPicker({ value, minValue, onChange }: CalWithYPProps) {
  return (
    <Calendar
      aria-label="Chọn ngày"
      value={value}
      minValue={minValue}
      onChange={(cd) => cd && onChange(cd)}
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
          {(date: CalendarDate) => <Calendar.Cell date={date} />}
        </Calendar.GridBody>
      </Calendar.Grid>
    </Calendar>
  );
}
