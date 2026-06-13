import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { useCreateEvent } from '../../hooks/queries/mutations/useCreateEvent';
import { computeEventStatus } from '../../lib/eventStatus';
import type { FestivalEvent } from '../../types';

interface AddEventFormProps {
  onClose: () => void;
}

export default function AddEventForm({ onClose }: AddEventFormProps) {
  const createEvent = useCreateEvent();
  const [name,      setName]     = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [location,  setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !location.trim()) return;

    const toDisplay = (iso: string) => {
      const [yyyy, mm, dd] = iso.split('-');
      return `${dd}-${mm}-${yyyy}`;
    };

    const formattedStart = toDisplay(startDate);
    const formattedEnd   = endDate ? toDisplay(endDate) : undefined;
    const status = computeEventStatus(formattedStart, formattedEnd);

    const newEvent: FestivalEvent = {
      id: Date.now(),
      name: name.trim(),
      date: formattedStart,
      endDate: formattedEnd,
      location: location.trim(),
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
    <div className="glass-card rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <p className="font-semibold text-sm text-[var(--text-primary)]">Thêm sự kiện mới</p>
        <Button onPress={onClose} variant="ghost" isIconOnly size="sm" className="rounded-full" aria-label="Đóng">
          <X size={16} />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <Input label="Tên sự kiện *" placeholder="Nhập tên sự kiện..." value={name} onChange={setName} isRequired />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" label="Ngày bắt đầu *" value={startDate} onChange={(v) => { setStartDate(v); if (endDate && v > endDate) setEndDate(''); }} isRequired />
          <Input type="date" label="Ngày kết thúc" value={endDate} min={startDate} onChange={setEndDate} />
        </div>
        <Input label="Địa điểm *" placeholder="Nhập địa điểm..." value={location} onChange={setLocation} isRequired />
        <Button type="submit" variant="primary" fullWidth className="rounded-lg" isDisabled={createEvent.isPending}>
          {createEvent.isPending ? 'Đang tạo...' : 'Tạo sự kiện'}
        </Button>
      </form>
    </div>
  );
}
