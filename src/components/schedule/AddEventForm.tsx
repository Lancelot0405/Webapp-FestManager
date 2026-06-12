import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { useCreateEventMutation } from '../../hooks/queries/useMutations';
import { computeEventStatus } from '../../lib/eventStatus';
import { eventFormSchema } from '../../lib/validations';
import type { FestivalEvent } from '../../types';
import { z } from 'zod';

type EventFormInputs = z.infer<typeof eventFormSchema>;

interface AddEventFormProps {
  onClose: () => void;
}

export default function AddEventForm({ onClose }: AddEventFormProps) {
  const createEventMutation = useCreateEventMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormInputs>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      location: '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const onSubmit = (data: EventFormInputs) => {
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
    createEventMutation.mutate(newEvent);
    onClose();
  };

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <p className="font-semibold text-sm text-[var(--text-primary)]">Thêm sự kiện mới</p>
        <Button
          onPress={onClose}
          variant="ghost"
          isIconOnly
          size="sm"
          className="rounded-full"
          aria-label="Đóng"
        >
          <X size={16} />
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Tên sự kiện *"
            placeholder="Nhập tên sự kiện..."
            error={errors.name?.message}
            {...register('name')}
            onChange={(v) => setValue('name', v, { shouldValidate: true })}
          />
          <Input
            label="Địa điểm *"
            placeholder="Nhập địa điểm..."
            error={errors.location?.message}
            {...register('location')}
            onChange={(v) => setValue('location', v, { shouldValidate: true })}
          />
          <Input
            type="date"
            label="Ngày bắt đầu *"
            error={errors.startDate?.message}
            {...register('startDate')}
            onChange={(v) => {
              setValue('startDate', v, { shouldValidate: true });
              if (endDate && v > endDate) setValue('endDate', '');
            }}
          />
          <Input
            type="date"
            label="Ngày kết thúc"
            error={errors.endDate?.message}
            min={startDate}
            {...register('endDate')}
            onChange={(v) => setValue('endDate', v, { shouldValidate: true })}
          />
        </div>
        <Button type="submit" variant="primary" fullWidth className="rounded-lg">
          Tạo sự kiện
        </Button>
      </form>
    </div>
  );
}
