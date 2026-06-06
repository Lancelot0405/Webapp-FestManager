// =============================================================================
// src/components/schedule/Schedule.tsx
// =============================================================================

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import AddEventForm from './AddEventForm';

interface ScheduleProps {
  onSelectEvent: (id: number) => void;
}

function parseDate(d: string): number {
  const [dd, mm, yyyy] = d.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`).getTime();
}

export default function Schedule({ onSelectEvent }: ScheduleProps) {
  const { state } = useApp();
  const { events, currentUser, staff } = state;
  const isAdmin = currentUser?.role === 'admin';
  const [showAddForm, setShowAddForm] = useState(false);

  // Staff chỉ thấy events được phân công
  const myStaffMember = !isAdmin && currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;

  const visibleEvents = isAdmin
    ? events
    : events.filter(e => myStaffMember && e.staff.some(s => s.id === myStaffMember.id));

  const sorted = [...visibleEvents].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Lịch sự kiện</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus size={16} />
            Thêm sự kiện
          </button>
        )}
      </div>

      {showAddForm && isAdmin && (
        <AddEventForm onClose={() => setShowAddForm(false)} />
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Chưa có sự kiện nào</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(event => (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{event.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{event.date}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{event.location}</p>
                  <p className="text-xs text-gray-400 mt-1">{event.staff.length} nhân viên</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
