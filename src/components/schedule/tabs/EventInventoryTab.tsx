import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, ChevronDown, Plus, Trash2, Package } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
        <p className="text-sm text-muted-foreground">Tồn kho — bấm số lượng để chỉnh sửa</p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdd(true)}
          className="h-auto min-w-0 p-0 flex items-center gap-1 text-accent hover:text-accent/90 hover:bg-transparent text-sm font-semibold"
        >
          <Plus size={15} /> Thêm
        </Button>
      </div>

      {/* Form thêm */}
      {showAdd && (
        <form
          onSubmit={handleAddItem}
          className="bg-surface border border-border rounded-xl shadow-sm p-4 space-y-3"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <p className="font-semibold text-foreground text-sm">Thêm mặt hàng mới</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdd(false)}
              aria-label="Đóng"
              className="h-7 w-7 p-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="w-full flex flex-col gap-1">
            <Label htmlFor="item-name" className="text-xs font-medium text-foreground/80">Tên mặt hàng</Label>
            <Input id="item-name" placeholder="VD: Thịt bò" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="item-qty" className="text-xs font-medium text-foreground/80">Số lượng</Label>
              <Input id="item-qty" type="number" min={0} step={0.1} value={newCurrent} onChange={(e) => setNewCurrent(e.target.value)} required />
            </div>
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="item-threshold" className="text-xs font-medium text-foreground/80">Cảnh báo</Label>
              <Input id="item-threshold" type="number" min={0} step={0.1} placeholder="0" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} />
            </div>
            <div className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Đơn vị</Label>
              <Select
                value={newUnit}
                onValueChange={(val) => setNewUnit(val as InventoryUnit)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-9 bg-accent text-white dark:text-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Thêm
          </Button>
        </form>
      )}

      {/* Danh sách */}
      {inventory.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title="Chưa có dữ liệu kho" />
      ) : (
        <div className="space-y-2">
          {inventory.map(item => {
            const isLow  = item.current < item.threshold;
            const isWarn = !isLow && item.current < item.threshold * 1.5;
            const extraCls = isLow
              ? '!bg-danger/5 !border-danger/30'
              : isWarn
              ? '!bg-indigo-500/5 !border-indigo-500/30'
              : '';

            return (
              <Card
                key={item.id}
                className={`flex flex-row items-stretch p-0 overflow-hidden border shadow-sm bg-surface ${extraCls}`}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isLow ? 'text-danger' : 'text-foreground'}`}>
                        {item.name}
                      </p>
                      {isLow && <p className="text-xs text-danger font-medium mt-0.5">Sắp hết hàng!</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === item.id ? (
                        <>
                          <div className="w-16 flex flex-col gap-1">
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              autoFocus
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="h-8 rounded-lg px-2 py-1 text-right"
                            />
                          </div>
                          <div className="w-20 flex flex-col gap-1">
                            <Select
                              value={editUnit}
                              onValueChange={(val) => setEditUnit(val as InventoryUnit)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs px-2 py-0">
                                <SelectValue placeholder="Đơn vị" />
                              </SelectTrigger>
                              <SelectContent>
                                {UNIT_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleSave(item.id, item.name)}
                            aria-label="Lưu"
                            className="h-8 w-8 p-0 text-success hover:bg-success/10 rounded transition-colors flex items-center justify-center"
                          >
                            <Check size={15} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            aria-label="Hủy"
                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted/30 rounded transition-colors flex items-center justify-center"
                          >
                            <X size={15} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            className={`h-auto min-w-0 p-0 text-sm font-bold hover:bg-transparent ${isLow ? 'text-danger' : isWarn ? 'text-indigo-400' : 'text-accent'}`}
                            onClick={() => startEdit(item.id, item.current, item.unit)}
                          >
                            {item.current}
                          </Button>
                          <div className="relative">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-auto min-w-0 flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground px-1 py-0.5 rounded transition-colors"
                              onClick={() => setUnitMenuId(unitMenuId === item.id ? null : item.id)}
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
                                  className="absolute right-0 top-7 z-50 bg-surface border border-border rounded-xl shadow-xl py-1 min-w-[80px]"
                                >
                                  {UNITS.map(u => (
                                    <Button
                                      type="button"
                                      key={u}
                                      variant="ghost"
                                      className={`w-full h-auto min-w-0 justify-start text-left px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors ${u === item.unit ? 'text-accent font-semibold' : 'text-foreground'}`}
                                      onClick={() => { updateInventoryUnitMutation.mutate({ itemId: item.id, unit: u }); setUnitMenuId(null); }}
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
                    type="button"
                    variant="ghost"
                    onClick={() => handleDelete(item.id, item.name)}
                    aria-label="Xóa"
                    className="h-auto min-w-0 px-3 text-muted-foreground hover:text-danger hover:bg-danger/10 border-l border-border transition-colors rounded-r-xl rounded-l-none flex items-center justify-center"
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Báo cáo cuối sự kiện */}
      {event.inventoryReported.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Báo cáo cuối sự kiện</p>
          <div className="space-y-2">
            {event.inventoryReported.map((item, i) => (
              <Card key={i} className="p-3 flex flex-row justify-between items-center border shadow-sm bg-surface">
                <p className="text-sm text-foreground font-medium">{item.name}</p>
                <span className="text-sm text-muted-foreground">{item.current} {item.unit}</span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
