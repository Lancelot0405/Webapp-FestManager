import { useState } from 'react';
import { Pencil } from 'lucide-react';

interface NumberPickerProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

const QUICK_VALUES = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50];

export default function NumberPicker({
  value,
  onChange,
  label,
  placeholder = '0',
  required,
  min = 0,
  max,
  step = 1,
}: NumberPickerProps) {
  const numVal = parseFloat(value);
  const isQuick = !isNaN(numVal) && QUICK_VALUES.includes(numVal);
  const [custom, setCustom] = useState(!isQuick && value !== '');

  const handleQuick = (v: number) => {
    onChange(String(v));
    setCustom(false);
  };

  const handleCustom = (v: string) => {
    onChange(v);
  };

  return (
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">{label}</label>
      <div className="mt-1 flex flex-wrap gap-1">
        {QUICK_VALUES.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => handleQuick(v)}
            className={`px-2 py-1 rounded-md text-xs font-semibold border transition-colors ${
              !custom && numVal === v
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300'
            }`}
          >
            {v}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setCustom(true); if (isQuick) onChange(''); }}
          className={`px-2 py-1 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1 ${
            custom
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
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
          className="mt-2 w-full border border-blue-300 dark:border-blue-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={value}
          onChange={e => handleCustom(e.target.value)}
        />
      )}
      {!custom && required && value === '' && (
        <input type="number" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}
    </div>
  );
}
