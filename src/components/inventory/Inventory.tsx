import { useState, useRef } from 'react';
import { Plus, X, Trash2, FileSpreadsheet, Upload, Check, ChevronDown, ChevronUp, History, Store, Tent } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';
import { SkeletonList } from '@/components/ui/skeleton';
import type { InventoryUnit, InventoryCategory, InventoryItem } from '../../types';
import InventoryLogList from './InventoryLogList';
import NumberPicker from './NumberPicker';
import FoodNameSelect from './FoodNameSelect';
import { Select } from '@/components/ui/select';
import { Fab } from '@/components/ui/fab';

const FOOD_UNITS: InventoryUnit[]  = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'gói', 'lốc', 'xiên', 'thùng', 'phần', 'con', 'miếng', 'thanh', 'viên', 'lọ', 'bình'];
const EQUIP_UNITS: InventoryUnit[] = ['cái', 'chiếc', 'đôi', 'bộ', 'chai', 'cuộn', 'hộp', 'thùng', 'tấm', 'ổ', 'gói'];

type MainTab = 'restaurant' | 'festival';
type SubTab  = 'food' | 'equipment' | 'history';

function getCategory(main: MainTab, sub: SubTab): InventoryCategory {
  if (main === 'restaurant') return sub === 'food' ? 'restaurant-food' : 'restaurant-equipment';
  return sub === 'food' ? 'festival-food' : 'festival-equipment';
}

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
  const showToast = useToast();
  const { inventory, inventoryLogs, currentUser } = state;

  const dept             = currentUser?.role === 'admin' ? 'both' : (currentUser?.department ?? 'both');
  const canSeeRestaurant = dept === 'restaurant' || dept === 'both';
  const canSeeFestival   = dept === 'festival'   || dept === 'both';
  const defaultTab: MainTab = canSeeRestaurant ? 'restaurant' : 'festival';

  const [mainTab,       setMainTab]       = useState<MainTab>(defaultTab);
  const [subTab,        setSubTab]        = useState<SubTab>('food');
  const [expandedId,    setExpandedId]    = useState<number | null>(null);
  const [editName,      setEditName]      = useState('');
  const [editQty,       setEditQty]       = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [editUnit,      setEditUnit]      = useState<InventoryUnit>('kg');
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newName,       setNewName]       = useState('');
  const [newCurrent,    setNewCurrent]    = useState('');
  const [newThreshold,  setNewThreshold]  = useState('');
  const [newUnit,       setNewUnit]       = useState<InventoryUnit>('kg');
  const [importing,     setImporting]     = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const unitOptions  = subTab === 'equipment' ? EQUIP_UNITS : FOOD_UNITS;
  const defaultUnit: InventoryUnit = subTab === 'equipment' ? 'cái' : 'kg';
  const filteredItems = subTab !== 'history' ? inventory.filter(item => matchCategory(item, mainTab, subTab as 'food' | 'equipment')) : [];
  const countFor = (m: MainTab, s: 'food' | 'equipment') => inventory.filter(item => matchCategory(item, m, s)).length;

  const sectionLogs = inventoryLogs.filter(log => {
    if (mainTab === 'restaurant') {
      return log.festivalName === 'Nhà hàng' || log.festivalName === 'Kiểm kho tổng' ||
        inventory.find(i => i.id === log.itemId && (!i.category || i.category === 'food' || i.category === 'restaurant-food' || i.category === 'restaurant-equipment' || i.category === 'equipment'));
    }
    return log.festivalName === 'Festival' ||
      inventory.find(i => i.id === log.itemId && (i.category === 'festival-food' || i.category === 'festival-equipment'));
  });

  const openEdit = (item: InventoryItem) => {
    setExpandedId(item.id); setEditName(item.name);
    setEditQty(String(item.current)); setEditThreshold(String(item.threshold)); setEditUnit(item.unit);
  };

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
    reader.onload = async (ev) => {
      try {
        const XLSX = await import('xlsx');
        const wb   = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
        let imported = 0;
        const category = getCategory(mainTab, subTab);
        rows.forEach((row, i) => {
          const nameRaw = String(row[0] ?? '').trim();
          if (!nameRaw || (i === 0 && isNaN(Number(row[1])))) return;
          createInventoryItem({ name: nameRaw, current: parseFloat(String(row[1] ?? '0')) || 0, threshold: 0, unit: 'cái', category });
          imported++;
        });
        showToast(`Đã import ${imported} mặt hàng thành công.`, 'success');
      } catch (err) {
        showToast(`Lỗi đọc file: ${getErrorMessage(err, 'Không thể đọc file này.')}`, 'error');
      } finally {
        setImporting(false);
        if (importRef.current) importRef.current.value = '';
      }
    };
    reader.onerror = () => { showToast('Không thể đọc file.', 'error'); setImporting(false); };
    reader.readAsBinaryString(file);
  };

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab); setSubTab('food'); setShowAddForm(false); setExpandedId(null); setNewUnit('kg');
  };
  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab); setShowAddForm(false); setExpandedId(null);
    if (tab !== 'history') setNewUnit(tab === 'equipment' ? 'cái' : 'kg');
  };

  const sectionLabel = mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival';
  const itemLabel    = subTab === 'equipment' ? 'trang thiết bị' : 'thực phẩm';

  const itemCls = (low: boolean, warn: boolean) =>
    low  ? 'bg-[var(--danger)]/5 border border-[var(--danger)]/30 backdrop-blur-[var(--glass-blur)]' :
    warn ? 'bg-indigo-500/5 border border-indigo-500/30 backdrop-blur-[var(--glass-blur)]' :
           'glass-card';

  return (
    <div className="space-y-4 pb-20">

      {/* ── Page header ── */}
      {subTab !== 'history' && (
        <div className="flex justify-end gap-2">
            <label className={`flex items-center gap-1.5 bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:bg-[var(--success)]/20 active:scale-95 transition-all ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
              <FileSpreadsheet size={14} />
              {importing ? 'Đang import...' : 'Import'}
              <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            </label>
            <Button
              onPress={() => { setShowAddForm(true); setExpandedId(null); }}
              variant="primary"
              size="sm"
              className="hidden md:flex items-center gap-1.5 rounded-xl"
            >
              <Plus size={14} /> Thêm
            </Button>
        </div>
      )}
      {subTab !== 'history' && (
        <Fab
          onPress={() => { setShowAddForm(true); setExpandedId(null); }}
          label="Thêm vào kho"
          icon={<Plus size={24} />}
        />
      )}

      {/* ── Main tabs ── */}
      {canSeeRestaurant && canSeeFestival && (
        <div className="flex border-b border-[var(--glass-border)]">
          {([
            { id: 'restaurant' as MainTab, icon: <Store size={14} />,  label: 'Nhà hàng', activeClass: 'text-[var(--primary)] border-[var(--primary)]' },
            { id: 'festival'   as MainTab, icon: <Tent size={14} />,   label: 'Festival',  activeClass: 'text-[var(--success)] border-[var(--success)]' },
          ]).map(t => (
            <Button
              key={t.id}
              onPress={() => handleMainTabChange(t.id)}
              variant="ghost"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold border-b-2 rounded-none h-auto transition-colors ${
                mainTab === t.id ? t.activeClass : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.icon} {t.label}
            </Button>
          ))}
        </div>
      )}

      {/* ── Section chip ── */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
        mainTab === 'restaurant'
          ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20'
          : 'bg-[var(--success)]/5 border-[var(--success)]/20'
      }`}>
        {mainTab === 'restaurant'
          ? <Store size={13} className="text-[var(--primary)]" />
          : <Tent  size={13} className="text-[var(--success)]" />
        }
        <span className={`text-xs font-bold ${mainTab === 'restaurant' ? 'text-[var(--primary)]' : 'text-[var(--success)]'}`}>
          {sectionLabel}
        </span>
      </div>

      {/* ── Sub tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { id: 'food'      as SubTab, label: 'Kho thực phẩm',  count: countFor(mainTab, 'food') },
          { id: 'equipment' as SubTab, label: 'Trang thiết bị', count: countFor(mainTab, 'equipment') },
          { id: 'history'   as SubTab, label: 'Lịch sử',        count: sectionLogs.length },
        ]).map(({ id, label, count }) => {
          const isActive = subTab === id;
          return (
            <Button
              key={id}
              onPress={() => handleSubTabChange(id)}
              variant={isActive ? 'primary' : 'ghost'}
              size="sm"
              className={`flex items-center gap-1.5 rounded-full ${isActive ? '' : 'border border-[var(--glass-border)] hover:border-[var(--primary)]/30'}`}
            >
              {id === 'history' && <History size={11} />}
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--glass-bg)] text-[var(--text-muted)]'}`}>
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Import hint */}
      {subTab !== 'history' && (
        <div className="flex items-start gap-2 bg-[var(--success)]/5 border border-[var(--success)]/20 rounded-xl px-3 py-2 text-xs text-[var(--success)]">
          <Upload size={11} className="shrink-0 mt-0.5" />
          <span>File Excel: 2 cột <strong>Tên | Số lượng</strong> — đơn vị chỉnh trong app sau</span>
        </div>
      )}

      {/* ── Add form ── */}
      {showAddForm && (
        <div className="glass-card rounded-2xl">
          <form onSubmit={handleAddItem} className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-bold text-[var(--text-primary)] text-sm">
                Thêm {itemLabel} — {sectionLabel}
              </p>
              <Button
                type="button"
                onPress={() => setShowAddForm(false)}
                variant="ghost"
                isIconOnly
                size="sm"
                aria-label="Đóng"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={15} />
              </Button>
            </div>

            <FoodNameSelect value={newName} onChange={setNewName} itemType={subTab === 'equipment' ? 'equipment' : 'food'} required />
            <NumberPicker label="Số lượng" value={newCurrent} onChange={setNewCurrent} required min={0} step={0.1} />
            <NumberPicker label="Cảnh báo" value={newThreshold} onChange={setNewThreshold} min={0} step={0.1} placeholder="0" />

            <Select
              label="Đơn vị"
              value={newUnit}
              onChange={(v) => setNewUnit(v as InventoryUnit)}
              options={unitOptions.map(u => ({ value: u, label: u }))}
            />

            <Button type="submit" variant="primary" fullWidth className="rounded-xl">
              Thêm vào kho
            </Button>
          </form>
        </div>
      )}

      {/* ── Item list ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {state.loading ? (
          <SkeletonList count={3} variant="row" />
        ) : filteredItems.length === 0 && subTab !== 'history' ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-10">
            Chưa có {itemLabel} nào trong kho {sectionLabel}
          </p>
        ) : null}

        {filteredItems.map((item: InventoryItem) => {
          const isLow      = item.current < item.threshold;
          const isWarn     = !isLow && item.threshold > 0 && item.current < item.threshold * 1.5;
          const isExpanded = expandedId === item.id;
          const isEquip    = item.category === 'equipment' || item.category === 'restaurant-equipment' || item.category === 'festival-equipment';
          const currentUnitOpts = isEquip ? EQUIP_UNITS : FOOD_UNITS;

          return (
            <div key={item.id} className={`rounded-2xl overflow-hidden transition-all ${itemCls(isLow, isWarn)}`}>
              {/* Row */}
              <Button
                onPress={() => isExpanded ? setExpandedId(null) : openEdit(item)}
                variant="ghost"
                aria-label={isExpanded ? `Đóng chỉnh sửa ${item.name}` : `Chỉnh sửa ${item.name}`}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between px-4 py-3 text-left h-auto rounded-none hover:bg-[var(--glass-bg)]"
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isLow ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
                    {item.name}
                  </p>
                  {isLow  && <p className="text-xs text-[var(--danger)] font-medium">⚠ Sắp hết hàng!</p>}
                  {isWarn && <p className="text-xs text-indigo-400 font-medium">Sắp tới mức cảnh báo</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-sm font-black ${isLow ? 'text-[var(--danger)]' : isWarn ? 'text-indigo-400' : 'text-[var(--primary)]'}`}>
                    {item.current}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{item.unit}</span>
                  {isExpanded
                    ? <ChevronUp size={14} className="text-[var(--text-muted)]" />
                    : <ChevronDown size={14} className="text-[var(--text-muted)]" />
                  }
                </div>
              </Button>

              {/* Edit panel */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-[var(--glass-border)] space-y-3">
                  <FoodNameSelect
                    value={editName}
                    onChange={setEditName}
                    itemType={isEquip ? 'equipment' : 'food'}
                    required
                  />
                  <NumberPicker label="Số lượng" value={editQty} onChange={setEditQty} required min={0} step={0.1} />
                  <NumberPicker label="Cảnh báo" value={editThreshold} onChange={setEditThreshold} min={0} step={0.1} placeholder="0" />

                  <Select
                    label="Đơn vị"
                    value={editUnit}
                    onChange={(v) => setEditUnit(v as InventoryUnit)}
                    options={currentUnitOpts.map(u => ({ value: u, label: u }))}
                  />

                  <div className="flex gap-2">
                    <Button
                      onPress={() => handleSaveEdit(item)}
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl"
                    >
                      <Check size={14} /> Lưu
                    </Button>
                    <Button
                      onPress={() => setExpandedId(null)}
                      variant="ghost"
                      className="flex-1 rounded-xl border border-[var(--glass-border)]"
                    >
                      Hủy
                    </Button>
                    <Button
                      onPress={() => handleDelete(item)}
                      variant="ghost"
                      isIconOnly
                      className="px-3 rounded-xl text-[var(--danger)] bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20"
                      aria-label={`Xóa ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── History tab ── */}
      {subTab === 'history' && <InventoryLogList logs={sectionLogs} />}
    </div>
  );
}
