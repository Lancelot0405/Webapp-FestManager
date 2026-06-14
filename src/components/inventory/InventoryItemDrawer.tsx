import { useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button, Modal } from '@heroui/react';
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
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
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
  const keyboardOffset = useKeyboardOffset(isOpen && !isDesktop);
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

  const formContent = (
    <>
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
          className="flex-1 rounded-xl border border-separator"
        >
          Hủy
        </Button>
        <Button
          type="button"
          onPress={handleDelete}
          variant="ghost"
          isIconOnly
          className="px-3 rounded-xl text-danger bg-danger/10 hover:bg-danger/20"
          aria-label={`Xóa ${item.name}`}
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </>
  );

  /* ── Mobile: Modal bottom sheet ── */
  if (!isDesktop) {
    return (
      <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Backdrop isDismissable>
          <Modal.Container placement="bottom" size="md" className="sm:items-center">
            <Modal.Dialog
              aria-label="Chỉnh sửa mặt hàng"
              style={{ marginBottom: keyboardOffset }}
              className="max-h-[90dvh] flex flex-col rounded-t-2xl"
            >
              <Modal.Header className="px-5 pt-5 pb-0 shrink-0">
                <Modal.Heading className="text-sm font-bold text-foreground">
                  Chỉnh sửa: {item.name}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="px-5 py-4 overflow-y-auto">
                <form id="edit-inventory-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  {formContent}
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    );
  }

  /* ── Desktop: Drawer from right ── */
  return (
    <DrawerRoot isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerBackdrop
        isDismissable
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
      >
        <DrawerContent
          placement="right"
          className="fixed right-0 top-0 bottom-0 z-[201] w-96 outline-none border-l border-separator bg-overlay backdrop-blur-xl shadow-2xl"
        >
          <DrawerDialog aria-label="Chỉnh sửa mặt hàng" className="relative outline-none p-4 space-y-3">
            <p className="font-bold text-foreground text-sm">Chỉnh sửa: {item.name}</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {formContent}
            </form>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </DrawerRoot>
  );
}
