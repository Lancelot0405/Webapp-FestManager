import { useState, useEffect, useCallback } from 'react';
import { Pencil, ChevronDown, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import FoodTemplateManager from './FoodTemplateManager';

interface FoodTemplate {
  id:         number;
  name:       string;
  group_name: string;
  item_type:  string;
  sort_order: number;
}

interface FoodNameSelectProps {
  value:        string;
  onChange:     (v: string) => void;
  itemType?:    'food' | 'equipment';
  placeholder?: string;
  required?:    boolean;
}

export default function FoodNameSelect({
  value,
  onChange,
  itemType    = 'food',
  placeholder,
  required,
}: FoodNameSelectProps) {
  const { state }  = useApp();
  const canManage  = state.currentUser?.role === 'admin' || state.currentUser?.role === 'manager';

  const [templates,    setTemplates]    = useState<FoodTemplate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [custom,       setCustom]       = useState(false);
  const [openGroup,    setOpenGroup]    = useState<string | null>(null);
  const [showManager,  setShowManager]  = useState(false);

  const load = useCallback(() => {
    supabase
      .from('food_templates')
      .select('*')
      .eq('item_type', itemType)
      .order('group_name')
      .order('sort_order')
      .then(({ data }) => { setTemplates(data ?? []); setLoading(false); });
  }, [itemType]);

  useEffect(() => { load(); }, [load]);

  const groups = templates.reduce<Record<string, FoodTemplate[]>>((acc, t) => {
    if (!acc[t.group_name]) acc[t.group_name] = [];
    acc[t.group_name].push(t);
    return acc;
  }, {});

  const isFromTemplate = value && templates.some(t => t.name === value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-brand-700 dark:text-brand-300">
          Tên {itemType === 'food' ? 'thực phẩm' : 'thiết bị'}
        </label>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowManager(true)}
            className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors font-medium"
          >
            <Settings size={11} /> Quản lý mẫu
          </button>
        )}
      </div>

      {/* Selected chip */}
      {!custom && value && (
        <div className="flex items-center gap-2">
          <span className="flex-1 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 rounded-xl px-3 py-2 text-sm font-semibold truncate">
            {value}
          </span>
          <button
            type="button"
            onClick={() => { onChange(''); setOpenGroup(null); }}
            className="text-xs text-brand-400 hover:text-red-500 px-3 py-2 rounded-xl border border-brand-200 dark:border-espresso-700 bg-white dark:bg-espresso-700 font-medium transition-colors"
          >
            Đổi
          </button>
        </div>
      )}

      {/* Template picker */}
      {!custom && !value && (
        <div className="space-y-1.5">
          {loading ? (
            <div className="h-9 bg-brand-50 dark:bg-espresso-700 rounded-xl shimmer" />
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-brand-100 dark:border-espresso-700 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-brand-50 dark:bg-espresso-700 text-xs font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-espresso-700/80 transition-colors"
                  >
                    {group}
                    <ChevronDown
                      size={13}
                      className={`text-brand-400 transition-transform ${openGroup === group ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openGroup === group && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-white dark:bg-espresso-800">
                      {items.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { onChange(t.name); setCustom(false); setOpenGroup(null); }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-brand-200 dark:border-espresso-700 bg-brand-50 dark:bg-espresso-700 text-brand-700 dark:text-brand-300 hover:bg-brand-500 hover:text-white hover:border-brand-500 active:scale-95 transition-all"
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
                onClick={() => { setCustom(true); setOpenGroup(null); onChange(''); }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-brand-300 dark:border-brand-700 text-xs text-brand-500 dark:text-brand-400 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors font-medium"
              >
                <Pencil size={11} /> Nhập tên tùy chỉnh
              </button>
            </>
          )}
        </div>
      )}

      {/* Custom input */}
      {custom && (
        <div className="flex gap-2">
          <input
            autoFocus
            required={required}
            className="flex-1 border border-brand-300 dark:border-brand-700 bg-white dark:bg-espresso-700 text-espresso-800 dark:text-espresso-50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 focus:border-brand-500 transition-all placeholder:text-brand-200 dark:placeholder:text-espresso-100/30"
            placeholder={placeholder ?? (itemType === 'food' ? 'VD: Thịt bò' : 'VD: Găng tay')}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => { setCustom(false); onChange(''); }}
            className="px-3 py-2 rounded-xl border border-brand-200 dark:border-espresso-700 bg-white dark:bg-espresso-700 text-xs text-brand-400 hover:text-red-500 font-medium transition-colors"
          >
            Hủy
          </button>
        </div>
      )}

      {required && !value && !custom && (
        <input type="text" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}
      {!isFromTemplate && value && !custom && (
        <p className="mt-1 text-[10px] text-brand-400 dark:text-brand-500">Tên tùy chỉnh</p>
      )}

      {showManager && (
        <FoodTemplateManager
          itemType={itemType}
          onClose={() => setShowManager(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}
