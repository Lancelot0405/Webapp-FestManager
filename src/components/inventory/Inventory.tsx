// =============================================================================
// src/components/inventory/Inventory.tsx
// =============================================================================

import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { InventoryUnit } from '../../types';
import InventoryLogList from './InventoryLogList';

const UNITS: InventoryUnit[] = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'xiên', 'thùng', 'phần'];

export default function Inventory() {
  const { state, setInventoryItem, createInventoryItem, addInventoryLog } = useApp();
  const { inventory, inventoryLogs, currentUser } = state;
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCurrent, setNewCurrent] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newUnit, setNewUnit] = useState<InventoryUnit>('kg');

  const handleSaveEdit = (itemId: number, itemName: string, unit: InventoryUnit) => {
    const qty = parseFloat(editQty);
    if (isNaN(qty) || qty < 0) return;
    setInventoryItem(itemId, qty);
    if (currentUser) {
      addInventoryLog({
        id: Date.now(),
        itemId,
        itemName,
        qty,
        unit,
        action: 'set',
        festivalId: null,
        festivalName: 'Kiểm kho tổng',
        timestamp: new Date().toLocaleString('fr-FR', { hour12: false }).replace(',', ''),
        submittedBy: currentUser.name,
      });
    }
    setEditingId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCurrent || !newThreshold) return;
    const itemData = {
      name: newName.trim(),
      current: parseFloat(newCurrent),
      threshold: parseFloat(newThreshold),
      unit: newUnit,
    };
    createInventoryItem(itemData);
    if (currentUser) {
      addInventoryLog({
        id: Date.now(),
        itemId: Date.now() + 1,
        itemName: newName.trim(),
        qty: parseFloat(newCurrent),
        unit: newUnit,
        action: 'created',
        festivalId: null,
        festivalName: 'Kho',
        timestamp: new Date().toLocaleString('fr-FR', { hour12: false }).replace(',', ''),
        submittedBy: currentUser.name,
      });
    }
    setNewName('');
    setNewCurrent('');
    setNewThreshold('');
    setNewUnit('kg');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Kho hàng</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
        >
          <Plus size={16} />
          Thêm mặt hàng
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm space-y-3"
        >
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800 text-sm">Thêm mặt hàng mới</p>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Tên mặt hàng</label>
            <input
              required
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="VD: Thịt bò"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 font-medium">Số lượng hiện tại</label>
              <input
                type="number" min="0" step="0.1" required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={newCurrent}
                onChange={e => setNewCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Ngưỡng cảnh báo</label>
              <input
                type="number" min="0" step="0.1" required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={newThreshold}
                onChange={e => setNewThreshold(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Đơn vị</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={newUnit}
              onChange={e => setNewUnit(e.target.value as InventoryUnit)}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm"
          >
            Thêm
          </button>
        </form>
      )}

      {/* Inventory list */}
      <div className="space-y-2">
        {inventory.map(item => {
          const isLow = item.current < item.threshold;
          const isWarn = !isLow && item.current < item.threshold * 1.5;
          const bg = isLow
            ? 'bg-red-50 border-red-200'
            : isWarn
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-white border-gray-100';

          return (
            <div key={item.id} className={`rounded-xl p-3 shadow-sm border ${bg}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                  {isLow && <p className="text-xs text-red-500">Sắp hết hàng!</p>}
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && editingId === item.id ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right"
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        autoFocus
                      />
                      <span className="text-xs text-gray-500">{item.unit}</span>
                      <button
                        onClick={() => handleSaveEdit(item.id, item.name, item.unit)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <button
                      className={`text-sm font-semibold ${isLow ? 'text-red-600' : isWarn ? 'text-yellow-600' : 'text-gray-700'}`}
                      onClick={() => {
                        if (!canEdit) return;
                        setEditingId(item.id);
                        setEditQty(String(item.current));
                      }}
                      disabled={!canEdit}
                    >
                      {item.current} / {item.threshold} {item.unit}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory logs */}
      <InventoryLogList logs={inventoryLogs.slice(0, 10)} />
    </div>
  );
}
