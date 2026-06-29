import { useEffect } from 'react';
import { useKeyboardInsets, handleFocusScroll } from '../../hooks/useKeyboardOffset';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '../../context/AppContext';
import { useCreateInventoryItem } from '../../hooks/queries/mutations/useCreateInventoryItem';
import { useAddInventoryLog } from '../../hooks/queries/mutations/useAddInventoryLog';
import FoodNameSelect from './FoodNameSelect';
import NumberPicker from './NumberPicker';
import { inventoryItemSchema } from '../../lib/validations';
import type { InventoryUnit } from '../../types';
import type { MainTab, SubTab } from './useInventoryFilters';
import { FOOD_UNITS, EQUIP_UNITS, getCategory } from './useInventoryFilters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mainTab: MainTab;
  subTab: SubTab;
}

type FormValues = z.infer<typeof inventoryItemSchema>;

export default function InventoryAddModal({ isOpen, onClose, mainTab, subTab }: Props) {
  const { bottom: keyboardOffset, viewportHeight } = useKeyboardInsets(isOpen);
  const { currentUser } = useApp();
  const createMutation  = useCreateInventoryItem();
  const addLogMutation  = useAddInventoryLog();

  const unitOptions  = subTab === 'equipment' ? EQUIP_UNITS : FOOD_UNITS;
  const defaultUnit: InventoryUnit = subTab === 'equipment' ? 'cái' : 'kg';

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: { name: '', current: '', threshold: '', unit: defaultUnit },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: '', current: '', threshold: '', unit: defaultUnit });
    }
  }, [isOpen, defaultUnit, reset]);

  const itemLabel    = subTab === 'equipment' ? 'trang thiết bị' : 'thực phẩm';
  const sectionLabel = mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival';

  const onSubmit = (data: FormValues) => {
    const category = getCategory(mainTab, subTab);
    const user = currentUser;
    createMutation.mutate({
      name: data.name.trim(),
      current: parseFloat(data.current),
      threshold: parseFloat(data.threshold ?? '0') || 0,
      unit: data.unit as InventoryUnit,
      category,
    }, {
      onSuccess: (realItemId) => {
        if (user) {
          addLogMutation.mutate({
            id: Date.now(),
            itemId: realItemId,
            itemName: data.name.trim(),
            qty: parseFloat(data.current),
            unit: data.unit as InventoryUnit,
            action: 'created',
            festivalId: null,
            festivalName: mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival',
            timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
            submittedBy: user.name,
          });
        }
      },
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl p-0 outline-none overflow-hidden"
        style={{ marginBottom: keyboardOffset, maxHeight: viewportHeight ?? undefined }}
      >
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground">
            Thêm {itemLabel} — {sectionLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4 overflow-y-auto" onFocus={handleFocusScroll}>
          <form id="inventory-add-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <FoodNameSelect
                  value={field.value}
                  onChange={field.onChange}
                  itemType={subTab === 'equipment' ? 'equipment' : 'food'}
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
          </form>
        </div>
        <DialogFooter className="px-5 pb-5 flex gap-2 justify-end shrink-0 border-t border-border pt-3">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button type="submit" form="inventory-add-form" className="rounded-xl">
            Thêm vào kho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
