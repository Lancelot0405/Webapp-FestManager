import { useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useKeyboardInsets, handleFocusScroll } from '@/hooks/useKeyboardOffset';
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
  const { bottom: keyboardOffset, viewportHeight } = useKeyboardInsets(isOpen && !isDesktop);
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl p-0 outline-none overflow-hidden"
        style={{ marginBottom: keyboardOffset, maxHeight: viewportHeight ?? undefined }}
      >
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground">
            Chỉnh sửa: {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4 overflow-y-auto" onFocus={handleFocusScroll}>
          <form id="edit-inventory-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
            {errors.name && <p className="text-xs text-destructive -mt-2">{errors.name.message}</p>}

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
                <div className="w-full flex flex-col gap-1">
                  <Label className="text-xs font-medium text-foreground/80">Đơn vị</Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(u => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unit && <p className="text-xs text-destructive mt-0.5">{errors.unit.message}</p>}
                </div>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-semibold h-10"
              >
                <Check size={14} /> Lưu
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 rounded-xl border border-border font-semibold h-10"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                variant="destructive"
                className="px-3 rounded-xl flex items-center justify-center h-10"
                aria-label={`Xóa ${item.name}`}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
