// =============================================================================
// src/components/schedule/AddEventForm.tsx
// =============================================================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EventStatus, FestivalEvent } from '../../types';

interface AddEventFormProps {
  onClose: () => void;
}

export default function AddEventForm({ onClose }: AddEventFormProps) {
  const { addEvent } = useApp();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<EventStatus>('Lên kế hoạch');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date || !location.trim()) return;

    // Convert date from yyyy-mm-dd (HTML input) to DD-MM-YYYY
    const [yyyy, mm, dd] = date.split('-');
    const formattedDate = `${dd}-${mm}-${yyyy}`;

    const newEvent: FestivalEvent = {
      id: Date.now(),
      name: name.trim(),
      date: formattedDate,
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

  const statuses: EventStatus[] = ['Lên kế hoạch', 'Sắp tới', 'Đang diễn ra', 'Đã hoàn thành'];

  return (
    <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Thêm sự kiện mới</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Tên sự kiện</label>
          <input
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Nhập tên sự kiện..."
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Ngày</label>
          <input
            type="date"
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Địa điểm</label>
          <input
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Nhập địa điểm..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Trạng thái</label>
          <select
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            value={status}
            onChange={e => setStatus(e.target.value as EventStatus)}
          >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
