import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import type { InventoryItem, InventoryUnit, CurrentUser } from '../../types';
import NumberPicker from './NumberPicker';
import FoodNameSelect from './FoodNameSelect';
import { Select } from '@/components/ui/select';
import {
  useDeleteInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useAddInventoryLogMutation,
} from '../../hooks/queries/useMutations';

const FOOD_UNITS: InventoryUnit[]  = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'gói', 'lốc', 'xiên', 'thùng', 'phần', 'con', 'miếng', 'thanh', 'viên', 'lọ', 'bình'];
const EQUIP_UNITS: InventoryUnit[] = ['cái', 'chiếc', 'đôi', 'bộ', 'chai', 'cuộn', 'hộp', 'thùng', 'tấm', 'ổ', 'gói'];

interface InventoryItemRowProps {
  item: InventoryItem;
  currentUser: CurrentUser | null;
}

export default function InventoryItemRow({ item, currentUser }: InventoryItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQty, setEditQty] = useState(String(item.current));
  const [editThreshold, setEditThreshold] = useState(String(item.threshold));
  const [editUnit, setEditUnit] = useState<InventoryUnit>(item.unit);

  const updateInventoryItemMutation = useUpdateInventoryItemMutation();
  const deleteInventoryItemMutation = useDeleteInventoryItemMutation();
  const addInventoryLogMutation = useAddInventoryLogMutation();

  const isLow  = item.current < item.threshold;
  const isWarn = !isLow && item.threshold > 0 && item.current < item.threshold * 1.5;
  const isEquip = item.category === 'equipment' || item.category === 'restaurant-equipment' || item.category === 'festival-equipment';
  const currentUnitOpts = isEquip ? EQUIP_UNITS : FOOD_UNITS;

  const itemCls =
    isLow  ? 'bg-[var(--danger)]/5 border border-[var(--danger)]/30 backdrop-blur-[var(--glass-blur)]' :
    isWarn ? 'bg-indigo-500/5 border border-indigo-500/30 backdrop-blur-[var(--glass-blur)]' :
             'glass-card';

  const handleOpenEdit = () => {
    setEditName(item.name);
    setEditQty(String(item.current));
    setEditThreshold(String(item.threshold));
    setEditUnit(item.unit);
    setIsExpanded(!isExpanded);
  };

  const handleSaveEdit = () => {
    const qty = parseFloat(editQty);
    const thr = parseFloat(editThreshold) || 0;
    if (isNaN(qty) || qty < 0 || !editName.trim()) return;

    updateInventoryItemMutation.mutate({
      itemId: item.id,
      name: editName.trim(),
      current: qty,
      threshold: thr,
      unit: editUnit,
    }, {
      onSuccess: () => {
        setIsExpanded(false);
      }
    });

    if (currentUser && (qty !== item.current || editUnit !== item.unit)) {
      addInventoryLogMutation.mutate({
        itemId: item.id,
        itemName: editName.trim(),
        qty,
        unit: editUnit,
        action: 'set',
        festivalId: null,
        festivalName: 'Kiểm kho tổng',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Xóa "${item.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteInventoryItemMutation.mutate(item.id);
      setIsExpanded(false);
    }
  };

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${itemCls}`}>
      {/* Row */}
      <Button
        onPress={handleOpenEdit}
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
              onPress={handleSaveEdit}
              variant="primary"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl"
              isDisabled={updateInventoryItemMutation.isPending}
            >
              <Check size={14} /> Lưu
            </Button>
            <Button
              onPress={() => setIsExpanded(false)}
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
              isDisabled={deleteInventoryItemMutation.isPending}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
