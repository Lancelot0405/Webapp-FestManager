// =============================================================================
// src/components/schedule/AddEventForm.tsx
// =============================================================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { computeEventStatus } from '../../lib/eventStatus';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button as HeroButton } from '@heroui/react';
import type { FestivalEvent } from '../../types';

interface AddEventFormProps {
  onClose: () => void;
}

export default function AddEventForm({ onClose }: AddEventFormProps) {
  const { addEvent } = useApp();
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
    addEvent(newEvent);
    onClose();
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent position="bottom" className="w-full max-w-md bg-white overflow-hidden">
        <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] overflow-y-auto overflow-x-hidden max-h-[85vh]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-800">Thêm sự kiện mới</h2>
            <HeroButton onPress={onClose} variant="ghost" isIconOnly size="sm" className="rounded-full" aria-label="Đóng">
              <X size={16} />
            </HeroButton>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tên sự kiện *"
              placeholder="Nhập tên sự kiện..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ngày bắt đầu *"
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate('');
                }}
                required
              />
              <Input
                label="Ngày kết thúc"
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <Input
              label="Địa điểm *"
              placeholder="Nhập địa điểm..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
            <HeroButton type="submit" variant="primary" fullWidth className="rounded-xl">Tạo sự kiện</HeroButton>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
