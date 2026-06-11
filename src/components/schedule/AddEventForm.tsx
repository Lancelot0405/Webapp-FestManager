import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { computeEventStatus } from '../../lib/eventStatus';
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

  const inputCls =
    'w-full border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
    'rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]/50 transition-all';

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
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Tên sự kiện *</label>
          <input
            className={inputCls}
            placeholder="Nhập tên sự kiện..."
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Ngày bắt đầu *</label>
            <input
              type="date"
              className={`${inputCls} [color-scheme:dark]`}
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) setEndDate('');
              }}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Ngày kết thúc</label>
            <input
              type="date"
              className={`${inputCls} [color-scheme:dark]`}
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Địa điểm *</label>
          <input
            className={inputCls}
            placeholder="Nhập địa điểm..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="primary" fullWidth className="rounded-lg">
          Tạo sự kiện
        </Button>
      </form>
    </div>
  );
}
