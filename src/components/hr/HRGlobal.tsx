// =============================================================================
// src/components/hr/HRGlobal.tsx  (admin only)
// =============================================================================

import { useState } from 'react';
import { Plus, User, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AddStaffForm from './AddStaffForm';

interface HRGlobalProps {
  onSelectStaff: (id: string) => void;
}

export default function HRGlobal({ onSelectStaff }: HRGlobalProps) {
  const { state, deleteStaff } = useApp();
  const { staff, events } = state;
  const [showForm, setShowForm] = useState(false);

  const handleDelete = (e: React.MouseEvent, staffId: number, staffName: string) => {
    e.stopPropagation();
    if (window.confirm(`Xóa nhân viên "${staffName}"?\nThao tác này không thể hoàn tác.`)) {
      deleteStaff(staffId);
    }
  };

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
            <div
              key={s.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors flex items-stretch"
            >
              <button
                onClick={() => onSelectStaff(String(s.id))}
                className="flex-1 text-left p-4 min-w-0"
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
              <button
                onClick={e => handleDelete(e, s.id, s.name)}
                className="px-3 text-red-300 hover:text-red-500 hover:bg-red-50 border-l border-gray-100 transition-colors rounded-r-xl"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
