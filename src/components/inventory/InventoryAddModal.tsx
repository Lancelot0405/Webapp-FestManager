import { useEffect } from 'react';
import { Button, Modal } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select } from '@/components/shared/GlassSelect';
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
    createMutation.mutate({
      name: data.name.trim(),
      current: parseFloat(data.current),
      threshold: parseFloat(data.threshold ?? '0') || 0,
      unit: data.unit as InventoryUnit,
      category,
    });
    if (currentUser) {
      addLogMutation.mutate({
        id: Date.now(), itemId: Date.now() + 1, itemName: data.name.trim(),
        qty: parseFloat(data.current), unit: data.unit as InventoryUnit, action: 'created',
        festivalId: null, festivalName: mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival',
        timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
        submittedBy: currentUser.name,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="bottom" size="md" className="sm:items-center">
          <Modal.Dialog aria-label="Thêm mặt hàng" className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl">
            <Modal.Header className="px-5 pt-5 pb-0 shrink-0">
              <Modal.Heading className="text-sm font-bold text-foreground">
                Thêm {itemLabel} — {sectionLabel}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-4 overflow-y-auto">
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
                {errors.name && <p className="text-xs text-danger -mt-2">{errors.name.message}</p>}

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
              </form>
            </Modal.Body>
            <Modal.Footer className="px-5 pb-5 flex gap-2 justify-end shrink-0 border-t border-separator">
              <Button variant="ghost" onPress={onClose} className="rounded-xl">Hủy</Button>
              <Button type="submit" form="inventory-add-form" variant="primary" className="rounded-xl">
                Thêm vào kho
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
