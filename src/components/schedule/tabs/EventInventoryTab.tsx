import { useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import type { FestivalEvent, InventoryUnit } from '../../../types';

const UNITS: InventoryUnit[] = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'xiên', 'thùng', 'phần'];

interface Props { event: FestivalEvent; }

export default function EventInventoryTab({ event }: Props) {
  const { state, setInventoryItem, updateInventoryUnit, addInventoryLog } = useApp();
  const { inventory, currentUser } = state;

  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [editQty,    setEditQty]    = useState('');
  const [editUnit,   setEditUnit]   = useState<InventoryUnit>('kg');
  const [unitMenuId, setUnitMenuId] = useState<number | null>(null);

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
        id: Date.now(), itemId, itemName, qty, unit: editUnit,
        action: 'set',
        festivalId: event.id,
        festivalName: event.name,
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    setEditingId(null);
  };

  const handleQuickUnit = (itemId: number, unit: InventoryUnit) => {
    updateInventoryUnit(itemId, unit);
    setUnitMenuId(null);
  };

  return (
    <div className="space-y-4" onClick={() => setUnitMenuId(null)}>
      <p className="text-sm text-gray-500">Tồn kho — bấm vào số lượng để chỉnh sửa</p>

      {inventory.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu kho</p>
      ) : (
        <div className="space-y-2">
          {inventory.map(item => {
            const isLow  = item.current < item.threshold;
            const isWarn = !isLow && item.current < item.threshold * 1.5;
            const bg     = isLow ? 'bg-red-50 border-red-200' : isWarn ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100';

            return (
              <div key={item.id} className={`rounded-xl p-3 shadow-sm border ${bg}`}
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isLow ? 'text-red-700' : 'text-gray-800'} truncate`}>
                      {item.name}
                    </p>
                    {isLow && <p className="text-xs text-red-500">Sắp hết hàng!</p>}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === item.id ? (
                      <>
                        <input
                          type="number" min="0" step="0.1" autoFocus
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right"
                          value={editQty}
                          onChange={e => setEditQty(e.target.value)}
                        />
                        <select
                          className="border border-gray-300 rounded-lg px-1 py-1 text-sm bg-white"
                          value={editUnit}
                          onChange={e => setEditUnit(e.target.value as InventoryUnit)}
                        >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <button onClick={() => handleSave(item.id, item.name)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`text-sm font-bold ${isLow ? 'text-red-600' : isWarn ? 'text-yellow-600' : 'text-gray-700'}`}
                          onClick={() => startEdit(item.id, item.current, item.unit)}
                        >
                          {item.current}
                        </button>
                        <div className="relative">
                          <button
                            className="flex items-center gap-0.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded transition"
                            onClick={e => { e.stopPropagation(); setUnitMenuId(unitMenuId === item.id ? null : item.id); }}
                          >
                            {item.unit}<ChevronDown size={11} />
                          </button>
                          {unitMenuId === item.id && (
                            <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[80px]">
                              {UNITS.map(u => (
                                <button key={u}
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 ${u === item.unit ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
                                  onClick={() => handleQuickUnit(item.id, u)}
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
            );
          })}
        </div>
      )}

      {/* Báo cáo cuối sự kiện */}
      {event.inventoryReported.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Báo cáo cuối sự kiện</p>
          <div className="space-y-2">
            {event.inventoryReported.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <p className="text-sm text-gray-700">{item.name}</p>
                <span className="text-sm text-gray-500">{item.current} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
