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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-slate-600 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Thêm sự kiện mới</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Tên sự kiện</label>
          <input
            className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Nhập tên sự kiện..."
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Ngày bắt đầu</label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:[color-scheme:dark] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) setEndDate('');
              }}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Ngày kết thúc</label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:[color-scheme:dark] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Địa điểm</label>
          <input
            className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Nhập địa điểm..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Tạo sự kiện
        </button>
      </form>
    </div>
  );
}
