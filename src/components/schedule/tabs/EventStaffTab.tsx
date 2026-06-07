// =============================================================================
// src/components/schedule/tabs/EventStaffTab.tsx
// =============================================================================

import { useState } from 'react';
import { UserMinus, UserPlus, Check } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import type { FestivalEvent } from '../../../types';

interface Props {
  event: FestivalEvent;
}

export default function EventStaffTab({ event }: Props) {
  const { state, addStaffToEvent, removeStaffFromEvent } = useApp();
  const isAdmin = state.currentUser?.role === 'admin';
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const assignedIds = new Set(event.staff.map(s => s.id));
  const availableStaff = state.staff.filter(s => !assignedIds.has(s.id));

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirmAdd = () => {
    state.staff
      .filter(s => selected.has(s.id))
      .forEach(s => addStaffToEvent(event.id, { id: s.id, name: s.name, city: s.city }));
    setSelected(new Set());
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{event.staff.length} nhân viên được phân công</p>
        {isAdmin && (
          <button
            onClick={() => { setShowAdd(!showAdd); setSelected(new Set()); }}
            className="flex items-center gap-1 text-blue-600 text-sm font-medium"
          >
            <UserPlus size={16} />
            Thêm
          </button>
        )}
      </div>

      {/* Multi-select staff panel */}
      {showAdd && isAdmin && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Chọn nhân viên để thêm</p>
          {availableStaff.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">Tất cả nhân viên đã được phân công</p>
          ) : (
            <>
              {availableStaff.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleSelect(s.id)}
                  className={`w-full flex items-center justify-between text-left rounded-lg px-3 py-2 text-sm transition-colors border ${
                    selected.has(s.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{s.name}{s.city ? ` — ${s.city}` : ''}</span>
                  {selected.has(s.id) && <Check size={15} className="shrink-0" />}
                </button>
              ))}
              <button
                onClick={handleConfirmAdd}
                disabled={selected.size === 0}
                className="w-full mt-1 bg-blue-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg"
              >
                Thêm {selected.size > 0 ? `${selected.size} nhân viên` : ''}
              </button>
            </>
          )}
        </div>
      )}

      {event.staff.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Chưa có nhân viên được phân công</p>
      ) : (
        <div className="space-y-2">
          {event.staff.map(s => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-3 flex justify-between items-center shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{s.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{s.city}</p>
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
