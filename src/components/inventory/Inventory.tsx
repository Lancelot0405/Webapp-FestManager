import { useState, useRef } from 'react';
import { Plus, Check, X, ChevronDown, Trash2, FileSpreadsheet, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import type { InventoryUnit } from '../../types';
import InventoryLogList from './InventoryLogList';

const UNITS: InventoryUnit[] = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'xiên', 'thùng', 'phần'];

export default function Inventory() {
  const { state, setInventoryItem, createInventoryItem, deleteInventoryItem, updateInventoryUnit, addInventoryLog } = useApp();
  const { inventory, inventoryLogs, currentUser } = state;

  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [editQty,      setEditQty]      = useState('');
  const [editUnit,     setEditUnit]     = useState<InventoryUnit>('kg');
  const [unitMenuId,   setUnitMenuId]   = useState<number | null>(null);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newCurrent,   setNewCurrent]   = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newUnit,      setNewUnit]      = useState<InventoryUnit>('kg');
  const [importing,    setImporting]    = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const startEdit = (itemId: number, current: number, unit: InventoryUnit) => {
    setEditingId(itemId); setEditQty(String(current)); setEditUnit(unit); setUnitMenuId(null);
  };

  const handleSaveEdit = (itemId: number, itemName: string) => {
    const qty = parseFloat(editQty);
    if (isNaN(qty) || qty < 0) return;
    setInventoryItem(itemId, qty);
    const prevUnit = inventory.find(i => i.id === itemId)?.unit;
    if (editUnit !== prevUnit) updateInventoryUnit(itemId, editUnit);
    if (currentUser) {
      addInventoryLog({
        id: Date.now(), itemId, itemName, qty, unit: editUnit,
        action: 'set', festivalId: null, festivalName: 'Kiểm kho tổng',
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
        festivalId: null, festivalName: 'Kho',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    setNewName(''); setNewCurrent(''); setNewThreshold(''); setNewUnit('kg');
    setShowAddForm(false);
  };

  const handleDelete = (itemId: number, itemName: string) => {
    if (window.confirm(`Xóa mặt hàng "${itemName}"?\nThao tác này không thể hoàn tác.`)) {
      deleteInventoryItem(itemId);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        let imported = 0;
        rows.forEach((row, i) => {
          const nameRaw = String(row[0] ?? '').trim();
          if (!nameRaw || (i === 0 && isNaN(Number(row[1])))) return;
          const current = parseFloat(String(row[1] ?? '0')) || 0;
          createInventoryItem({ name: nameRaw, current, threshold: 0, unit: 'cái' });
          imported++;
        });
        alert(`Đã import ${imported} mặt hàng thành công.`);
      } catch (err: any) {
        alert(`Lỗi đọc file: ${err?.message ?? 'Không thể đọc file này.'}`);
      } finally {
        setImporting(false);
        if (importRef.current) importRef.current.value = '';
      }
    };
    reader.onerror = () => { alert('Không thể đọc file.'); setImporting(false); };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4 pb-20" onClick={() => setUnitMenuId(null)}>
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800">Kho hàng</h1>
        <div className="flex gap-2">
          <label className={`flex items-center gap-1 bg-green-600 text-white text-sm font-medium px-3 py-2 rounded-lg cursor-pointer ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
            <FileSpreadsheet size={15} />
            {importing ? 'Đang import...' : 'Import'}
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={e => { e.stopPropagation(); setShowAddForm(true); }}
            className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus size={15} /> Thêm
          </button>
        </div>
      </div>

      {/* Hướng dẫn import */}
      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
        <Upload size={11} className="inline mr-1" />
        File Excel: 2 cột <strong>Tên | Số lượng</strong> — đơn vị chỉnh trong app sau
      </div>

      {/* Form thêm */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm space-y-3" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800 text-sm">Thêm mặt hàng mới</p>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400"><X size={16} /></button>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Tên mặt hàng</label>
            <input required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="VD: Thịt bò" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-600 font-medium">Số lượng</label>
              <input type="number" min="0" step="0.1" required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={newCurrent} onChange={e => setNewCurrent(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Cảnh báo</label>
              <input type="number" min="0" step="0.1"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="0"
                value={newThreshold} onChange={e => setNewThreshold(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Đơn vị</label>
              <select className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-2 text-sm"
                value={newUnit} onChange={e => setNewUnit(e.target.value as InventoryUnit)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm">Thêm</button>
        </form>
      )}

      {/* Danh sách */}
      <div className="space-y-2">
        {inventory.map(item => {
          const isLow  = item.current < item.threshold;
          const isWarn = !isLow && item.current < item.threshold * 1.5;
          const bg = isLow ? 'bg-red-50 border-red-200' : isWarn ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100';

          return (
            <div key={item.id} className={`rounded-xl shadow-sm border ${bg} flex items-stretch`} onClick={e => e.stopPropagation()}>
              <div className="flex-1 p-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                    {isLow && <p className="text-xs text-red-500">Sắp hết hàng!</p>}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === item.id ? (
                      <>
                        <input type="number" min="0" step="0.1" autoFocus
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right"
                          value={editQty} onChange={e => setEditQty(e.target.value)} />
                        <select className="border border-gray-300 rounded-lg px-1 py-1 text-sm bg-white"
                          value={editUnit} onChange={e => setEditUnit(e.target.value as InventoryUnit)}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <button onClick={() => handleSaveEdit(item.id, item.name)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`text-sm font-semibold ${isLow ? 'text-red-600' : isWarn ? 'text-yellow-600' : 'text-gray-700'}`}
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
                                  onClick={() => { updateInventoryUnit(item.id, u); setUnitMenuId(null); }}>
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
                  className="px-3 text-red-300 hover:text-red-500 hover:bg-red-50 border-l border-gray-100 transition-colors rounded-r-xl"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <InventoryLogList logs={inventoryLogs.slice(0, 10)} />
    </div>
  );
}
