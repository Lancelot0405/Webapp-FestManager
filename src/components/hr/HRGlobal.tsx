import { useState } from 'react';
import { Plus, User, Trash2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AddStaffForm from './AddStaffForm';
import type { StaffMember } from '../../types';

interface HRGlobalProps {
  onSelectStaff: (id: string) => void;
}

type TypeFilter = 'Tất cả' | 'Nhân viên cứng' | 'Part-time';

export default function HRGlobal({ onSelectStaff }: HRGlobalProps) {
  const { state, deleteStaff } = useApp();
  const { staff, events, currentUser } = state;
  const isAdmin = currentUser?.role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Tất cả');

  const eventCountMap = new Map<number, number>();
  for (const event of events) {
    for (const s of event.staff) {
      eventCountMap.set(s.id, (eventCountMap.get(s.id) ?? 0) + 1);
    }
  }

  const handleDelete = (e: React.MouseEvent, staffId: number, staffName: string) => {
    e.stopPropagation();
    if (window.confirm(`Xóa nhân viên "${staffName}"?\nThao tác này không thể hoàn tác.`)) {
      deleteStaff(staffId);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = staff.filter(s => {
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
    const matchType =
      typeFilter === 'Tất cả' ||
      (typeFilter === 'Part-time' && s.staffType === 'part-time') ||
      (typeFilter === 'Nhân viên cứng' && s.staffType !== 'part-time');
    return matchSearch && matchType;
  });

  const permanent = filtered.filter(s => s.staffType !== 'part-time');
  const partTime  = filtered.filter(s => s.staffType === 'part-time');

  const renderList = (list: StaffMember[]) => (
    <div className="space-y-2">
      {list.map(s => (
        <div
          key={s.id}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:border-blue-200 transition-colors flex items-stretch"
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
                <p className="font-semibold text-gray-800 dark:text-gray-100">{s.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.city}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{eventCountMap.get(s.id) ?? 0} sự kiện</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{s.contracts.length} hợp đồng</p>
              </div>
            </div>
          </button>
          {isAdmin && (
            <button
              onClick={e => handleDelete(e, s.id, s.name)}
              className="px-3 text-red-300 hover:text-red-500 hover:bg-red-50 border-l border-gray-100 dark:border-slate-700 transition-colors rounded-r-xl"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Nhân sự</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus size={16} />
            Thêm nhân viên
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc thành phố..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Type filter pills */}
      <div className="flex gap-1.5">
        {(['Tất cả', 'Nhân viên cứng', 'Part-time'] as TypeFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              typeFilter === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {showForm && isAdmin && (
        <AddStaffForm onClose={() => setShowForm(false)} />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Chưa có nhân viên</p>
      ) : typeFilter === 'Tất cả' && isAdmin ? (
        // Grouped view
        <>
          {permanent.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  Nhân viên cứng · {permanent.length}
                </span>
              </div>
              {renderList(permanent)}
            </div>
          )}
          {partTime.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                  Part-time · {partTime.length}
                </span>
              </div>
              {renderList(partTime)}
            </div>
          )}
        </>
      ) : (
        // Flat list when filtered or staff view
        renderList(filtered)
      )}
    </div>
  );
}
