import { useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
} from '@heroui/react';
import { Select } from '@/components/ui/select';
import { useApp } from '../../context/AppContext';
import { useUpdateInventoryItem } from '../../hooks/queries/mutations/useUpdateInventoryItem';
import { useDeleteInventoryItem } from '../../hooks/queries/mutations/useDeleteInventoryItem';
import { useAddInventoryLog } from '../../hooks/queries/mutations/useAddInventoryLog';
import FoodNameSelect from './FoodNameSelect';
import NumberPicker from './NumberPicker';
import type { InventoryItem, InventoryUnit } from '../../types';
import { FOOD_UNITS, EQUIP_UNITS } from './useInventoryFilters';

interface Props {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryItemDrawer({ item, isOpen, onClose }: Props) {
  const { currentUser } = useApp();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();
  const addLogMutation = useAddInventoryLog();

  const [editName,      setEditName]      = useState('');
  const [editQty,       setEditQty]       = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [editUnit,      setEditUnit]      = useState<InventoryUnit>('kg');

  useEffect(() => {
    if (item) {
      setEditName(item.name);
      setEditQty(String(item.current));
      setEditThreshold(String(item.threshold));
      setEditUnit(item.unit);
    }
  }, [item]);

  if (!item) return null;

  const isEquip = item.category === 'equipment' || item.category === 'restaurant-equipment' || item.category === 'festival-equipment';
  const unitOptions = isEquip ? EQUIP_UNITS : FOOD_UNITS;

  const handleSave = () => {
    const qty = parseFloat(editQty);
    const thr = parseFloat(editThreshold) || 0;
    if (isNaN(qty) || qty < 0 || !editName.trim()) return;
    updateMutation.mutate({ itemId: item.id, name: editName.trim(), current: qty, threshold: thr, unit: editUnit });
    if (currentUser && (qty !== item.current || editUnit !== item.unit)) {
      addLogMutation.mutate({
        id: Date.now(), itemId: item.id, itemName: editName.trim(), qty, unit: editUnit,
        action: 'set', festivalId: null, festivalName: 'Kiểm kho tổng',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Xóa "${item.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteMutation.mutate(item.id);
      onClose();
    }
  };

  return (
    <DrawerRoot isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerBackdrop
        isDismissable
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
      >
        <DrawerContent
          placement="bottom"
          className="fixed bottom-0 left-0 right-0 z-[201] max-h-[90dvh] rounded-t-2xl outline-none border-x border-t border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-[var(--glass-blur)] shadow-2xl"
        >
          <DrawerDialog aria-label="Chỉnh sửa mặt hàng" className="relative outline-none p-4 space-y-3">
            <p className="font-bold text-[var(--text-primary)] text-sm">Chỉnh sửa: {item.name}</p>

            <FoodNameSelect
              value={editName}
              onChange={setEditName}
              itemType={isEquip ? 'equipment' : 'food'}
              required
            />
            <NumberPicker label="Số lượng"  value={editQty}       onChange={setEditQty}       required min={0} step={0.1} />
            <NumberPicker label="Cảnh báo"  value={editThreshold} onChange={setEditThreshold} min={0}   step={0.1} placeholder="0" />
            <Select
              label="Đơn vị"
              value={editUnit}
              onChange={(v) => setEditUnit(v as InventoryUnit)}
              options={unitOptions.map(u => ({ value: u, label: u }))}
            />

            <div className="flex gap-2">
              <Button
                onPress={handleSave}
                variant="primary"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl"
              >
                <Check size={14} /> Lưu
              </Button>
              <Button
                onPress={onClose}
                variant="ghost"
                className="flex-1 rounded-xl border border-[var(--glass-border)]"
              >
                Hủy
              </Button>
              <Button
                onPress={handleDelete}
                variant="ghost"
                isIconOnly
                className="px-3 rounded-xl text-[var(--danger)] bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20"
                aria-label={`Xóa ${item.name}`}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </DrawerRoot>
  );
}
