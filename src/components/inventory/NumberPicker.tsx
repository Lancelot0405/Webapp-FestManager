import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@heroui/react';
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
}: NumberPickerProps) {
  const numVal  = parseFloat(value);
  const isQuick = !isNaN(numVal) && QUICK_VALUES.includes(numVal);
  const [custom, setCustom] = useState(!isQuick && value !== '');

  return (
    <div>
      <label className="text-xs font-semibold text-[var(--text-secondary)]">{label}</label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {QUICK_VALUES.map(v => (
          <Button
            key={v}
            variant="ghost"
            onPress={() => { onChange(String(v)); setCustom(false); }}
            className={`h-auto min-w-0 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
              !custom && numVal === v
                ? 'bg-[var(--primary)] text-[var(--background)] border-[var(--primary)]'
                : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/40'
            }`}
          >
            {v}
          </Button>
        ))}
        <Button
          variant="ghost"
          onPress={() => { setCustom(true); if (isQuick) onChange(''); }}
          className={`h-auto min-w-0 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            custom
              ? 'bg-[var(--primary)] text-[var(--background)] border-[var(--primary)]'
              : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/40'
          }`}
        >
          <Pencil size={10} /> Tùy chỉnh
        </Button>
      </div>
      {custom && (
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          isRequired={required}
          autoFocus
          className="mt-2"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
      {!custom && required && value === '' && (
        <input type="number" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}
    </div>
  );
}
