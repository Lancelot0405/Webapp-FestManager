import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '@/components/ui/input';

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

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85dvh] sm:max-h-[85vh] border border-[var(--glass-border)]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)] shrink-0">
          <h2 className="font-bold text-[var(--text-primary)] text-sm">
            Quản lý mẫu — {itemType === 'food' ? 'Thực phẩm' : 'Thiết bị'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-[var(--glass-border)] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--glass-bg)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <span>{group} <span className="font-normal text-[var(--text-muted)]">({items.length})</span></span>
                    {openGroup === group
                      ? <ChevronUp size={13} className="text-[var(--text-muted)]" />
                      : <ChevronDown size={13} className="text-[var(--text-muted)]" />
                    }
                  </button>

                  {openGroup === group && (
                    <div className="p-3 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(t => (
                          <div key={t.id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-xs text-[var(--text-secondary)] font-medium">
                            {t.name}
                            <button
                              type="button"
                              aria-label={`Xóa ${t.name}`}
                              onClick={() => handleDelete(t.id)}
                              disabled={deletingId === t.id}
                              className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--danger)] disabled:opacity-40 transition-colors"
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
                          <Input
                            autoFocus
                            className="flex-1"
                            inputClassName="h-9 text-xs"
                            placeholder="Tên sản phẩm mới..."
                            value={newItemName}
                            onChange={setNewItemName}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleAddItem(group); }
                              if (e.key === 'Escape') { setNewItemGroup(''); setNewItemName(''); }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddItem(group)}
                            disabled={saving || !newItemName.trim()}
                            className="px-3 py-1.5 bg-[var(--primary)] text-[var(--background)] rounded-xl text-xs font-semibold disabled:opacity-50 transition-opacity"
                          >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : 'Thêm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setNewItemGroup(''); setNewItemName(''); }}
                            className="px-2 py-1.5 rounded-xl border border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setNewItemGroup(group); setNewItemName(''); setShowAddGroup(false); }}
                          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium mt-1 transition-colors"
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
                <div className="border border-dashed border-[var(--glass-border)] rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-[var(--text-secondary)]">Tạo nhóm mới</p>
                  <Input
                    autoFocus
                    inputClassName="h-9 text-xs"
                    placeholder="Tên nhóm (VD: Đồ uống)"
                    value={newGroupName}
                    onChange={setNewGroupName}
                  />
                  <Input
                    inputClassName="h-9 text-xs"
                    placeholder="Tên sản phẩm đầu tiên"
                    value={newItemName}
                    onChange={setNewItemName}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGroup(); } }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddGroup}
                      disabled={saving || !newGroupName.trim() || !newItemName.trim()}
                      className="flex-1 py-2 bg-[var(--primary)] text-[var(--background)] rounded-xl text-xs font-semibold disabled:opacity-50 transition-opacity"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Tạo nhóm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddGroup(false); setNewGroupName(''); setNewItemName(''); }}
                      className="px-3 py-2 rounded-xl border border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowAddGroup(true); setNewItemGroup(''); setNewItemName(''); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)] transition-colors font-medium"
                >
                  <Plus size={12} /> Thêm nhóm mới
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--glass-border)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-[var(--background)] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
