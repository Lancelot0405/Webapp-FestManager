import { useMemo, useRef, useState, useCallback } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { SearchField } from '@heroui/react';
import { useFABRegister } from '../../hooks/useFABRegister';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';
import { useInventoryQuery } from '../../hooks/queries/useInventoryQuery';
import { useInventoryLogsQuery } from '../../hooks/queries/useInventoryLogsQuery';
import { useCreateInventoryItem } from '../../hooks/queries/mutations/useCreateInventoryItem';

import type { InventoryItem } from '../../types';
import InventoryLogList from './InventoryLogList';
import InventoryNavigation from './InventoryNavigation';
import InventoryItemList from './InventoryItemList';
import InventoryItemDrawer from './InventoryItemDrawer';
import InventoryAddModal from './InventoryAddModal';
import InventoryToolbar, { type SortKey } from './InventoryToolbar';
import InventorySummary from './InventorySummary';
import InventorySidebar from './InventorySidebar';
import InventoryTable from './InventoryTable';
import { useInventoryFilters, getCategory, getItemStatus } from './useInventoryFilters';

export default function Inventory() {
  const isDesktop = useIsDesktop(1024);
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

  const { statusFilter } = filters;
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? filters.filteredItems.filter(i => i.name.toLowerCase().includes(q))
      : [...filters.filteredItems];

    if (statusFilter !== 'all') {
      list = list.filter(i => getItemStatus(i) === statusFilter);
    }
    return list;
  }, [filters.filteredItems, search, statusFilter]);

  const visibleItems = useMemo(() => {
    const list = [...baseFiltered];

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
  }, [baseFiltered, sort]);

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

  const isFiltered = search.trim().length > 0 || statusFilter !== 'all';
  const hasItems = !isLoading && filters.filteredItems.length > 0;

  const desktopView = (
    <div className="flex gap-6 pb-32">
      <InventorySidebar
        mainTab={filters.mainTab}
        subTab={filters.subTab}
        canSeeRestaurant={filters.canSeeRestaurant}
        canSeeFestival={filters.canSeeFestival}
        countFor={filters.countFor}
        sectionLogsCount={filters.sectionLogs.length}
        onMainTabChange={filters.handleMainTabChange}
        onSubTabChange={filters.handleSubTabChange}
      />

      <div className="min-w-0 flex-1 space-y-4">
        {filters.subTab !== 'history' && hasItems && (
          <>
            <InventorySummary total={filters.filteredItems.length} lowCount={lowCount} itemLabel={filters.itemLabel} />
            <div className="flex items-center gap-3">
              <SearchField value={search} onChange={setSearch} className="flex-1" aria-label={`Tìm ${filters.itemLabel}`}>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder={`Tìm ${filters.itemLabel}...`} />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
              {importButton}
            </div>
          </>
        )}

        {filters.subTab !== 'history' ? (
          isLoading ? (
            <InventoryItemList items={[]} isLoading itemLabel={filters.itemLabel} sectionLabel={filters.sectionLabel} onEditItem={setEditingItem} />
          ) : (
            <InventoryTable
              items={baseFiltered}
              onEditItem={setEditingItem}
              itemLabel={filters.itemLabel}
              sectionLabel={filters.sectionLabel}
              isFiltered={isFiltered}
            />
          )
        ) : (
          <InventoryLogList logs={filters.sectionLogs} />
        )}
      </div>
    </div>
  );

  const mobileView = (
    <div className="space-y-4 pb-32">
      <InventoryNavigation
        mainTab={filters.mainTab}
        subTab={filters.subTab}
        statusFilter={filters.statusFilter}
        statusCounts={filters.statusCounts}
        canSeeRestaurant={filters.canSeeRestaurant}
        canSeeFestival={filters.canSeeFestival}
        countFor={filters.countFor}
        sectionLogsCount={filters.sectionLogs.length}
        onMainTabChange={filters.handleMainTabChange}
        onSubTabChange={filters.handleSubTabChange}
        onStatusFilterChange={filters.setStatusFilter}
        actionSlot={importButton}
        summarySlot={
          filters.subTab !== 'history' && hasItems ? (
            <InventorySummary
              total={filters.filteredItems.length}
              lowCount={lowCount}
              itemLabel={filters.itemLabel}
            />
          ) : null
        }
        toolbarSlot={
          filters.subTab !== 'history' && hasItems ? (
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
          isFiltered={isFiltered}
        />
      )}

      {filters.subTab === 'history' && <InventoryLogList logs={filters.sectionLogs} />}
    </div>
  );

  return (
    <>
      {isDesktop ? desktopView : mobileView}

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
    </>
  );
}
