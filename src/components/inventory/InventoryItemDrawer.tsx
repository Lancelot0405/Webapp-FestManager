import { useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
} from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select } from '@/components/shared/GlassSelect';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useApp } from '../../context/AppContext';
import { useUpdateInventoryItem } from '../../hooks/queries/mutations/useUpdateInventoryItem';
import { useDeleteInventoryItem } from '../../hooks/queries/mutations/useDeleteInventoryItem';
import { useAddInventoryLog } from '../../hooks/queries/mutations/useAddInventoryLog';
import FoodNameSelect from './FoodNameSelect';
import NumberPicker from './NumberPicker';
import { inventoryItemSchema } from '../../lib/validations';
import type { InventoryItem, InventoryUnit } from '../../types';
import { FOOD_UNITS, EQUIP_UNITS } from './useInventoryFilters';

interface Props {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

type FormValues = z.infer<typeof inventoryItemSchema>;

export default function InventoryItemDrawer({ item, isOpen, onClose }: Props) {
  const { currentUser } = useApp();
  const isDesktop = useIsDesktop();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();
  const addLogMutation = useAddInventoryLog();

  const isEquip = item
    ? (item.category === 'equipment' || item.category === 'restaurant-equipment' || item.category === 'festival-equipment')
    : false;
  const unitOptions = isEquip ? EQUIP_UNITS : FOOD_UNITS;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: { name: '', current: '', threshold: '', unit: 'kg' },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        current: String(item.current),
        threshold: String(item.threshold),
        unit: item.unit,
      });
    }
  }, [item, reset]);

  if (!item) return null;

  const onSubmit = (data: FormValues) => {
    const qty = parseFloat(data.current);
    const thr = parseFloat(data.threshold ?? '0') || 0;
    updateMutation.mutate({ itemId: item.id, name: data.name.trim(), current: qty, threshold: thr, unit: data.unit as InventoryUnit });
    if (currentUser && (qty !== item.current || data.unit !== item.unit)) {
      addLogMutation.mutate({
        id: Date.now(), itemId: item.id, itemName: data.name.trim(), qty, unit: data.unit as InventoryUnit,
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
          placement={isDesktop ? 'right' : 'bottom'}
          className={isDesktop
            ? "fixed right-0 top-0 bottom-0 z-[201] w-96 outline-none border-l border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-[var(--glass-blur)] shadow-2xl"
            : "fixed bottom-0 left-0 right-0 z-[201] max-h-[90dvh] rounded-t-2xl outline-none border-x border-t border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-[var(--glass-blur)] shadow-2xl"
          }
        >
          <DrawerDialog aria-label="Chỉnh sửa mặt hàng" className="relative outline-none p-4 space-y-3">
            <p className="font-bold text-[var(--text-primary)] text-sm">Chỉnh sửa: {item.name}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <FoodNameSelect
                    value={field.value}
                    onChange={field.onChange}
                    itemType={isEquip ? 'equipment' : 'food'}
                    required
                  />
                )}
              />
              {errors.name && <p className="text-xs text-[var(--danger)] -mt-2">{errors.name.message}</p>}

              <Controller
                name="current"
                control={control}
                render={({ field }) => (
                  <NumberPicker
                    label="Số lượng"
                    value={field.value}
                    onChange={field.onChange}
                    required
                    min={0}
                    step={0.1}
                    error={errors.current?.message}
                  />
                )}
              />

              <Controller
                name="threshold"
                control={control}
                render={({ field }) => (
                  <NumberPicker
                    label="Cảnh báo"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    min={0}
                    step={0.1}
                    placeholder="0"
                  />
                )}
              />

              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Đơn vị"
                    value={field.value}
                    onChange={field.onChange}
                    options={unitOptions.map(u => ({ value: u, label: u }))}
                    error={errors.unit?.message}
                  />
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl"
                >
                  <Check size={14} /> Lưu
                </Button>
                <Button
                  type="button"
                  onPress={onClose}
                  variant="ghost"
                  className="flex-1 rounded-xl border border-[var(--glass-border)]"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onPress={handleDelete}
                  variant="ghost"
                  isIconOnly
                  className="px-3 rounded-xl text-[var(--danger)] bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20"
                  aria-label={`Xóa ${item.name}`}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </form>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </DrawerRoot>
  );
}
