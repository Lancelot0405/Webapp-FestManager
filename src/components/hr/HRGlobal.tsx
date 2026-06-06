// =============================================================================
// src/components/hr/HRGlobal.tsx  (admin only)
// =============================================================================

import { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AddStaffForm from './AddStaffForm';

interface HRGlobalProps {
  onSelectStaff: (id: number) => void;
}

export default function HRGlobal({ onSelectStaff }: HRGlobalProps) {
  const { state } = useApp();
  const { staff, events } = state;
  const [showForm, setShowForm] = useState(false);

  // Count events per staff member
  const eventCountMap = new Map<number, number>();
  for (const event of events) {
    for (const s of event.staff) {
      eventCountMap.set(s.id, (eventCountMap.get(s.id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Nhân sự</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
        >
          <Plus size={16} />
          Thêm nhân viên
        </button>
      </div>

      {showForm && (
        <AddStaffForm onClose={() => setShowForm(false)} />
      )}

      {staff.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Chưa có nhân viên</p>
      ) : (
        <div className="space-y-3">
          {staff.map(s => (
            <button
              key={s.id}
              onClick={() => onSelectStaff(s.id)}
              className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{eventCountMap.get(s.id) ?? 0} sự kiện</p>
                  <p className="text-xs text-gray-400">{s.contracts.length} hợp đồng</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
