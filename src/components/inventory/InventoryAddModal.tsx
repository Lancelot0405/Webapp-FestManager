import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@heroui/react';
import {
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
} from '@heroui/react';
import { Select } from '@/components/ui/select';
import { useApp } from '../../context/AppContext';
import { useCreateInventoryItem } from '../../hooks/queries/mutations/useCreateInventoryItem';
import { useAddInventoryLog } from '../../hooks/queries/mutations/useAddInventoryLog';
import FoodNameSelect from './FoodNameSelect';
import NumberPicker from './NumberPicker';
import type { InventoryUnit } from '../../types';
import type { MainTab, SubTab } from './useInventoryFilters';
import { FOOD_UNITS, EQUIP_UNITS, getCategory } from './useInventoryFilters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mainTab: MainTab;
  subTab: SubTab;
}

export default function InventoryAddModal({ isOpen, onClose, mainTab, subTab }: Props) {
  const { currentUser } = useApp();
  const createMutation  = useCreateInventoryItem();
  const addLogMutation  = useAddInventoryLog();

  const unitOptions  = subTab === 'equipment' ? EQUIP_UNITS : FOOD_UNITS;
  const defaultUnit: InventoryUnit = subTab === 'equipment' ? 'cái' : 'kg';

  const [newName,      setNewName]      = useState('');
  const [newCurrent,   setNewCurrent]   = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newUnit,      setNewUnit]      = useState<InventoryUnit>(defaultUnit);

  useEffect(() => {
    if (isOpen) {
      setNewName(''); setNewCurrent(''); setNewThreshold(''); setNewUnit(defaultUnit);
    }
  }, [isOpen, defaultUnit]);

  const itemLabel    = subTab === 'equipment' ? 'trang thiết bị' : 'thực phẩm';
  const sectionLabel = mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCurrent) return;
    const category = getCategory(mainTab, subTab);
    createMutation.mutate({
      name: newName.trim(), current: parseFloat(newCurrent),
      threshold: parseFloat(newThreshold) || 0, unit: newUnit, category,
    });
    if (currentUser) {
      addLogMutation.mutate({
        id: Date.now(), itemId: Date.now() + 1, itemName: newName.trim(),
        qty: parseFloat(newCurrent), unit: newUnit, action: 'created',
        festivalId: null, festivalName: mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    onClose();
  };

  return (
    <ModalRoot isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop
        isDismissable
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      >
        <ModalContainer className="relative z-[201] w-full max-w-lg rounded-xl outline-none border border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-[var(--glass-blur)] shadow-2xl">
          <ModalDialog aria-label="Thêm mặt hàng" className="relative outline-none">
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-bold text-[var(--text-primary)] text-sm">
                  Thêm {itemLabel} — {sectionLabel}
                </p>
                <Button
                  type="button"
                  onPress={onClose}
                  variant="ghost"
                  isIconOnly
                  size="sm"
                  aria-label="Đóng"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={15} />
                </Button>
              </div>

              <FoodNameSelect
                value={newName}
                onChange={setNewName}
                itemType={subTab === 'equipment' ? 'equipment' : 'food'}
                required
              />
              <NumberPicker label="Số lượng"  value={newCurrent}   onChange={setNewCurrent}   required min={0} step={0.1} />
              <NumberPicker label="Cảnh báo"  value={newThreshold} onChange={setNewThreshold} min={0}   step={0.1} placeholder="0" />
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
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
