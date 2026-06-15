import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button, TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { useApp } from '../../../context/AppContext';
import { useInventoryQuery } from '../../../hooks/queries/useInventoryQuery';
import { useSetInventoryItem } from '../../../hooks/queries/mutations/useSetInventoryItem';
import { useUpdateInventoryUnit } from '../../../hooks/queries/mutations/useUpdateInventoryUnit';
import { useCreateInventoryItem } from '../../../hooks/queries/mutations/useCreateInventoryItem';
import { useDeleteInventoryItem } from '../../../hooks/queries/mutations/useDeleteInventoryItem';
import { useAddInventoryLog } from '../../../hooks/queries/mutations/useAddInventoryLog';
import type { FestivalEvent, InventoryUnit } from '../../../types';

const UNITS: InventoryUnit[] = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'xiên', 'thùng', 'phần'];
const UNIT_OPTIONS = UNITS.map(u => ({ value: u, label: u }));

interface Props { event: FestivalEvent; }

export default function EventInventoryTab({ event }: Props) {
  const { currentUser } = useApp();
  const { data: allInventory = [] } = useInventoryQuery();
  const inventory = allInventory.filter(
    i => i.category === 'festival-food' || i.category === 'festival-equipment'
  );
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
    createInventoryItemMutation.mutate({ name: newName.trim(), current: parseFloat(newCurrent), threshold: parseFloat(newThreshold) || 0, unit: newUnit, category: 'festival-food' });
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
        <p className="text-sm text-muted">Tồn kho — bấm số lượng để chỉnh sửa</p>
        <Button
          variant="ghost"
          onPress={() => setShowAdd(true)}
          className="h-auto min-w-0 p-0 flex items-center gap-1 text-accent text-sm font-semibold"
        >
          <Plus size={15} /> Thêm
        </Button>
      </div>

      {/* Form thêm */}
      {showAdd && (
        <form
          onSubmit={handleAddItem}
          className="bg-surface border border-separator rounded-xl shadow-sm p-4 space-y-3"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <p className="font-semibold text-foreground text-sm">Thêm mặt hàng mới</p>
            <Button isIconOnly variant="ghost" onPress={() => setShowAdd(false)} aria-label="Đóng" className="h-auto min-w-0 p-0 text-muted hover:text-danger transition-colors">
              <X size={16} />
            </Button>
          </div>
          <TextField value={newName} onChange={setNewName} isRequired className="w-full flex flex-col gap-1">
            <Label className="text-xs font-medium text-foreground/80">Tên mặt hàng</Label>
            <Input placeholder="VD: Thịt bò" />
          </TextField>
          <div className="grid grid-cols-3 gap-2">
            <TextField value={newCurrent} onChange={setNewCurrent} isRequired className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Số lượng</Label>
              <Input type="number" min={0} step={0.1} />
            </TextField>
            <TextField value={newThreshold} onChange={setNewThreshold} className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Cảnh báo</Label>
              <Input type="number" min={0} step={0.1} placeholder="0" />
            </TextField>
            <Select value={newUnit || null} onChange={(key) => setNewUnit(key != null ? String(key) as InventoryUnit : 'kg')} className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Đơn vị</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {UNIT_OPTIONS.map(opt => (
                    <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>{opt.label}<ListBox.ItemIndicator /></ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full h-auto bg-accent text-white dark:text-foreground font-semibold py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Thêm
          </Button>
        </form>
      )}

      {/* Danh sách */}
      {inventory.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">Chưa có dữ liệu kho</p>
      ) : (
        <div className="space-y-2">
          {inventory.map(item => {
            const isLow  = item.current < item.threshold;
            const isWarn = !isLow && item.current < item.threshold * 1.5;
            const rowCls = isLow
              ? 'bg-danger/5 border border-danger/30 backdrop-blur-xl'
              : isWarn
              ? 'bg-indigo-500/5 border border-indigo-500/30 backdrop-blur-xl'
              : 'bg-surface border border-separator rounded-xl';

            return (
              <div
                key={item.id}
                className={`rounded-xl flex items-stretch ${rowCls}`}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isLow ? 'text-danger' : 'text-foreground'}`}>
                        {item.name}
                      </p>
                      {isLow && <p className="text-xs text-danger">Sắp hết hàng!</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === item.id ? (
                        <>
                          <TextField value={editQty} onChange={setEditQty} autoFocus className="w-16 flex flex-col gap-1">
                            <Input type="number" min={0} step={0.1} className="h-8 rounded-lg px-2 py-1 text-right" />
                          </TextField>
                          <Select value={editUnit || null} onChange={(key) => setEditUnit(key != null ? String(key) as InventoryUnit : 'kg')} className="w-20 flex flex-col gap-1">
                            <Select.Trigger className="h-8 text-xs py-0"><Select.Value /><Select.Indicator /></Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                {UNIT_OPTIONS.map(opt => (
                                  <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>{opt.label}<ListBox.ItemIndicator /></ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                          <Button
                            isIconOnly
                            variant="ghost"
                            onPress={() => handleSave(item.id, item.name)}
                            aria-label="Lưu"
                            className="h-auto min-w-0 p-1 text-success hover:bg-success/10 rounded transition-colors"
                          >
                            <Check size={15} />
                          </Button>
                          <Button
                            isIconOnly
                            variant="ghost"
                            onPress={() => setEditingId(null)}
                            aria-label="Hủy"
                            className="h-auto min-w-0 p-1 text-muted hover:bg-default/50 rounded transition-colors"
                          >
                            <X size={15} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className={`h-auto min-w-0 p-0 text-sm font-bold ${isLow ? 'text-danger' : isWarn ? 'text-indigo-400' : 'text-accent'}`}
                            onPress={() => startEdit(item.id, item.current, item.unit)}
                          >
                            {item.current}
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              className="h-auto min-w-0 flex items-center gap-0.5 text-sm text-muted hover:text-foreground px-1 py-0.5 rounded transition-colors"
                              onPress={() => setUnitMenuId(unitMenuId === item.id ? null : item.id)}
                            >
                              {item.unit}<ChevronDown size={11} />
                            </Button>
                            <AnimatePresence>
                              {unitMenuId === item.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.15, ease: 'easeOut' }}
                                  className="absolute right-0 top-7 z-50 bg-surface border border-separator rounded-xl shadow-xl py-1 min-w-[80px]"
                                >
                                  {UNITS.map(u => (
                                    <Button
                                      key={u}
                                      variant="ghost"
                                      className={`w-full h-auto min-w-0 justify-start text-left px-3 py-1.5 text-sm hover:bg-default/50 transition-colors ${u === item.unit ? 'text-accent font-semibold' : 'text-foreground'}`}
                                      onPress={() => { updateInventoryUnitMutation.mutate({ itemId: item.id, unit: u }); setUnitMenuId(null); }}
                                    >
                                      {u}
                                    </Button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
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
                    className="h-auto min-w-0 px-3 text-muted hover:text-danger hover:bg-danger/10 border-l border-separator transition-colors rounded-r-xl rounded-l-none"
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
          <p className="text-sm font-semibold text-foreground mb-2">Báo cáo cuối sự kiện</p>
          <div className="space-y-2">
            {event.inventoryReported.map((item, i) => (
              <div key={i} className="bg-surface border border-separator rounded-xl shadow-sm p-3 flex justify-between items-center">
                <p className="text-sm text-foreground">{item.name}</p>
                <span className="text-sm text-muted">{item.current} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
