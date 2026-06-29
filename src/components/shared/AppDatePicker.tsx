import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { CalendarDate } from '@internationalized/date';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

function parseISODate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const parts = iso.split('-');
  if (parts.length !== 3) return undefined;
  const yyyy = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const dd = parseInt(parts[2], 10);
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) return undefined;
  return new Date(yyyy, mm - 1, dd);
}

function toISODateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function displayISO(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  const [yyyy, mm, dd] = parts;
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
  const selectedDate = parseISODate(value);
  const minDate = parseISODate(minValue ?? '');

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(toISODateString(date));
      setOpen(false);
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-foreground/80">
          {label}{isRequired && <span className="text-destructive ml-0.5">*</span>}
        </span>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal h-10 px-3 gap-2 bg-background border ${
              !value ? 'text-muted-foreground' : 'text-foreground'
            } ${error ? 'border-destructive' : 'border-input'}`}
          >
            <CalendarIcon size={14} className="shrink-0 text-muted-foreground" />
            <span>{value ? displayISO(value) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={minDate ? (date) => date < minDate : undefined}
            captionLayout="dropdown"
            startMonth={new Date(1990, 0)}
            endMonth={new Date(2050, 11)}
          />
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface CalWithYPProps {
  value?: CalendarDate;
  minValue?: CalendarDate;
  onChange: (cd: CalendarDate) => void;
}

export function CalendarWithYearPicker({ value, minValue, onChange }: CalWithYPProps) {
  const selectedDate = value ? new Date(value.year, value.month - 1, value.day) : undefined;
  const minDate = minValue ? new Date(minValue.year, minValue.month - 1, minValue.day) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
    }
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleSelect}
      disabled={minDate ? (date) => date < minDate : undefined}
      captionLayout="dropdown"
      startMonth={new Date(1990, 0)}
      endMonth={new Date(2050, 11)}
    />
  );
}


