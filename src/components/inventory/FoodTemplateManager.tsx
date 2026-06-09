import { useState, useEffect } from 'react';
import { X, Trash2, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FoodTemplate {
  id: number;
  name: string;
  group_name: string;
  item_type: string;
  sort_order: number;
}

interface Props {
  itemType: 'food' | 'equipment';
  onClose: () => void;
  onChanged: () => void; // callback để reload templates ở FoodNameSelect
}

export default function FoodTemplateManager({ itemType, onClose, onChanged }: Props) {
  const [templates, setTemplates]   = useState<FoodTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemGroup, setNewItemGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('food_templates')
      .select('*')
      .eq('item_type', itemType)
      .order('group_name')
      .order('sort_order');
    setTemplates(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [itemType]);

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
      .select()
      .single();
    if (data) setTemplates(prev => [...prev, data]);
    setNewItemName('');
    setNewItemGroup('');
    setSaving(false);
    onChanged();
  };

  const handleAddGroup = async () => {
    const name = newItemName.trim();
    const group = newGroupName.trim();
    if (!name || !group) return;
    setSaving(true);
    const { data } = await supabase
      .from('food_templates')
      .insert({ name, group_name: group, item_type: itemType, sort_order: 10 })
      .select()
      .single();
    if (data) {
      setTemplates(prev => [...prev, data]);
      setOpenGroup(group);
    }
    setNewItemName('');
    setNewGroupName('');
    setShowAddGroup(false);
    setSaving(false);
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[calc(85vh-4rem)] sm:max-h-[85vh] mb-16 sm:mb-0">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
            Quản lý mẫu tên — {itemType === 'food' ? 'Thực phẩm' : 'Thiết bị'}
          </h2>
          <button onClick={onClose} aria-label="Đóng" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden">
                  {/* Group header */}
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span>{group} <span className="font-normal text-gray-400">({items.length})</span></span>
                    {openGroup === group ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {openGroup === group && (
                    <div className="p-3 bg-white dark:bg-slate-800 space-y-2">
                      {/* Item list with delete */}
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(t => (
                          <div key={t.id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-700 dark:text-gray-200">
                            {t.name}
                            <button
                              type="button"
                              aria-label={`Xóa ${t.name}`}
                              onClick={() => handleDelete(t.id)}
                              disabled={deletingId === t.id}
                              className="ml-0.5 text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                            >
                              {deletingId === t.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <X size={11} />
                              }
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add item to this group */}
                      {newItemGroup === group ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            autoFocus
                            className="flex-1 border border-blue-300 dark:border-blue-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tên sản phẩm mới..."
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(group); } if (e.key === 'Escape') { setNewItemGroup(''); setNewItemName(''); } }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddItem(group)}
                            disabled={saving || !newItemName.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                          >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : 'Thêm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setNewItemGroup(''); setNewItemName(''); }}
                            className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setNewItemGroup(group); setNewItemName(''); setShowAddGroup(false); }}
                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
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
                <div className="border border-dashed border-blue-300 dark:border-blue-600 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tạo nhóm mới</p>
                  <input
                    autoFocus
                    className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tên nhóm (VD: Đồ uống)"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                  />
                  <input
                    className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Tạo nhóm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddGroup(false); setNewGroupName(''); setNewItemName(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-500"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowAddGroup(true); setNewItemGroup(''); setNewItemName(''); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-slate-500 text-xs text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus size={12} /> Thêm nhóm mới
                </button>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
