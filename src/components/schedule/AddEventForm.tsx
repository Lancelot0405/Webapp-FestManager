import {
  Button, Modal, TextField, Label, Input, FieldError,
  DrawerRoot, DrawerBackdrop, DrawerContent, DrawerDialog,
} from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppDatePicker from '@/components/shared/AppDatePicker';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useCreateEvent } from '../../hooks/queries/mutations/useCreateEvent';
import { computeEventStatus } from '../../lib/eventStatus';
import { eventSchema } from '../../lib/validations';
import { useKeyboardInsets, handleFocusScroll } from '../../hooks/useKeyboardOffset';
import type { FestivalEvent } from '../../types';

interface AddEventFormProps {
  onClose: () => void;
}

type FormValues = z.infer<typeof eventSchema>;

export default function AddEventForm({ onClose }: AddEventFormProps) {
  const isDesktop = useIsDesktop();
  const { bottom: keyboardOffset, viewportHeight } = useKeyboardInsets(!isDesktop);
  const createEvent = useCreateEvent();
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { name: '', startDate: '', endDate: '', location: '' },
  });

  const startDate = watch('startDate');

  const onSubmit = (data: FormValues) => {
    const toDisplay = (iso: string) => {
      const [yyyy, mm, dd] = iso.split('-');
      return `${dd}-${mm}-${yyyy}`;
    };
    const formattedStart = toDisplay(data.startDate);
    const formattedEnd   = data.endDate ? toDisplay(data.endDate) : undefined;
    const status = computeEventStatus(formattedStart, formattedEnd);

    const newEvent: FestivalEvent = {
      id: Date.now(),
      name: data.name.trim(),
      date: formattedStart,
      endDate: formattedEnd,
      location: data.location.trim(),
      status,
      staff: [],
      financials: { income: 0, expenses: {} },
      inventoryReported: [],
      receipts: [],
      extra: { booth: '', hygienePermit: 'Chưa có', organizerContact: '' },
    };
    createEvent.mutate(newEvent, { onSuccess: () => onClose() });
  };

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField value={field.value} onChange={field.onChange} isInvalid={!!errors.name} className="w-full flex flex-col gap-1 sm:col-span-2">
            <Label className="text-xs font-medium text-foreground/80">Tên sự kiện *</Label>
            <Input placeholder="Nhập tên sự kiện..." />
            {errors.name && <FieldError className="text-xs text-danger">{errors.name.message}</FieldError>}
          </TextField>
        )}
      />
      <Controller
        name="startDate"
        control={control}
        render={({ field }) => (
          <AppDatePicker
            label="Ngày bắt đầu"
            isRequired
            value={field.value}
            onChange={field.onChange}
            error={errors.startDate?.message}
          />
        )}
      />
      <Controller
        name="endDate"
        control={control}
        render={({ field }) => (
          <AppDatePicker
            label="Ngày kết thúc"
            value={field.value ?? ''}
            minValue={startDate}
            onChange={field.onChange}
            error={errors.endDate?.message}
          />
        )}
      />
      <Controller
        name="location"
        control={control}
        render={({ field }) => (
          <TextField value={field.value} onChange={field.onChange} isInvalid={!!errors.location} className="w-full flex flex-col gap-1 sm:col-span-2">
            <Label className="text-xs font-medium text-foreground/80">Địa điểm *</Label>
            <Input placeholder="Nhập địa điểm..." />
            {errors.location && <FieldError className="text-xs text-danger">{errors.location.message}</FieldError>}
          </TextField>
        )}
      />
    </div>
  );

  const footer = (
    <>
      <Button variant="ghost" onPress={onClose} className="rounded-xl">Hủy</Button>
      <Button
        type="submit"
        form="add-event-form"
        variant="primary"
        className="rounded-xl"
        isDisabled={createEvent.isPending}
      >
        {createEvent.isPending ? 'Đang tạo...' : 'Tạo sự kiện'}
      </Button>
    </>
  );

  /* ── Desktop: Drawer from right ── */
  if (isDesktop) {
    return (
      <DrawerRoot isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
        <DrawerBackdrop isDismissable className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm">
          <DrawerContent
            placement="right"
            className="fixed right-0 top-0 bottom-0 z-[201] w-[min(28rem,100vw)] outline-none border-l border-separator bg-background shadow-2xl flex flex-col"
          >
            <DrawerDialog aria-label="Thêm sự kiện mới" className="relative outline-none flex flex-col h-full">
              <div className="px-5 pt-5 pb-3 shrink-0 border-b border-separator">
                <p className="text-base font-bold text-foreground">Thêm sự kiện mới</p>
              </div>
              <div className="px-5 py-4 overflow-y-auto flex-1">
                <form id="add-event-form" onSubmit={handleSubmit(onSubmit)}>
                  {formFields}
                </form>
              </div>
              <div className="px-5 py-4 flex gap-2 justify-end shrink-0 border-t border-separator">
                {footer}
              </div>
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </DrawerRoot>
    );
  }

  /* ── Mobile: Modal bottom sheet ── */
  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="bottom" size="md" className="sm:items-center">
          <Modal.Dialog aria-label="Thêm sự kiện mới" style={{ marginBottom: keyboardOffset, maxHeight: viewportHeight ?? undefined }} className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl">
            <Modal.Header className="px-5 pt-5 pb-0 shrink-0">
              <Modal.Heading className="text-base font-bold text-foreground">Thêm sự kiện mới</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-4 overflow-y-auto" onFocus={handleFocusScroll}>
              <form id="add-event-form" onSubmit={handleSubmit(onSubmit)}>
                {formFields}
              </form>
            </Modal.Body>
            <Modal.Footer className="px-5 pb-5 flex gap-2 justify-end shrink-0 border-t border-separator">
              {footer}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
