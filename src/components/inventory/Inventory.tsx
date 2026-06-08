import { useState, useRef } from 'react';
import { Plus, X, Trash2, FileSpreadsheet, Upload, Check, ChevronDown, ChevronUp, History, Store, Tent } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import type { InventoryUnit, InventoryCategory, InventoryItem } from '../../types';
import InventoryLogList from './InventoryLogList';

const FOOD_UNITS: InventoryUnit[]  = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'xiên', 'thùng', 'phần'];
const EQUIP_UNITS: InventoryUnit[] = ['cái', 'chiếc', 'đôi', 'bộ', 'chai', 'cuộn', 'hộp', 'thùng'];

type MainTab = 'restaurant' | 'festival';
type SubTab  = 'food' | 'equipment';

// Resolve which InventoryCategory to save given current selection
function getCategory(main: MainTab, sub: SubTab): InventoryCategory {
  if (main === 'restaurant') return sub === 'food' ? 'restaurant-food' : 'restaurant-equipment';
  return sub === 'food' ? 'festival-food' : 'festival-equipment';
}

// Filter predicate: includes legacy 'food'/'equipment' in restaurant section
function matchCategory(item: InventoryItem, main: MainTab, sub: SubTab): boolean {
  const c = item.category;
  if (main === 'restaurant' && sub === 'food')
    return !c || c === 'food' || c === 'restaurant-food';
  if (main === 'restaurant' && sub === 'equipment')
    return c === 'equipment' || c === 'restaurant-equipment';
  if (main === 'festival' && sub === 'food')
    return c === 'festival-food';
  return c === 'festival-equipment';
}

