import { useState, useRef } from 'react';
import { Plus, Check, X, ChevronDown, Trash2, FileSpreadsheet, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import type { InventoryUnit, InventoryCategory } from '../../types';
import InventoryLogList from './InventoryLogList';

const FOOD_UNITS: InventoryUnit[]  = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'xiên', 'thùng', 'phần'];
const EQUIP_UNITS: InventoryUnit[] = ['cái', 'chiếc', 'đôi', 'bộ', 'chai', 'cuộn', 'hộp', 'thùng'];

type InventoryTab = 'food' | 'equipment';

export default function Inventory() {
  const { state, setInventoryItem, createInventoryItem, deleteInventoryItem, updateInventoryUnit, addInventoryLog } = useApp();
  const { inventory, inventoryLogs, currentUser } = state;

  const [activeTab,    setActiveTab]    = useState<InventoryTab>('food');
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

  const unitOptions = activeTab === 'food' ? FOOD_UNITS : EQUIP_UNITS;
  const defaultUnit: InventoryUnit = activeTab === 'food' ? 'kg' : 'cái';

  // Filter items by category (items without category default to 'food')
  const filteredItems = inventory.filter(item =>
    activeTab === 'food'
      ? (!item.category || item.category === 'food')
      : item.category === 'equipment'
  );

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
    const category: InventoryCategory = activeTab;
    createInventoryItem({ name: newName.trim(), current: parseFloat(newCurrent), threshold: parseFloat(newThreshold) || 0, unit: newUnit, category });
    if (currentUser) {
      addInventoryLog({
        id: Date.now(), itemId: Date.now() + 1, itemName: newName.trim(),
        qty: parseFloat(newCurrent), unit: newUnit, action: 'created',
        festivalId: null, festivalName: 'Kho',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    setNewName(''); setNewCurrent(''); setNewThreshold(''); setNewUnit(defaultUnit);
    setShowAddForm(false);
  };

  const handleDelete = (itemId: number, itemName: string) => {
    if (window.confirm(`Xóa "${itemName}"?\nThao tác này không thể hoàn tác.`)) {
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
        const category: InventoryCategory = activeTab;
        rows.forEach((row, i) => {
          const nameRaw = String(row[0] ?? '').trim();
          if (!nameRaw || (i === 0 && isNaN(Number(row[1])))) return;
          const current = parseFloat(String(row[1] ?? '0')) || 0;
          createInventoryItem({ name: nameRaw, current, threshold: 0, unit: 'cái', category });
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

  const handleTabChange = (tab: InventoryTab) => {
    setActiveTab(tab);
    setShowAddForm(false);
    setEditingId(null);
    setUnitMenuId(null);
    setNewUnit(tab === 'food' ? 'kg' : 'cái');
  };

  return (
    <div className="space-y-4 pb-20" onClick={() => setUnitMenuId(null)}>
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Kho hàng</h1>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        {([
          { id: 'food' as InventoryTab, label: 'Thực phẩm' },
          { id: 'equipment' as InventoryTab, label: 'Trang thiết bị' },
        ]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
              {activeTab === id
                ? filteredItems.length
                : inventory.filter(item =>
                    id === 'food'
                      ? (!item.category || item.category === 'food')
                      : item.category === 'equipment'
                  ).length}
            </span>
          </button>
        ))}
      </div>

      {/* Hướng dẫn import */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-xs text-green-700 dark:text-green-400">
        <Upload size={11} className="inline mr-1" />
        File Excel: 2 cột <strong>Tên | Số lượng</strong> — đơn vị chỉnh trong app sau
      </div>

      {/* Form thêm */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 shadow-sm space-y-3" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {activeTab === 'food' ? 'Thêm thực phẩm mới' : 'Thêm trang thiết bị mới'}
            </p>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400"><X size={16} /></button>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {activeTab === 'food' ? 'Tên thực phẩm' : 'Tên trang thiết bị'}
            </label>
            <input required className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              placeholder={activeTab === 'food' ? 'VD: Thịt bò' : 'VD: Găng tay'}
              value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Số lượng</label>
              <input type="number" min="0" step="0.1" required
                className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                value={newCurrent} onChange={e => setNewCurrent(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Cảnh báo</label>
              <input type="number" min="0" step="0.1"
                className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                placeholder="0"
                value={newThreshold} onChange={e => setNewThreshold(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Đơn vị</label>
              <select className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm"
                value={newUnit} onChange={e => setNewUnit(e.target.value as InventoryUnit)}>
                {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm">Thêm</button>
        </form>
      )}

      {/* Danh sách */}
      <div className="space-y-2">
        {filteredItems.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            {activeTab === 'food' ? 'Chưa có thực phẩm nào' : 'Chưa có trang thiết bị nào'}
          </p>
        )}
        {filteredItems.map(item => {
          const isLow  = item.current < item.threshold;
          const isWarn = !isLow && item.current < item.threshold * 1.5;
          const bg = isLow
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : isWarn
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700';
          const currentUnitOptions = item.category === 'equipment' ? EQUIP_UNITS : FOOD_UNITS;

          return (
            <div key={item.id} className={`rounded-xl shadow-sm border ${bg} flex items-stretch`} onClick={e => e.stopPropagation()}>
              <div className="flex-1 p-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isLow ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{item.name}</p>
                    {isLow && <p className="text-xs text-red-500">Sắp hết hàng!</p>}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === item.id ? (
                      <>
                        <input type="number" min="0" step="0.1" autoFocus
                          className="w-16 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm text-right"
                          value={editQty} onChange={e => setEditQty(e.target.value)} />
                        <select
                          className="border border-gray-300 dark:border-slate-600 rounded-lg px-1 py-1 text-sm bg-white dark:bg-slate-700 dark:text-gray-100"
                          value={editUnit} onChange={e => setEditUnit(e.target.value as InventoryUnit)}>
                          {currentUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <button onClick={() => handleSaveEdit(item.id, item.name)} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded">
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`text-sm font-semibold ${isLow ? 'text-red-600' : isWarn ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-200'}`}
                          onClick={() => startEdit(item.id, item.current, item.unit)}
                        >
                          {item.current}
                        </button>
                        <div className="relative">
                          <button
                            className="flex items-center gap-0.5 text-sm text-gray-500 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-1 py-0.5 rounded transition"
                            onClick={e => { e.stopPropagation(); setUnitMenuId(unitMenuId === item.id ? null : item.id); }}
                          >
                            {item.unit}<ChevronDown size={11} />
                          </button>
                          {unitMenuId === item.id && (
                            <div className="absolute right-0 top-7 z-20 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg py-1 min-w-[80px]">
                              {currentUnitOptions.map(u => (
                                <button key={u}
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${u === item.unit ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}
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
                  className="px-3 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-l border-gray-100 dark:border-slate-700 transition-colors rounded-r-xl"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <InventoryLogList logs={inventoryLogs} />
    </div>
  );
}
