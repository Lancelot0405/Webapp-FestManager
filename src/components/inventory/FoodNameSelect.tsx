import { useState, useEffect, useCallback } from 'react';
import { Pencil, ChevronDown, Settings } from 'lucide-react';
import { Button } from '@heroui/react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Input } from '@/components/shared/GlassInput';
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
  const { currentUser } = useApp();
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';

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
        <label className="text-xs font-semibold text-foreground/80">
          Tên {itemType === 'food' ? 'thực phẩm' : 'thiết bị'}
        </label>
        {canManage && (
          <Button
            variant="ghost"
            onPress={() => setShowManager(true)}
            className="h-auto min-w-0 p-0 flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors font-medium"
          >
            <Settings size={11} /> Quản lý mẫu
          </Button>
        )}
      </div>

      {/* Selected chip */}
      {!custom && value && (
        <div className="flex items-center gap-2">
          <span className="flex-1 bg-accent/10 border border-accent/20 text-accent rounded-xl px-3 py-2 text-sm font-semibold truncate">
            {value}
          </span>
          <Button
            variant="ghost"
            onPress={() => { onChange(''); setOpenGroup(null); }}
            className="h-auto min-w-0 text-xs text-muted hover:text-danger px-3 py-2 rounded-xl border border-separator bg-default/50 font-medium transition-colors"
          >
            Đổi
          </Button>
        </div>
      )}

      {/* Template picker */}
      {!custom && !value && (
        <div className="space-y-1.5">
          {loading ? (
            <div className="h-9 bg-default/50 rounded-xl animate-pulse" />
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-separator rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    onPress={() => setOpenGroup(openGroup === group ? null : group)}
                    className="card-btn w-full h-auto justify-between rounded-none px-3 py-2.5 bg-default/50 text-xs font-bold text-foreground/80 hover:bg-default/70 hover:text-foreground transition-colors"
                  >
                    {group}
                    <ChevronDown
                      size={13}
                      className={`text-muted transition-transform ${openGroup === group ? 'rotate-180' : ''}`}
                    />
                  </Button>
                  {openGroup === group && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-default/30">
                      {items.map(t => (
                        <Button
                          key={t.id}
                          variant="ghost"
                          onPress={() => { onChange(t.name); setCustom(false); setOpenGroup(null); }}
                          className="h-auto min-w-0 px-2.5 py-1 rounded-lg text-xs font-medium border border-separator bg-default/50 text-foreground/80 hover:bg-accent hover:text-white hover:border-accent active:scale-95 transition-all"
                        >
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                onPress={() => { setCustom(true); setOpenGroup(null); onChange(''); }}
                className="w-full h-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-separator text-xs text-muted hover:border-accent/40 hover:text-foreground transition-colors font-medium"
              >
                <Pencil size={11} /> Nhập tên tùy chỉnh
              </Button>
            </>
          )}
        </div>
      )}

      {/* Custom input */}
      {custom && (
        <div className="flex gap-2">
          <Input
            autoFocus
            isRequired={required}
            className="flex-1"
            placeholder={placeholder ?? (itemType === 'food' ? 'VD: Thịt bò' : 'VD: Găng tay')}
            value={value}
            onChange={onChange}
          />
          <Button
            variant="ghost"
            onPress={() => { setCustom(false); onChange(''); }}
            className="h-auto min-w-0 px-3 py-2 rounded-xl border border-separator bg-default/50 text-xs text-muted hover:text-danger font-medium transition-colors"
          >
            Hủy
          </Button>
        </div>
      )}

      {required && !value && !custom && (
        <input type="text" required value="" onChange={() => {}} className="sr-only" aria-hidden />
      )}
      {!isFromTemplate && value && !custom && (
        <p className="mt-1 text-[10px] text-muted">Tên tùy chỉnh</p>
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
