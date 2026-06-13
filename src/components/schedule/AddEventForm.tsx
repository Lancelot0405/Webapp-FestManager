import { Button, Modal } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/shared/GlassInput';
import { useCreateEvent } from '../../hooks/queries/mutations/useCreateEvent';
import { computeEventStatus } from '../../lib/eventStatus';
import { eventSchema } from '../../lib/validations';
import type { FestivalEvent } from '../../types';

interface AddEventFormProps {
  onClose: () => void;
}

type FormValues = z.infer<typeof eventSchema>;

export default function AddEventForm({ onClose }: AddEventFormProps) {
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

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog aria-label="Thêm sự kiện mới">
            <Modal.Header className="px-5 pt-5 pb-0">
              <Modal.Heading className="text-base font-bold text-foreground">Thêm sự kiện mới</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-4">
              <form id="add-event-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Tên sự kiện *"
                        placeholder="Nhập tên sự kiện..."
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.name?.message}
                        className="sm:col-span-2"
                      />
                    )}
                  />
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        label="Ngày bắt đầu *"
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
                      <Input
                        type="date"
                        label="Ngày kết thúc"
                        value={field.value ?? ''}
                        min={startDate}
                        onChange={field.onChange}
                        error={errors.endDate?.message}
                      />
                    )}
                  />
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Địa điểm *"
                        placeholder="Nhập địa điểm..."
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.location?.message}
                        className="sm:col-span-2"
                      />
                    )}
                  />
                </div>
              </form>
            </Modal.Body>
            <Modal.Footer className="px-5 pb-5 flex gap-2 justify-end">
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
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
