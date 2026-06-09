import { useState, useEffect } from 'react';
import { Pencil, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FoodTemplate {
  id: number;
  name: string;
  group_name: string;
  item_type: string;
  sort_order: number;
}

interface FoodNameSelectProps {
  value: string;
  onChange: (v: string) => void;
  itemType?: 'food' | 'equipment';
  placeholder?: string;
  required?: boolean;
}

export default function FoodNameSelect({
  value,
  onChange,
  itemType = 'food',
  placeholder,
  required,
}: FoodNameSelectProps) {
  const [templates, setTemplates] = useState<FoodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('food_templates')
      .select('*')
      .eq('item_type', itemType)
      .order('group_name')
      .order('sort_order')
      .then(({ data }) => {
        setTemplates(data ?? []);
        setLoading(false);
      });
  }, [itemType]);

  // Group templates by group_name
  const groups = templates.reduce<Record<string, FoodTemplate[]>>((acc, t) => {
    if (!acc[t.group_name]) acc[t.group_name] = [];
    acc[t.group_name].push(t);
    return acc;
  }, {});

  const handleSelect = (name: string) => {
    onChange(name);
    setCustom(false);
    setOpenGroup(null);
  };

  const handleCustomMode = () => {
    setCustom(true);
    setOpenGroup(null);
    onChange('');
  };

  const isFromTemplate = value && templates.some(t => t.name === value);

  return (
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
        Tên {itemType === 'food' ? 'thực phẩm' : 'thiết bị'}
      </label>

      {/* Selected chip + change button */}
      {!custom && value && (
        <div className="mt-1 flex items-center gap-2">
          <span className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 rounded-lg px-3 py-2 text-sm font-medium truncate">
            {value}
          </span>
          <button
            type="button"
            onClick={() => { onChange(''); setOpenGroup(null); }}
            className="text-xs text-gray-500 hover:text-red-500 px-2 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700"
          >
            Đổi
          </button>
        </div>
      )}

      {/* Template picker */}
      {!custom && !value && (
        <div className="mt-1 space-y-1">
          {loading ? (
            <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    {group}
                    <ChevronDown
                      size={13}
                      className={`transition-transform ${openGroup === group ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openGroup === group && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-slate-800">
                      {items.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelect(t.name)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleCustomMode}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-500 text-xs text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Pencil size={11} /> Nhập tên tùy chỉnh
              </button>
            </>
          )}
        </div>
      )}

      {/* Custom text input */}
      {custom && (
        <div className="mt-1 flex gap-2">
          <input
            autoFocus
            required={required}
            className="flex-1 border border-blue-300 dark:border-blue-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder ?? (itemType === 'food' ? 'VD: Thịt bò' : 'VD: Găng tay')}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => { setCustom(false); onChange(''); }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-500 hover:text-red-500"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Hidden required guard */}
      {required && !value && !custom && (
        <input type="text" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}

      {!isFromTemplate && value && !custom && (
        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Tên tùy chỉnh</p>
      )}
    </div>
  );
}
