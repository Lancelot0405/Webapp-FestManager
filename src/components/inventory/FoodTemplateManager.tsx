import { useState, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { supabase } from '../../lib/supabase';
import { Input } from '@/components/shared/GlassInput';

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
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-[var(--overlay)] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85dvh] sm:max-h-[85vh] border border-separator shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-separator shrink-0">
          <h2 className="font-bold text-foreground text-sm">
            Quản lý mẫu — {itemType === 'food' ? 'Thực phẩm' : 'Thiết bị'}
          </h2>
          <Button
            isIconOnly
            variant="ghost"
            onPress={onClose}
            aria-label="Đóng"
            className="w-7 h-7 min-w-0 h-auto rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-default/50 transition-colors"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-separator rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    onPress={() => setOpenGroup(openGroup === group ? null : group)}
                    className="card-btn w-full h-auto justify-between rounded-none px-3 py-2.5 bg-default/50 text-xs font-bold text-foreground/80 hover:bg-default/70 hover:text-foreground transition-colors"
                  >
                    <span>{group} <span className="font-normal text-muted">({items.length})</span></span>
                    {openGroup === group
                      ? <ChevronUp size={13} className="text-muted" />
                      : <ChevronDown size={13} className="text-muted" />
                    }
                  </Button>

                  {openGroup === group && (
                    <div className="p-3 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(t => (
                          <div key={t.id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg border border-separator bg-default text-xs text-foreground/80 font-medium">
                            {t.name}
                            <Button
                              isIconOnly
                              variant="ghost"
                              aria-label={`Xóa ${t.name}`}
                              onPress={() => handleDelete(t.id)}
                              isDisabled={deletingId === t.id}
                              className="h-auto min-w-0 p-0 ml-0.5 text-muted hover:text-danger disabled:opacity-40 transition-colors"
                            >
                              {deletingId === t.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <X size={11} />
                              }
                            </Button>
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
                          <Button
                            onPress={() => handleAddItem(group)}
                            isDisabled={saving || !newItemName.trim()}
                            className="h-auto min-w-0 px-3 py-1.5 bg-accent text-white dark:text-foreground rounded-xl text-xs font-semibold disabled:opacity-50 transition-opacity"
                          >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : 'Thêm'}
                          </Button>
                          <Button
                            isIconOnly
                            variant="ghost"
                            onPress={() => { setNewItemGroup(''); setNewItemName(''); }}
                            aria-label="Hủy"
                            className="h-auto min-w-0 px-2 py-1.5 rounded-xl border border-separator text-xs text-muted hover:text-danger transition-colors"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          onPress={() => { setNewItemGroup(group); setNewItemName(''); setShowAddGroup(false); }}
                          className="h-auto min-w-0 p-0 flex items-center gap-1 text-xs text-muted hover:text-foreground font-medium mt-1 transition-colors"
                        >
                          <Plus size={11} /> Thêm vào nhóm này
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add new group */}
              {showAddGroup ? (
                <div className="border border-dashed border-separator rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-foreground/80">Tạo nhóm mới</p>
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
                    <Button
                      onPress={handleAddGroup}
                      isDisabled={saving || !newGroupName.trim() || !newItemName.trim()}
                      className="flex-1 h-auto py-2 bg-accent text-white dark:text-foreground rounded-xl text-xs font-semibold disabled:opacity-50 transition-opacity"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Tạo nhóm'}
                    </Button>
                    <Button
                      variant="ghost"
                      onPress={() => { setShowAddGroup(false); setNewGroupName(''); setNewItemName(''); }}
                      className="h-auto min-w-0 px-3 py-2 rounded-xl border border-separator text-xs text-muted hover:text-danger transition-colors"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onPress={() => { setShowAddGroup(true); setNewItemGroup(''); setNewItemName(''); }}
                  className="w-full h-auto flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-separator text-xs text-muted hover:border-accent/40 hover:text-foreground transition-colors font-medium"
                >
                  <Plus size={12} /> Thêm nhóm mới
                </Button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-separator shrink-0">
          <Button
            onPress={onClose}
            className="w-full h-auto py-2.5 rounded-xl bg-accent text-white dark:text-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Xong
          </Button>
        </div>
      </div>
    </div>
  );

  return modal;
}
