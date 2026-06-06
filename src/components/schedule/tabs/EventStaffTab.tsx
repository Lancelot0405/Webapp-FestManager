// =============================================================================
// src/components/schedule/tabs/EventStaffTab.tsx
// =============================================================================

import { useState } from 'react';
import { UserMinus, UserPlus } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import type { FestivalEvent } from '../../../types';

interface Props {
  event: FestivalEvent;
}

export default function EventStaffTab({ event }: Props) {
  const { state, addStaffToEvent, removeStaffFromEvent } = useApp();
  const isAdmin = state.currentUser?.role === 'admin';
  const [showAdd, setShowAdd] = useState(false);

  const assignedIds = new Set(event.staff.map(s => s.id));
  const availableStaff = state.staff.filter(s => !assignedIds.has(s.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{event.staff.length} nhân viên được phân công</p>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-blue-600 text-sm font-medium"
          >
            <UserPlus size={16} />
            Thêm
          </button>
        )}
      </div>

      {/* Add staff dropdown */}
      {showAdd && isAdmin && availableStaff.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-blue-700 mb-2">Chọn nhân viên để thêm</p>
          {availableStaff.map(s => (
            <button
              key={s.id}
              onClick={() => {
                addStaffToEvent(event.id, { id: s.id, name: s.name, city: s.city });
                setShowAdd(false);
              }}
              className="w-full text-left bg-white rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-blue-100 transition-colors"
            >
              {s.name} — {s.city}
            </button>
          ))}
        </div>
      )}

      {event.staff.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có nhân viên được phân công</p>
      ) : (
        <div className="space-y-2">
          {event.staff.map(s => (
            <div
              key={s.id}
              className="bg-white rounded-xl p-3 flex justify-between items-center shadow-sm border border-gray-100"
            >
              <div>
                <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                <p className="text-xs text-gray-400">{s.city}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => removeStaffFromEvent(event.id, s.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
