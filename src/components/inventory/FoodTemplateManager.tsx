import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button, Modal, Accordion, TagGroup, Tag, Spinner } from '@heroui/react';
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
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="bottom" size="md">
          <Modal.Dialog aria-label="Quản lý mẫu">
            <Modal.Header className="px-5 pt-5 pb-0">
              <Modal.Heading className="text-sm font-bold text-foreground">
                Quản lý mẫu — {itemType === 'food' ? 'Thực phẩm' : 'Thiết bị'}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-4 overflow-y-auto max-h-[60vh] space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <>
                  <Accordion
                    expandedKeys={expandedKeys}
                    onExpandedChange={(keys) => setExpandedKeys(new Set(keys as Set<string>))}
                  >
                    {Object.entries(groups).map(([group, items]) => (
                      <Accordion.Item key={group} id={group}>
                        <Accordion.Heading>
                          <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-foreground/80">
                            <span>{group} <span className="font-normal text-muted">({items.length})</span></span>
                            <Accordion.Indicator />
                          </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel className="px-3 pb-3 space-y-2">
                          <TagGroup
                            onRemove={(keys) => {
                              const id = Number([...keys][0]);
                              if (!isNaN(id)) handleDelete(id);
                            }}
                          >
                            <TagGroup.List className="flex flex-wrap gap-1.5">
                              {items.map(t => (
                                <Tag key={t.id} id={String(t.id)} className="text-xs">
                                  {deletingId === t.id ? <Spinner size="sm" /> : t.name}
                                  <Tag.RemoveButton aria-label={`Xóa ${t.name}`} />
                                </Tag>
                              ))}
                            </TagGroup.List>
                          </TagGroup>

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
                                className="h-auto min-w-0 px-3 py-1.5 bg-accent text-white dark:text-foreground rounded-xl text-xs font-semibold"
                              >
                                {saving ? <Spinner size="sm" /> : 'Thêm'}
                              </Button>
                              <Button
                                isIconOnly
                                variant="ghost"
                                onPress={() => { setNewItemGroup(''); setNewItemName(''); }}
                                aria-label="Hủy"
                                className="h-auto min-w-0 px-2 py-1.5 rounded-xl border border-separator text-xs text-muted hover:text-danger"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              onPress={() => { setNewItemGroup(group); setNewItemName(''); setShowAddGroup(false); }}
                              className="h-auto min-w-0 p-0 flex items-center gap-1 text-xs text-muted hover:text-foreground font-medium mt-1"
                            >
                              <Plus size={11} /> Thêm vào nhóm này
                            </Button>
                          )}
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>

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
                          className="flex-1 h-auto py-2 bg-accent text-white dark:text-foreground rounded-xl text-xs font-semibold"
                        >
                          {saving ? <Spinner size="sm" /> : 'Tạo nhóm'}
                        </Button>
                        <Button
                          variant="ghost"
                          onPress={() => { setShowAddGroup(false); setNewGroupName(''); setNewItemName(''); }}
                          className="h-auto min-w-0 px-3 py-2 rounded-xl border border-separator text-xs text-muted hover:text-danger"
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      onPress={() => { setShowAddGroup(true); setNewItemGroup(''); setNewItemName(''); }}
                      className="w-full h-auto flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-separator text-xs text-muted hover:border-accent/40 hover:text-foreground font-medium"
                    >
                      <Plus size={12} /> Thêm nhóm mới
                    </Button>
                  )}
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="px-5 pb-5">
              <Button
                onPress={onClose}
                variant="primary"
                fullWidth
                className="rounded-xl"
              >
                Xong
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
