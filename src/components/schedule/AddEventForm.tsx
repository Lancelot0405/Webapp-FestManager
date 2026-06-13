import { X } from 'lucide-react';
import { Button } from '@heroui/react';
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
    <div className="bg-surface border border-separator rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <p className="font-semibold text-sm text-foreground">Thêm sự kiện mới</p>
        <Button onPress={onClose} variant="ghost" isIconOnly size="sm" className="rounded-full" aria-label="Đóng">
          <X size={16} />
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
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
                className="lg:col-span-2"
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
                className="lg:col-span-2"
              />
            )}
          />
        </div>
        <Button type="submit" variant="primary" fullWidth className="rounded-lg" isDisabled={createEvent.isPending}>
          {createEvent.isPending ? 'Đang tạo...' : 'Tạo sự kiện'}
        </Button>
      </form>
    </div>
  );
}
