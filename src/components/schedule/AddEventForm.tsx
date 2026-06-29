import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppDatePicker from '@/components/shared/AppDatePicker';
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
  const { bottom: keyboardOffset, viewportHeight } = useKeyboardInsets(true);
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl p-0 outline-none overflow-hidden"
        style={{ marginBottom: keyboardOffset, maxHeight: viewportHeight ?? undefined }}
      >
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground">Thêm sự kiện mới</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4 overflow-y-auto" onFocus={handleFocusScroll}>
          <form id="add-event-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div className="w-full flex flex-col gap-1 sm:col-span-2">
                    <Label htmlFor="name" className="text-xs font-medium text-foreground/80">Tên sự kiện *</Label>
                    <Input id="name" placeholder="Nhập tên sự kiện..." {...field} />
                    {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>}
                  </div>
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
                  <div className="w-full flex flex-col gap-1 sm:col-span-2">
                    <Label htmlFor="location" className="text-xs font-medium text-foreground/80">Địa điểm *</Label>
                    <Input id="location" placeholder="Nhập địa điểm..." {...field} />
                    {errors.location && <p className="text-xs text-destructive mt-0.5">{errors.location.message}</p>}
                  </div>
                )}
              />
            </div>
          </form>
        </div>
        <DialogFooter className="px-5 pb-5 flex gap-2 justify-end shrink-0 border-t border-border pt-3">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button
            type="submit"
            form="add-event-form"
            className="rounded-xl"
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? 'Đang tạo...' : 'Tạo sự kiện'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
