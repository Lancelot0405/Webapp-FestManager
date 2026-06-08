// =============================================================================
// src/components/schedule/AddEventForm.tsx
// =============================================================================

import { useState } from 'react';
import { X } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-0">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl p-5 pb-8 animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Thêm sự kiện mới</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Tên sự kiện *</label>
            <input
              className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all"
              placeholder="Nhập tên sự kiện..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Ngày bắt đầu *</label>
              <input
                type="date"
                className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate('');
                }}
                required
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Ngày kết thúc</label>
              <input
                type="date"
                className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Địa điểm *</label>
            <input
              className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all"
              placeholder="Nhập địa điểm..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md"
          >
            Tạo sự kiện
          </button>
        </form>
      </div>
    </div>
  );
}
