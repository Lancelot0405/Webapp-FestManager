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
      <label className="text-xs font-semibold text-brand-700 dark:text-brand-300">{label}</label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {QUICK_VALUES.map(v => (
          <Button
            key={v}
            type="button"
            onPress={() => { onChange(String(v)); setCustom(false); }}
            variant={!custom && numVal === v ? 'primary' : 'ghost'}
            size="sm"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold h-auto ${
              !custom && numVal === v
                ? 'shadow-[0_2px_6px_0_rgb(249_115_22/0.35)]'
                : 'border border-brand-200 dark:border-espresso-700 hover:border-brand-400'
            }`}
          >
            {v}
          </Button>
        ))}
        <Button
          type="button"
          onPress={() => { setCustom(true); if (isQuick) onChange(''); }}
          variant={custom ? 'primary' : 'ghost'}
          size="sm"
          className={`px-2.5 py-1 rounded-lg text-xs font-bold h-auto flex items-center gap-1 ${
            custom
              ? 'shadow-[0_2px_6px_0_rgb(249_115_22/0.35)]'
              : 'border border-brand-200 dark:border-espresso-700 hover:border-brand-400'
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
          required={required}
          autoFocus
          className="mt-2"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {!custom && required && value === '' && (
        <input type="number" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}
    </div>
  );
}
