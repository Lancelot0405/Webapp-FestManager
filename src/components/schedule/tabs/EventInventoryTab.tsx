import { useState } from 'react';
import { Check, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import type { FestivalEvent, InventoryUnit } from '../../../types';

const UNITS: InventoryUnit[] = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'xiên', 'thùng', 'phần'];

interface Props { event: FestivalEvent; }

const inputCls =
  'border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] ' +
  'text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]/50 transition-all';

export default function EventInventoryTab({ event }: Props) {
  const { state, setInventoryItem, updateInventoryUnit, addInventoryLog,
          createInventoryItem, deleteInventoryItem } = useApp();
  const { inventory, currentUser } = state;

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
    setInventoryItem(itemId, qty);
    const prevUnit = inventory.find(i => i.id === itemId)?.unit;
    if (editUnit !== prevUnit) updateInventoryUnit(itemId, editUnit);
    if (currentUser) {
      addInventoryLog({
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
    createInventoryItem({ name: newName.trim(), current: parseFloat(newCurrent), threshold: parseFloat(newThreshold) || 0, unit: newUnit });
    if (currentUser) {
      addInventoryLog({
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
      deleteInventoryItem(itemId);
    }
  };

  return (
    <div className="space-y-4" onClick={() => setUnitMenuId(null)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--text-muted)]">Tồn kho — bấm số lượng để chỉnh sửa</p>
        <button
          onClick={e => { e.stopPropagation(); setShowAdd(true); }}
          className="flex items-center gap-1 text-[var(--primary)] text-sm font-semibold"
        >
          <Plus size={15} /> Thêm
        </button>
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
            <button type="button" onClick={() => setShowAdd(false)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
              <X size={16} />
            </button>
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] font-semibold">Tên mặt hàng</label>
            <input
              required
              className={`mt-1 w-full ${inputCls}`}
              placeholder="VD: Thịt bò"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-[var(--text-secondary)] font-semibold">Số lượng</label>
              <input
                type="number" min="0" step="0.1" required
                className={`mt-1 w-full ${inputCls}`}
                value={newCurrent}
                onChange={e => setNewCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] font-semibold">Cảnh báo</label>
              <input
                type="number" min="0" step="0.1"
                className={`mt-1 w-full ${inputCls}`}
                placeholder="0"
                value={newThreshold}
                onChange={e => setNewThreshold(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] font-semibold">Đơn vị</label>
              <select
                className={`mt-1 w-full ${inputCls}`}
                value={newUnit}
                onChange={e => setNewUnit(e.target.value as InventoryUnit)}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[var(--primary)] text-[var(--background)] font-semibold py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Thêm
          </button>
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
                          <input
                            type="number" min="0" step="0.1" autoFocus
                            className="w-16 border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] rounded-lg px-2 py-1 text-sm text-right focus:outline-none"
                            value={editQty}
                            onChange={e => setEditQty(e.target.value)}
                          />
                          <select
                            className="border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] rounded-lg px-1 py-1 text-sm focus:outline-none"
                            value={editUnit}
                            onChange={e => setEditUnit(e.target.value as InventoryUnit)}
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button
                            onClick={() => handleSave(item.id, item.name)}
                            className="p-1 text-[var(--success)] hover:bg-[var(--success)]/10 rounded transition-colors"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-[var(--text-muted)] hover:bg-[var(--glass-bg)] rounded transition-colors"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={`text-sm font-bold ${isLow ? 'text-[var(--danger)]' : isWarn ? 'text-indigo-400' : 'text-[var(--primary)]'}`}
                            onClick={() => startEdit(item.id, item.current, item.unit)}
                          >
                            {item.current}
                          </button>
                          <div className="relative">
                            <button
                              className="flex items-center gap-0.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1 py-0.5 rounded transition-colors"
                              onClick={e => { e.stopPropagation(); setUnitMenuId(unitMenuId === item.id ? null : item.id); }}
                            >
                              {item.unit}<ChevronDown size={11} />
                            </button>
                            {unitMenuId === item.id && (
                              <div className="absolute right-0 top-7 z-20 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-xl shadow-lg py-1 min-w-[80px]">
                                {UNITS.map(u => (
                                  <button
                                    key={u}
                                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--glass-bg)] transition-colors ${u === item.unit ? 'text-[var(--primary)] font-semibold' : 'text-[var(--text-primary)]'}`}
                                    onClick={() => { updateInventoryUnit(item.id, u); setUnitMenuId(null); }}
                                  >
                                    {u}
                                  </button>
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
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="px-3 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 border-l border-[var(--glass-border)] transition-colors rounded-r-xl"
                  >
                    <Trash2 size={15} />
                  </button>
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
