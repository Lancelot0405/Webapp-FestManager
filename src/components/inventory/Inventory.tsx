import { useState, useRef } from 'react';
import { Plus, FileSpreadsheet, Upload, History, Store, Tent } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';
import ListSkeleton from '../shared/skeletons/ListSkeleton';
import type { InventoryItem, InventoryCategory } from '../../types';
import InventoryLogList from './InventoryLogList';
import InventoryItemRow from './InventoryItemRow';
import InventoryAddForm from './InventoryAddForm';

type MainTab = 'restaurant' | 'festival';
type SubTab  = 'food' | 'equipment' | 'history';

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

function getCategory(main: MainTab, sub: SubTab): InventoryCategory {
  if (main === 'restaurant') return sub === 'food' ? 'restaurant-food' : 'restaurant-equipment';
  return sub === 'food' ? 'festival-food' : 'festival-equipment';
}

import { useInventoryQuery } from '../../hooks/queries/useInventoryQuery';
import { useInventoryLogsQuery } from '../../hooks/queries/useInventoryLogsQuery';
import {
  useCreateInventoryItemMutation,
} from '../../hooks/queries/useMutations';

export default function Inventory() {
  const { state } = useApp();
  const { data: inventory = [], isLoading } = useInventoryQuery();
  const { data: inventoryLogs = [] } = useInventoryLogsQuery();
  const createInventoryItemMutation = useCreateInventoryItemMutation();
  const showToast = useToast();
  const { currentUser } = state;

  const dept             = currentUser?.role === 'admin' ? 'both' : (currentUser?.department ?? 'both');
  const canSeeRestaurant = dept === 'restaurant' || dept === 'both';
  const canSeeFestival   = dept === 'festival'   || dept === 'both';
  const defaultTab: MainTab = canSeeRestaurant ? 'restaurant' : 'festival';

  const [mainTab,       setMainTab]       = useState<MainTab>(defaultTab);
  const [subTab,        setSubTab]        = useState<SubTab>('food');
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [importing,     setImporting]     = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

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
          createInventoryItemMutation.mutate({ name: nameRaw, current: parseFloat(String(row[1] ?? '0')) || 0, threshold: 0, unit: 'cái', category });
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
    setMainTab(tab); setSubTab('food'); setShowAddForm(false);
  };
  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab); setShowAddForm(false);
  };

  const sectionLabel = mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival';
  const itemLabel    = subTab === 'equipment' ? 'trang thiết bị' : 'thực phẩm';

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
              onPress={() => { setShowAddForm(true); }}
              variant="primary"
              size="sm"
              className="hidden md:flex items-center gap-1.5 rounded-xl"
            >
              <Plus size={14} /> Thêm
            </Button>
        </div>
      )}
      {subTab !== 'history' && (
        <Button
          onPress={() => { setShowAddForm(true); }}
          isIconOnly
          aria-label="Thêm vào kho"
          className="md:hidden fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-[var(--primary)] text-[var(--background)] shadow-[var(--shadow-hero)] active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </Button>
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
        <InventoryAddForm
          mainTab={mainTab}
          subTab={subTab}
          currentUser={currentUser}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* ── Item list ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {isLoading ? (
          <ListSkeleton />
        ) : filteredItems.length === 0 && subTab !== 'history' ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-10">
            Chưa có {itemLabel} nào trong kho {sectionLabel}
          </p>
        ) : null}

        {filteredItems.map((item: InventoryItem) => (
          <InventoryItemRow key={item.id} item={item} currentUser={currentUser} />
        ))}
      </div>

      {/* ── History tab ── */}
      {subTab === 'history' && <InventoryLogList logs={sectionLogs} />}
    </div>
  );
}

