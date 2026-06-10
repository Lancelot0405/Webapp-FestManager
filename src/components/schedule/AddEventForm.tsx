// =============================================================================
// src/components/schedule/AddEventForm.tsx
// =============================================================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { computeEventStatus } from '../../lib/eventStatus';
import Modal from '../shared/ui/Modal';
import Button from '../shared/ui/Button';
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

  const inputClass =
    'w-full max-w-full border border-brand-200 bg-white text-slate-800 placeholder:text-slate-300 ' +
    'rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition-all';

  return (
    <Modal onClose={onClose} className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] overflow-y-auto overflow-x-hidden max-h-[85vh]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-800">Thêm sự kiện mới</h2>
            <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-50 text-slate-500 hover:bg-brand-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Tên sự kiện *</label>
              <input
                className={inputClass}
                placeholder="Nhập tên sự kiện..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 flex flex-col">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Ngày bắt đầu *</label>
                <div className="overflow-hidden rounded-xl">
                  <input
                    type="date"
                    className="border border-brand-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition-all"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) setEndDate('');
                    }}
                    required
                  />
                </div>
              </div>
              <div className="min-w-0 flex flex-col">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Ngày kết thúc</label>
                <div className="overflow-hidden rounded-xl">
                  <input
                    type="date"
                    className="border border-brand-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition-all"
                    value={endDate}
                    min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Địa điểm *</label>
              <input
                className={inputClass}
                placeholder="Nhập địa điểm..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
              />
            </div>
            <Button type="submit" fullWidth>Tạo sự kiện</Button>
          </form>
        </div>
    </Modal>
  );
}