export default function Inventory() {
  const { state, createInventoryItem, deleteInventoryItem, updateInventoryItem, addInventoryLog } = useApp();
  const { inventory, inventoryLogs, currentUser } = state;

  const [mainTab,       setMainTab]       = useState<MainTab>('restaurant');
  const [subTab,        setSubTab]        = useState<SubTab>('food');
  const [expandedId,    setExpandedId]    = useState<number | null>(null);
  const [editName,      setEditName]      = useState('');
  const [editQty,       setEditQty]       = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [editUnit,      setEditUnit]      = useState<InventoryUnit>('kg');
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [newName,       setNewName]       = useState('');
  const [newCurrent,    setNewCurrent]    = useState('');
  const [newThreshold,  setNewThreshold]  = useState('');
  const [newUnit,       setNewUnit]       = useState<InventoryUnit>('kg');
  const [importing,     setImporting]     = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const unitOptions  = subTab === 'equipment' ? EQUIP_UNITS : FOOD_UNITS;
  const defaultUnit: InventoryUnit = subTab === 'equipment' ? 'cái' : 'kg';

  const filteredItems = inventory.filter(item => matchCategory(item, mainTab, subTab));

  const countFor = (m: MainTab, s: SubTab) =>
    inventory.filter(item => matchCategory(item, m, s)).length;

  const openEdit = (item: InventoryItem) => {
    setExpandedId(item.id);
    setEditName(item.name);
    setEditQty(String(item.current));
    setEditThreshold(String(item.threshold));
    setEditUnit(item.unit);
  };
  const closeEdit = () => setExpandedId(null);

  const handleSaveEdit = (item: InventoryItem) => {
    const qty = parseFloat(editQty);
    const thr = parseFloat(editThreshold) || 0;
    if (isNaN(qty) || qty < 0 || !editName.trim()) return;
    updateInventoryItem(item.id, editName.trim(), qty, thr, editUnit);
    if (currentUser && (qty !== item.current || editUnit !== item.unit)) {
      addInventoryLog({
        id: Date.now(), itemId: item.id, itemName: editName.trim(), qty, unit: editUnit,
        action: 'set', festivalId: null, festivalName: 'Kiểm kho tổng',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    setExpandedId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCurrent) return;
    const category = getCategory(mainTab, subTab);
    createInventoryItem({ name: newName.trim(), current: parseFloat(newCurrent), threshold: parseFloat(newThreshold) || 0, unit: newUnit, category });
    if (currentUser) {
      addInventoryLog({
        id: Date.now(), itemId: Date.now() + 1, itemName: newName.trim(),
        qty: parseFloat(newCurrent), unit: newUnit, action: 'created',
        festivalId: null, festivalName: mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    setNewName(''); setNewCurrent(''); setNewThreshold(''); setNewUnit(defaultUnit);
    setShowAddForm(false);
  };

  const handleDelete = (item: InventoryItem) => {
    if (window.confirm(`Xóa "${item.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteInventoryItem(item.id);
      if (expandedId === item.id) setExpandedId(null);
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
        const category = getCategory(mainTab, subTab);
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

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    setSubTab('food');
    setShowAddForm(false);
    setExpandedId(null);
    setShowHistory(false);
    setNewUnit('kg');
  };

  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab);
    setShowAddForm(false);
    setExpandedId(null);
    setNewUnit(tab === 'equipment' ? 'cái' : 'kg');
  };

  const sectionLabel = mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival';
  const itemLabel    = subTab === 'food' ? 'thực phẩm' : 'trang thiết bị';

  return (
    <div className="space-y-4 pb-20">
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
            onClick={() => { setShowAddForm(true); setExpandedId(null); }}
            className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus size={15} /> Thêm
          </button>
        </div>
      </div>

      {/* ── Main tabs: Nhà hàng | Festival ── */}
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => handleMainTabChange('restaurant')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'restaurant'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Store size={14} /> Nhà hàng
        </button>
        <button
          onClick={() => handleMainTabChange('festival')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'festival'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Tent size={14} /> Festival
        </button>
      </div>

      {/* ── Nhà hàng / Festival ── */}
      <>

          {/* Section header chip */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
            mainTab === 'restaurant'
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
              : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800'
          }`}>
            {mainTab === 'restaurant'
              ? <Store size={14} className="text-blue-600 dark:text-blue-400" />
              : <Tent size={14} className="text-purple-600 dark:text-purple-400" />
            }
            <span className={`text-xs font-semibold ${
              mainTab === 'restaurant'
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-purple-700 dark:text-purple-300'
            }`}>
              {sectionLabel}
            </span>
          </div>

          {/* Sub-tabs: Kho | Trang thiết bị */}
          <div className="flex gap-1.5">
            {([
              { id: 'food' as SubTab,      label: 'Kho', count: countFor(mainTab, 'food') },
              { id: 'equipment' as SubTab, label: 'Trang thiết bị', count: countFor(mainTab, 'equipment') },
            ]).map(({ id, label, count }) => {
              const activeColor = mainTab === 'restaurant'
                ? 'bg-blue-600 text-white'
                : 'bg-purple-600 text-white';
              return (
                <button
                  key={id}
                  onClick={() => handleSubTabChange(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    subTab === id
                      ? activeColor
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    subTab === id
                      ? 'bg-white/20 text-white'
                      : 'bg-white dark:bg-slate-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Import hint */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-xs text-green-700 dark:text-green-400">
            <Upload size={11} className="inline mr-1" />
            File Excel: 2 cột <strong>Tên | Số lượng</strong> — đơn vị chỉnh trong app sau
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                  Thêm {itemLabel} — {sectionLabel}
                </p>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400"><X size={16} /></button>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Tên {itemLabel}
                </label>
                <input required className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                  placeholder={subTab === 'food' ? 'VD: Thịt bò' : 'VD: Găng tay'}
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
                    placeholder="0" value={newThreshold} onChange={e => setNewThreshold(e.target.value)} />
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

          {/* Item list */}
          <div className="space-y-2">
            {filteredItems.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                Chưa có {itemLabel} nào trong kho {sectionLabel}
              </p>
            )}
            {filteredItems.map((item: InventoryItem) => {
              const isLow  = item.current < item.threshold;
              const isWarn = !isLow && item.threshold > 0 && item.current < item.threshold * 1.5;
              const isExpanded = expandedId === item.id;
              const currentUnitOpts = (item.category === 'equipment' || item.category === 'restaurant-equipment' || item.category === 'festival-equipment')
                ? EQUIP_UNITS : FOOD_UNITS;
              const bg = isLow
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : isWarn
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700';

              return (
                <div key={item.id} className={`rounded-xl shadow-sm border ${bg} overflow-hidden transition-all`}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => isExpanded ? closeEdit() : openEdit(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isLow ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {item.name}
                      </p>
                      {isLow && <p className="text-xs text-red-500">Sắp hết hàng!</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-sm font-bold ${isLow ? 'text-red-600' : isWarn ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-200'}`}>
                        {item.current} <span className="font-normal text-gray-500 dark:text-gray-300 text-xs">{item.unit}</span>
                      </span>
                      {isExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-slate-700 space-y-3">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Tên</label>
                        <input
                          className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                          value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Số lượng</label>
                          <input type="number" min="0" step="0.1"
                            className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                            value={editQty} onChange={e => setEditQty(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Cảnh báo</label>
                          <input type="number" min="0" step="0.1"
                            className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                            value={editThreshold} onChange={e => setEditThreshold(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Đơn vị</label>
                          <select
                            className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm"
                            value={editUnit} onChange={e => setEditUnit(e.target.value as InventoryUnit)}
                          >
                            {currentUnitOpts.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(item)}
                          className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition"
                        >
                          <Check size={14} /> Lưu
                        </button>
                        <button
                          onClick={closeEdit}
                          className="flex-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 text-sm font-medium py-2 rounded-lg transition"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="px-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Lịch sử (collapsible) ── */}
          {(() => {
            const sectionLogs = inventoryLogs.filter(log => {
              if (mainTab === 'restaurant') {
                return log.festivalName === 'Nhà hàng' || log.festivalName === 'Kiểm kho tổng' ||
                  inventory.find(i => i.id === log.itemId && (!i.category || i.category === 'food' || i.category === 'restaurant-food' || i.category === 'restaurant-equipment' || i.category === 'equipment'));
              }
              return log.festivalName === 'Festival' ||
                inventory.find(i => i.id === log.itemId && (i.category === 'festival-food' || i.category === 'festival-equipment'));
            });
            const accentColor = mainTab === 'restaurant' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
            const borderColor = mainTab === 'restaurant' ? 'border-blue-100 dark:border-blue-800' : 'border-purple-100 dark:border-purple-800';
            const bgColor = mainTab === 'restaurant' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20';
            return (
              <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${bgColor}`}
                >
                  <div className={`flex items-center gap-2 text-sm font-semibold ${accentColor}`}>
                    <History size={14} />
                    Lịch sử
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-slate-700/60 font-bold">
                      {sectionLogs.length}
                    </span>
                  </div>
                  {showHistory
                    ? <ChevronUp size={15} className="text-gray-400" />
                    : <ChevronDown size={15} className="text-gray-400" />
                  }
                </button>
                {showHistory && (
                  <div className="px-3 pb-3 pt-2">
                    <InventoryLogList logs={sectionLogs} />
                  </div>
                )}
              </div>
            );
          })()}
      </>
    </div>
  );
}
