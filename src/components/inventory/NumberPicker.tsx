import { useState } from 'react';
import { Pencil } from 'lucide-react';

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
          <button
            key={v}
            type="button"
            onClick={() => { onChange(String(v)); setCustom(false); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
              !custom && numVal === v
                ? 'bg-brand-gradient text-white border-transparent shadow-[0_2px_6px_0_rgb(249_115_22/0.35)]'
                : 'bg-brand-50 dark:bg-espresso-700 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-espresso-700 hover:border-brand-400 hover:bg-brand-100'
            }`}
          >
            {v}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setCustom(true); if (isQuick) onChange(''); }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            custom
              ? 'bg-brand-gradient text-white border-transparent shadow-[0_2px_6px_0_rgb(249_115_22/0.35)]'
              : 'bg-brand-50 dark:bg-espresso-700 text-brand-500 dark:text-brand-400 border-brand-200 dark:border-espresso-700 hover:border-brand-400'
          }`}
        >
          <Pencil size={10} /> Tùy chỉnh
        </button>
      </div>
      {custom && (
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          required={required}
          autoFocus
          className="mt-2 w-full border border-brand-300 dark:border-brand-700 bg-white dark:bg-espresso-700 text-espresso-800 dark:text-espresso-50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 focus:border-brand-500 transition-all"
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
