import { useState } from 'react';
import { Check, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../../context/AppContext';
import { useInventoryQuery } from '../../../hooks/queries/useInventoryQuery';
import { useSetInventoryItem } from '../../../hooks/queries/mutations/useSetInventoryItem';
import { useUpdateInventoryUnit } from '../../../hooks/queries/mutations/useUpdateInventoryUnit';
import { useCreateInventoryItem } from '../../../hooks/queries/mutations/useCreateInventoryItem';
import { useDeleteInventoryItem } from '../../../hooks/queries/mutations/useDeleteInventoryItem';
import { useAddInventoryLog } from '../../../hooks/queries/mutations/useAddInventoryLog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { FestivalEvent, InventoryUnit } from '../../../types';

const UNITS: InventoryUnit[] = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'xiên', 'thùng', 'phần'];
const UNIT_OPTIONS = UNITS.map(u => ({ value: u, label: u }));

interface Props { event: FestivalEvent; }

export default function EventInventoryTab({ event }: Props) {
  const { currentUser } = useApp();
  const { data: inventory = [] } = useInventoryQuery();
  const setInventoryItemMutation = useSetInventoryItem();
  const updateInventoryUnitMutation = useUpdateInventoryUnit();
  const createInventoryItemMutation = useCreateInventoryItem();
  const deleteInventoryItemMutation = useDeleteInventoryItem();
  const addInventoryLogMutation = useAddInventoryLog();

  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [editQty,    setEditQty]    = useState('');
  const [editUnit,   setEditUnit]   = useState<InventoryUnit>('kg');
  const [unitMenuId, setUnitMenuId] = useState<number | null>(null);

  const [showAdd,      setShowAdd]      = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newCurrent,   setNewCurrent]   = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newUnit,      setNewUnit]      = useState<InventoryUnit>('kg');

  const startEdit = (id: number, current: number, unit: InventoryUnit) => {
    setEditingId(id); setEditQty(String(current)); setEditUnit(unit); setUnitMenuId(null);
  };

  const handleSave = (itemId: number, itemName: string) => {
    const qty = parseFloat(editQty);
    if (isNaN(qty) || qty < 0) return;
    setInventoryItemMutation.mutate({ itemId, qty });
    const prevUnit = inventory.find(i => i.id === itemId)?.unit;
    if (editUnit !== prevUnit) updateInventoryUnitMutation.mutate({ itemId, unit: editUnit });
    if (currentUser) {
      addInventoryLogMutation.mutate({
        id: new Date().getTime(), itemId, itemName, qty, unit: editUnit,
        action: 'set', festivalId: event.id, festivalName: event.name,
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    setEditingId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCurrent) return;
    createInventoryItemMutation.mutate({ name: newName.trim(), current: parseFloat(newCurrent), threshold: parseFloat(newThreshold) || 0, unit: newUnit });
    if (currentUser) {
      addInventoryLogMutation.mutate({
        id: Date.now(), itemId: Date.now() + 1, itemName: newName.trim(),
        qty: parseFloat(newCurrent), unit: newUnit, action: 'created',
        festivalId: event.id, festivalName: event.name,
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    setNewName(''); setNewCurrent(''); setNewThreshold(''); setNewUnit('kg');
    setShowAdd(false);
  };

  const handleDelete = (itemId: number, itemName: string) => {
    if (window.confirm(`Xóa "${itemName}" khỏi kho hàng?\nThao tác này không thể hoàn tác.`)) {
      deleteInventoryItemMutation.mutate(itemId);
    }
  };

  return (
    <div className="space-y-4" onClick={() => setUnitMenuId(null)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--text-muted)]">Tồn kho — bấm số lượng để chỉnh sửa</p>
        <Button
          variant="ghost"
          onPress={() => setShowAdd(true)}
          className="h-auto min-w-0 p-0 flex items-center gap-1 text-[var(--primary)] text-sm font-semibold"
        >
          <Plus size={15} /> Thêm
        </Button>
      </div>

      {/* Form thêm */}
      {showAdd && (
        <form
          onSubmit={handleAddItem}
          className="glass-card rounded-xl p-4 space-y-3"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <p className="font-semibold text-[var(--text-primary)] text-sm">Thêm mặt hàng mới</p>
            <Button isIconOnly variant="ghost" onPress={() => setShowAdd(false)} aria-label="Đóng" className="h-auto min-w-0 p-0 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
              <X size={16} />
            </Button>
          </div>
          <Input
            label="Tên mặt hàng"
            isRequired
            placeholder="VD: Thịt bò"
            value={newName}
            onChange={setNewName}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number" min={0} step={0.1} isRequired
              label="Số lượng"
              value={newCurrent}
              onChange={setNewCurrent}
            />
            <Input
              type="number" min={0} step={0.1}
              label="Cảnh báo"
              placeholder="0"
              value={newThreshold}
              onChange={setNewThreshold}
            />
            <Select
              label="Đơn vị"
              value={newUnit}
              onChange={(v) => setNewUnit(v as InventoryUnit)}
              options={UNIT_OPTIONS}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-auto bg-[var(--primary)] text-[var(--background)] font-semibold py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Thêm
          </Button>
        </form>
      )}

      {/* Danh sách */}
      {inventory.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">Chưa có dữ liệu kho</p>
      ) : (
        <div className="space-y-2">
          {inventory.map(item => {
            const isLow  = item.current < item.threshold;
            const isWarn = !isLow && item.current < item.threshold * 1.5;
            const rowCls = isLow
              ? 'bg-[var(--danger)]/5 border border-[var(--danger)]/30 backdrop-blur-[var(--glass-blur)]'
              : isWarn
              ? 'bg-indigo-500/5 border border-indigo-500/30 backdrop-blur-[var(--glass-blur)]'
              : 'glass-card';

            return (
              <div
                key={item.id}
                className={`rounded-xl flex items-stretch ${rowCls}`}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isLow ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
                        {item.name}
                      </p>
                      {isLow && <p className="text-xs text-[var(--danger)]">Sắp hết hàng!</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === item.id ? (
                        <>
                          <Input
                            type="number" min={0} step={0.1} autoFocus
                            className="w-16"
                            inputClassName="h-8 rounded-lg px-2 py-1 text-right"
                            value={editQty}
                            onChange={setEditQty}
                          />
                          <Select
                            size="sm"
                            className="w-20"
                            value={editUnit}
                            onChange={(v) => setEditUnit(v as InventoryUnit)}
                            options={UNIT_OPTIONS}
                          />
                          <Button
                            isIconOnly
                            variant="ghost"
                            onPress={() => handleSave(item.id, item.name)}
                            aria-label="Lưu"
                            className="h-auto min-w-0 p-1 text-[var(--success)] hover:bg-[var(--success)]/10 rounded transition-colors"
                          >
                            <Check size={15} />
                          </Button>
                          <Button
                            isIconOnly
                            variant="ghost"
                            onPress={() => setEditingId(null)}
                            aria-label="Hủy"
                            className="h-auto min-w-0 p-1 text-[var(--text-muted)] hover:bg-[var(--glass-bg)] rounded transition-colors"
                          >
                            <X size={15} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className={`h-auto min-w-0 p-0 text-sm font-bold ${isLow ? 'text-[var(--danger)]' : isWarn ? 'text-indigo-400' : 'text-[var(--primary)]'}`}
                            onPress={() => startEdit(item.id, item.current, item.unit)}
                          >
                            {item.current}
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              className="h-auto min-w-0 flex items-center gap-0.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1 py-0.5 rounded transition-colors"
                              onPress={() => setUnitMenuId(unitMenuId === item.id ? null : item.id)}
                            >
                              {item.unit}<ChevronDown size={11} />
                            </Button>
                            {unitMenuId === item.id && (
                              <div className="absolute right-0 top-7 z-20 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-xl shadow-lg py-1 min-w-[80px]">
                                {UNITS.map(u => (
                                  <Button
                                    key={u}
                                    variant="ghost"
                                    className={`w-full h-auto min-w-0 justify-start rounded-none text-left px-3 py-1.5 text-sm hover:bg-[var(--glass-bg)] transition-colors ${u === item.unit ? 'text-[var(--primary)] font-semibold' : 'text-[var(--text-primary)]'}`}
                                    onPress={() => { updateInventoryUnitMutation.mutate({ itemId: item.id, unit: u }); setUnitMenuId(null); }}
                                  >
                                    {u}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {editingId !== item.id && (
                  <Button
                    isIconOnly
                    variant="ghost"
                    onPress={() => handleDelete(item.id, item.name)}
                    aria-label="Xóa"
                    className="h-auto min-w-0 px-3 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 border-l border-[var(--glass-border)] transition-colors rounded-r-xl rounded-l-none"
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Báo cáo cuối sự kiện */}
      {event.inventoryReported.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Báo cáo cuối sự kiện</p>
          <div className="space-y-2">
            {event.inventoryReported.map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-3 flex justify-between items-center">
                <p className="text-sm text-[var(--text-primary)]">{item.name}</p>
                <span className="text-sm text-[var(--text-muted)]">{item.current} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
