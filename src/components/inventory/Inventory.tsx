import { useRef, useState, useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
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
  const importRef = useRef<HTMLInputElement>(null);

  const filters = useInventoryFilters(inventory, inventoryLogs, currentUser);

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
        sectionLabel={filters.sectionLabel}
        onMainTabChange={filters.handleMainTabChange}
        onSubTabChange={filters.handleSubTabChange}
        actionSlot={importButton}
      />

      {filters.subTab !== 'history' && (
        <div className="flex items-start gap-2 bg-success/5 border border-success/20 rounded-xl px-3 py-2 text-xs text-success">
          <Upload size={11} className="shrink-0 mt-0.5" />
          <span>File Excel: 2 cột <strong>Tên | Số lượng</strong> — đơn vị chỉnh trong app sau</span>
        </div>
      )}

      {filters.subTab !== 'history' && (
        <InventoryItemList
          items={filters.filteredItems}
          isLoading={isLoading}
          onEditItem={setEditingItem}
          itemLabel={filters.itemLabel}
          sectionLabel={filters.sectionLabel}
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
