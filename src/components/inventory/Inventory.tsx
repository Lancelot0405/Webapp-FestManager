import { useMemo, useRef, useState, useCallback } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useFABRegister } from '../../hooks/useFABRegister';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';
import { useInventoryQuery } from '../../hooks/queries/useInventoryQuery';
import { useInventoryLogsQuery } from '../../hooks/queries/useInventoryLogsQuery';
import { useCreateInventoryItem } from '../../hooks/queries/mutations/useCreateInventoryItem';

import type { InventoryItem } from '../../types';
import InventoryLogList from './InventoryLogList';
import InventoryTabs from './InventoryTabs';
import InventoryItemList from './InventoryItemList';
import InventoryItemDrawer from './InventoryItemDrawer';
import InventoryAddModal from './InventoryAddModal';
import InventoryToolbar, { type SortKey } from './InventoryToolbar';
import InventorySummary from './InventorySummary';
import { useInventoryFilters, getCategory } from './useInventoryFilters';

export default function Inventory() {
  const { currentUser } = useApp();
  const showToast = useToast();
  const { data: inventory = [], isLoading } = useInventoryQuery();
  const { data: inventoryLogs = [] }        = useInventoryLogsQuery();
  const createInventoryItemMutation         = useCreateInventoryItem();

  const [editingItem,  setEditingItem]  = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importing,    setImporting]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [sort,         setSort]         = useState<SortKey>('status');
  const importRef = useRef<HTMLInputElement>(null);

  const filters = useInventoryFilters(inventory, inventoryLogs, currentUser);

  const lowCount = filters.filteredItems.filter(i => i.current < i.threshold).length;

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? filters.filteredItems.filter(i => i.name.toLowerCase().includes(q))
      : [...filters.filteredItems];

    const rank = (i: InventoryItem) => {
      if (i.current < i.threshold) return 0;
      if (i.threshold > 0 && i.current < i.threshold * 1.5) return 1;
      return 2;
    };

    switch (sort) {
      case 'name':     return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      case 'qty-desc': return list.sort((a, b) => b.current - a.current);
      case 'qty-asc':  return list.sort((a, b) => a.current - b.current);
      default:         return list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'vi'));
    }
  }, [filters.filteredItems, search, sort]);

  const openAddModal = useCallback(() => setShowAddModal(true), []);
  useFABRegister(filters.subTab !== 'history' ? openAddModal : null, 'Thêm vào kho');

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
        const category = getCategory(filters.mainTab, filters.subTab);
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

  const importButton = filters.subTab !== 'history' ? (
    <label className={`flex items-center gap-1.5 text-success border border-success/20 bg-success/5 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer hover:bg-success/15 active:scale-95 transition-all ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
      <FileSpreadsheet size={13} />
      {importing ? 'Đang import...' : 'Import'}
      <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
    </label>
  ) : null;

  return (
    <div className="space-y-4 pb-32">
      <InventoryTabs
        mainTab={filters.mainTab}
        subTab={filters.subTab}
        canSeeRestaurant={filters.canSeeRestaurant}
        canSeeFestival={filters.canSeeFestival}
        countFor={filters.countFor}
        sectionLogsCount={filters.sectionLogs.length}
        onMainTabChange={filters.handleMainTabChange}
        onSubTabChange={filters.handleSubTabChange}
        actionSlot={importButton}
        summarySlot={
          filters.subTab !== 'history' && !isLoading && filters.filteredItems.length > 0 ? (
            <InventorySummary
              total={filters.filteredItems.length}
              lowCount={lowCount}
              itemLabel={filters.itemLabel}
            />
          ) : null
        }
        toolbarSlot={
          filters.subTab !== 'history' && !isLoading && filters.filteredItems.length > 0 ? (
            <InventoryToolbar
              itemLabel={filters.itemLabel}
              search={search}
              onSearchChange={setSearch}
              sort={sort}
              onSortChange={setSort}
            />
          ) : null
        }
      />

      {filters.subTab !== 'history' && (
        <InventoryItemList
          items={visibleItems}
          isLoading={isLoading}
          onEditItem={setEditingItem}
          itemLabel={filters.itemLabel}
          sectionLabel={filters.sectionLabel}
          isFiltered={search.trim().length > 0}
        />
      )}

      {filters.subTab === 'history' && <InventoryLogList logs={filters.sectionLogs} />}

      <InventoryItemDrawer
        item={editingItem}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
      />

      <InventoryAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mainTab={filters.mainTab}
        subTab={filters.subTab}
      />
    </div>
  );
}
