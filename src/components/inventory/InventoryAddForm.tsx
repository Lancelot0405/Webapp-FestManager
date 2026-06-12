import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@heroui/react';
import type { InventoryUnit, InventoryCategory, CurrentUser } from '../../types';
import NumberPicker from './NumberPicker';
import FoodNameSelect from './FoodNameSelect';
import { Select } from '@/components/ui/select';
import {
  useCreateInventoryItemMutation,
  useAddInventoryLogMutation,
} from '../../hooks/queries/useMutations';

const FOOD_UNITS: InventoryUnit[]  = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'gói', 'lốc', 'xiên', 'thùng', 'phần', 'con', 'miếng', 'thanh', 'viên', 'lọ', 'bình'];
const EQUIP_UNITS: InventoryUnit[] = ['cái', 'chiếc', 'đôi', 'bộ', 'chai', 'cuộn', 'hộp', 'thùng', 'tấm', 'ổ', 'gói'];

type MainTab = 'restaurant' | 'festival';
type SubTab  = 'food' | 'equipment' | 'history';

function getCategory(main: MainTab, sub: SubTab): InventoryCategory {
  if (main === 'restaurant') return sub === 'food' ? 'restaurant-food' : 'restaurant-equipment';
  return sub === 'food' ? 'festival-food' : 'festival-equipment';
}

interface InventoryAddFormProps {
  mainTab: MainTab;
  subTab: SubTab;
  currentUser: CurrentUser | null;
  onClose: () => void;
}

export default function InventoryAddForm({ mainTab, subTab, currentUser, onClose }: InventoryAddFormProps) {
  const defaultUnit: InventoryUnit = subTab === 'equipment' ? 'cái' : 'kg';
  const unitOptions = subTab === 'equipment' ? EQUIP_UNITS : FOOD_UNITS;

  const [newName, setNewName] = useState('');
  const [newCurrent, setNewCurrent] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newUnit, setNewUnit] = useState<InventoryUnit>(defaultUnit);

  const createInventoryItemMutation = useCreateInventoryItemMutation();
  const addInventoryLogMutation = useAddInventoryLogMutation();

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCurrent) return;
    const category = getCategory(mainTab, subTab);
    
    createInventoryItemMutation.mutate({
      name: newName.trim(),
      current: parseFloat(newCurrent),
      threshold: parseFloat(newThreshold) || 0,
      unit: newUnit,
      category,
    });

    if (currentUser) {
      addInventoryLogMutation.mutate({
        itemId: Date.now() + 1,
        itemName: newName.trim(),
        qty: parseFloat(newCurrent),
        unit: newUnit,
        action: 'created',
        festivalId: null,
        festivalName: mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }

    setNewName('');
    setNewCurrent('');
    setNewThreshold('');
    setNewUnit(defaultUnit);
    onClose();
  };

  const sectionLabel = mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival';
  const itemLabel    = subTab === 'equipment' ? 'trang thiết bị' : 'thực phẩm';

  return (
    <div className="glass-card rounded-2xl">
      <form onSubmit={handleAddItem} className="p-4 space-y-3">
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

        <FoodNameSelect value={newName} onChange={setNewName} itemType={subTab === 'equipment' ? 'equipment' : 'food'} required />
        <NumberPicker label="Số lượng" value={newCurrent} onChange={setNewCurrent} required min={0} step={0.1} />
        <NumberPicker label="Cảnh báo" value={newThreshold} onChange={setNewThreshold} min={0} step={0.1} placeholder="0" />

        <Select
          label="Đơn vị"
          value={newUnit}
          onChange={(v) => setNewUnit(v as InventoryUnit)}
          options={unitOptions.map(u => ({ value: u, label: u }))}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="rounded-xl"
          isDisabled={createInventoryItemMutation.isPending}
        >
          Thêm vào kho
        </Button>
      </form>
    </div>
  );
}
