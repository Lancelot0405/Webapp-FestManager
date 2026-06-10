import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FoodTemplate {
  id:         number;
  name:       string;
  group_name: string;
  item_type:  string;
  sort_order: number;
}

interface Props {
  itemType:  'food' | 'equipment';
  onClose:   () => void;
  onChanged: () => void;
}

export default function FoodTemplateManager({ itemType, onClose, onChanged }: Props) {
  const [templates,    setTemplates]    = useState<FoodTemplate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [openGroup,    setOpenGroup]    = useState<string | null>(null);
  const [newItemName,  setNewItemName]  = useState('');
  const [newItemGroup, setNewItemGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [deletingId,   setDeletingId]   = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('food_templates').select('*').eq('item_type', itemType)
        .order('group_name').order('sort_order');
      if (!cancelled) {
        setTemplates(data ?? []);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [itemType]);

  const groups = templates.reduce<Record<string, FoodTemplate[]>>((acc, t) => {
    if (!acc[t.group_name]) acc[t.group_name] = [];
    acc[t.group_name].push(t);
    return acc;
  }, {});

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await supabase.from('food_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    setDeletingId(null);
    onChanged();
  };

  const handleAddItem = async (group: string) => {
    const name = newItemName.trim();
    if (!name) return;
    setSaving(true);
    const maxOrder = Math.max(0, ...templates.filter(t => t.group_name === group).map(t => t.sort_order));
    const { data } = await supabase
      .from('food_templates')
      .insert({ name, group_name: group, item_type: itemType, sort_order: maxOrder + 10 })
      .select().single();
    if (data) setTemplates(prev => [...prev, data]);
    setNewItemName(''); setNewItemGroup('');
    setSaving(false); onChanged();
  };

  const handleAddGroup = async () => {
    const name  = newItemName.trim();
    const group = newGroupName.trim();
    if (!name || !group) return;
    setSaving(true);
    const { data } = await supabase
      .from('food_templates')
      .insert({ name, group_name: group, item_type: itemType, sort_order: 10 })
      .select().single();
    if (data) { setTemplates(prev => [...prev, data]); setOpenGroup(group); }
    setNewItemName(''); setNewGroupName(''); setShowAddGroup(false);
    setSaving(false); onChanged();
  };

  const inputCls =
    'w-full border border-brand-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] ' +
    'text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 focus:border-brand-500 transition-all ' +
    'placeholder:text-[var(--text-muted)]';

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-[var(--card-bg)] rounded-t-2xl sm:rounded-2xl shadow-warm flex flex-col max-h-[85dvh] sm:max-h-[85vh] border border-[var(--border-color)]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100 dark:border-[var(--border-color)] shrink-0">
          <h2 className="font-bold text-[var(--text-primary)] text-sm">
            Quản lý mẫu — {itemType === 'food' ? 'Thực phẩm' : 'Thiết bị'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-7 h-7 rounded-full flex items-center justify-center text-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-brand-500" />
            </div>
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-brand-100 dark:border-[var(--border-color)] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-brand-50 dark:bg-[var(--card-bg)] text-xs font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-[var(--accent)] transition-colors"
                  >
                    <span>{group} <span className="font-normal text-brand-400">({items.length})</span></span>
                    {openGroup === group
                      ? <ChevronUp size={13} className="text-brand-400" />
                      : <ChevronDown size={13} className="text-brand-400" />
                    }
                  </button>

                  {openGroup === group && (
                    <div className="p-3 bg-white dark:bg-[var(--card-bg)] space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(t => (
                          <div key={t.id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg border border-brand-200 dark:border-[var(--border-color)] bg-brand-50 dark:bg-[var(--card-bg)] text-xs text-brand-700 dark:text-brand-300 font-medium">
                            {t.name}
                            <button
                              type="button"
                              aria-label={`Xóa ${t.name}`}
                              onClick={() => handleDelete(t.id)}
                              disabled={deletingId === t.id}
                              className="ml-0.5 text-brand-300 hover:text-red-500 disabled:opacity-40 transition-colors"
                            >
                              {deletingId === t.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <X size={11} />
                              }
                            </button>
                          </div>
                        ))}
                      </div>

                      {newItemGroup === group ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            autoFocus
                            className={inputCls}
                            placeholder="Tên sản phẩm mới..."
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleAddItem(group); }
                              if (e.key === 'Escape') { setNewItemGroup(''); setNewItemName(''); }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddItem(group)}
                            disabled={saving || !newItemName.trim()}
                            className="px-3 py-1.5 bg-brand-gradient text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-[0_2px_6px_0_rgb(249_115_22/0.30)]"
                          >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : 'Thêm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setNewItemGroup(''); setNewItemName(''); }}
                            className="px-2 py-1.5 rounded-xl border border-brand-200 dark:border-[var(--border-color)] text-xs text-brand-400 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setNewItemGroup(group); setNewItemName(''); setShowAddGroup(false); }}
                          className="flex items-center gap-1 text-xs text-brand-500 dark:text-brand-400 hover:text-brand-700 font-medium mt-1 transition-colors"
                        >
                          <Plus size={11} /> Thêm vào nhóm này
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add new group */}
              {showAddGroup ? (
                <div className="border border-dashed border-brand-300 dark:border-brand-700 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-brand-700 dark:text-brand-300">Tạo nhóm mới</p>
                  <input
                    autoFocus
                    className={inputCls}
                    placeholder="Tên nhóm (VD: Đồ uống)"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder="Tên sản phẩm đầu tiên"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGroup(); } }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddGroup}
                      disabled={saving || !newGroupName.trim() || !newItemName.trim()}
                      className="flex-1 py-2 bg-brand-gradient text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-[0_2px_6px_0_rgb(249_115_22/0.30)]"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Tạo nhóm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddGroup(false); setNewGroupName(''); setNewItemName(''); }}
                      className="px-3 py-2 rounded-xl border border-brand-200 dark:border-[var(--border-color)] text-xs text-brand-400 hover:text-red-500"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowAddGroup(true); setNewItemGroup(''); setNewItemName(''); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-brand-300 dark:border-brand-700 text-xs text-brand-500 dark:text-brand-400 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors font-medium"
                >
                  <Plus size={12} /> Thêm nhóm mới
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-brand-100 dark:border-[var(--border-color)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-warm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
