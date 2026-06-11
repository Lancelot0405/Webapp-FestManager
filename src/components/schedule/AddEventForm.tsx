import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { computeEventStatus } from '../../lib/eventStatus';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

  const inputCls =
    'w-full border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
    'rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]/50 transition-all';

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent position="bottom" hideClose className="w-full max-w-md overflow-hidden">
        <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] overflow-y-auto overflow-x-hidden max-h-[85vh]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Thêm sự kiện mới</h2>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Tên sự kiện *</label>
              <input
                className={inputCls}
                placeholder="Nhập tên sự kiện..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 flex flex-col">
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Ngày bắt đầu *</label>
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
              <div className="min-w-0 flex flex-col">
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Ngày kết thúc</label>
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
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Địa điểm *</label>
              <input
                className={inputCls}
                placeholder="Nhập địa điểm..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
              />
            </div>
            <HeroButton type="submit" variant="primary" fullWidth className="rounded-xl font-semibold">
              Tạo sự kiện
            </HeroButton>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
