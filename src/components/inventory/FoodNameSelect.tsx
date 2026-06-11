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
        <label className="text-xs font-semibold text-[var(--text-secondary)]">
          Tên {itemType === 'food' ? 'thực phẩm' : 'thiết bị'}
        </label>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowManager(true)}
            className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
          >
            <Settings size={11} /> Quản lý mẫu
          </button>
        )}
      </div>

      {/* Selected chip */}
      {!custom && value && (
        <div className="flex items-center gap-2">
          <span className="flex-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] rounded-xl px-3 py-2 text-sm font-semibold truncate">
            {value}
          </span>
          <button
            type="button"
            onClick={() => { onChange(''); setOpenGroup(null); }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] px-3 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] font-medium transition-colors"
          >
            Đổi
          </button>
        </div>
      )}

      {/* Template picker */}
      {!custom && !value && (
        <div className="space-y-1.5">
          {loading ? (
            <div className="h-9 bg-[var(--glass-bg)] rounded-xl animate-pulse" />
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-[var(--glass-border)] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--glass-bg)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {group}
                    <ChevronDown
                      size={13}
                      className={`text-[var(--text-muted)] transition-transform ${openGroup === group ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openGroup === group && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-[var(--glass-bg)]/50">
                      {items.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { onChange(t.name); setCustom(false); setOpenGroup(null); }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-[var(--background)] hover:border-[var(--primary)] active:scale-95 transition-all"
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
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)] transition-colors font-medium"
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
            className="flex-1 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] text-[var(--text-primary)] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--primary)]/50 transition-all placeholder:text-[var(--text-muted)]"
            placeholder={placeholder ?? (itemType === 'food' ? 'VD: Thịt bò' : 'VD: Găng tay')}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => { setCustom(false); onChange(''); }}
            className="px-3 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-xs text-[var(--text-muted)] hover:text-[var(--danger)] font-medium transition-colors"
          >
            Hủy
          </button>
        </div>
      )}

      {required && !value && !custom && (
        <input type="text" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}
      {!isFromTemplate && value && !custom && (
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">Tên tùy chỉnh</p>
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
