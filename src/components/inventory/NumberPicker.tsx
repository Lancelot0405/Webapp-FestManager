import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NumberPickerProps {
  value:        string;
  onChange:     (v: string) => void;
  label:        string;
  placeholder?: string;
  required?:    boolean;
  min?:         number;
  max?:         number;
  step?:        number;
  error?:       string;
}

const QUICK_VALUES = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50];

export default function NumberPicker({
  value,
  onChange,
  label,
  placeholder = '0',
  required,
  min  = 0,
  max,
  step = 1,
  error,
}: NumberPickerProps) {
  const numVal  = parseFloat(value);
  const isQuick = !isNaN(numVal) && QUICK_VALUES.includes(numVal);
  const [custom, setCustom] = useState(!isQuick && value !== '');

  return (
    <div>
      <label className="text-xs font-semibold text-foreground/80">{label}</label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {QUICK_VALUES.map(v => (
          <Button
            type="button"
            key={v}
            variant="ghost"
            onClick={() => { onChange(String(v)); setCustom(false); }}
            className={`h-auto min-w-0 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 flex items-center ${
              !custom && numVal === v
                ? 'bg-accent text-white dark:text-foreground border-accent hover:bg-accent hover:text-white'
                : 'bg-muted/40 text-foreground/80 border-border hover:border-accent/40 hover:bg-muted/60'
            }`}
          >
            {v}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() => { setCustom(true); if (isQuick) onChange(''); }}
          className={`h-auto min-w-0 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            custom
              ? 'bg-accent text-white dark:text-foreground border-accent hover:bg-accent hover:text-white'
              : 'bg-muted/40 text-foreground/80 border-border hover:border-accent/40 hover:bg-muted/60'
          }`}
        >
          <Pencil size={10} /> Tùy chỉnh
        </Button>
      </div>
      {custom && (
        <div className="w-full flex flex-col gap-1 mt-2">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className={error ? 'border-destructive' : 'border-input'}
          />
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
      )}
      {error && !custom && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
      {!custom && required && value === '' && (
        <input type="number" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}
    </div>
  );
}
