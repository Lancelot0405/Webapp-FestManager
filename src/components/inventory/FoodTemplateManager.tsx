import { useState, useEffect } from 'react';
import { Plus, X, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
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
    if (data) {
      setTemplates(prev => [...prev, data]);
      setExpandedKeys(new Set([group]));
    }
    setNewItemName(''); setNewGroupName(''); setShowAddGroup(false);
    setSaving(false); onChanged();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl p-0 outline-none overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground">
            Quản lý mẫu — {itemType === 'food' ? 'Thực phẩm' : 'Thiết bị'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 overflow-y-auto max-h-[60vh] space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {Object.entries(groups).map(([group, items]) => {
                  const isOpen = expandedKeys.has(group);
                  return (
                    <div key={group} className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setExpandedKeys(prev => {
                            const next = new Set(prev);
                            if (next.has(group)) next.delete(group);
                            else next.add(group);
                            return next;
                          });
                        }}
                        className="w-full h-auto justify-between rounded-none px-3 py-2.5 bg-muted/30 text-xs font-bold text-foreground/80 hover:bg-muted/40 hover:text-foreground transition-colors flex items-center"
                      >
                        <span>{group} <span className="font-normal text-muted-foreground">({items.length})</span></span>
                        <ChevronDown
                          size={13}
                          className={`text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </Button>
                      {isOpen && (
                        <div className="px-3 pb-3 space-y-2 pt-2 border-t border-border bg-muted/5">
                          <div className="flex flex-wrap gap-1.5">
                            {items.map(t => (
                              <Badge key={t.id} variant="secondary" className="text-xs font-semibold py-1 pr-1.5 pl-2.5 rounded-full flex items-center gap-1">
                                {deletingId === t.id ? <Loader2 className="size-3 animate-spin mr-1" /> : t.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => handleDelete(t.id)}
                                  className="h-4 w-4 p-0 rounded-full hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
                                  aria-label={`Xóa ${t.name}`}
                                >
                                  <X size={10} />
                                </Button>
                              </Badge>
                            ))}
                          </div>

                          {newItemGroup === group ? (
                            <div className="flex gap-2 mt-1 items-center">
                              <div className="flex-1 flex flex-col gap-1">
                                <Input
                                  autoFocus
                                  className="h-9 text-xs"
                                  placeholder="Tên sản phẩm mới..."
                                  value={newItemName}
                                  onChange={(e) => setNewItemName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleAddItem(group); }
                                    if (e.key === 'Escape') { setNewItemGroup(''); setNewItemName(''); }
                                  }}
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleAddItem(group)}
                                disabled={saving || !newItemName.trim()}
                                className="h-9 px-3 py-1.5 text-xs font-semibold rounded-xl"
                              >
                                {saving ? <Loader2 className="size-3 animate-spin mr-1" /> : 'Thêm'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => { setNewItemGroup(''); setNewItemName(''); }}
                                aria-label="Hủy"
                                className="h-9 w-9 p-0 rounded-xl border border-border text-xs text-muted-foreground hover:text-danger flex items-center justify-center shrink-0"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => { setNewItemGroup(group); setNewItemName(''); setShowAddGroup(false); }}
                              className="h-auto min-w-0 p-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent font-semibold mt-1"
                            >
                              <Plus size={11} /> Thêm vào nhóm này
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {showAddGroup ? (
                <div className="border border-dashed border-border rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-foreground/80">Tạo nhóm mới</p>
                  <div className="w-full flex flex-col gap-1">
                    <Input className="h-9 text-xs" placeholder="Tên nhóm (VD: Đồ uống)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} autoFocus />
                  </div>
                  <div className="w-full flex flex-col gap-1">
                    <Input
                      className="h-9 text-xs"
                      placeholder="Tên sản phẩm đầu tiên"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGroup(); } }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={handleAddGroup}
                      disabled={saving || !newGroupName.trim() || !newItemName.trim()}
                      className="flex-1 h-9 rounded-xl text-xs font-semibold"
                    >
                      {saving ? <Loader2 className="size-3 animate-spin mr-1" /> : 'Tạo nhóm'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setShowAddGroup(false); setNewGroupName(''); setNewItemName(''); }}
                      className="flex-1 h-9 border border-border text-xs text-muted-foreground hover:text-danger rounded-xl font-semibold transition-colors"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowAddGroup(true); setNewItemGroup(''); setNewItemName(''); }}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground font-semibold"
                >
                  <Plus size={12} /> Thêm nhóm mới
                </Button>
              )}
            </>
          )}
        </div>
        <DialogFooter className="px-5 pb-5 shrink-0 border-t border-border pt-3">
          <Button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl font-semibold"
          >
            Xong
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
