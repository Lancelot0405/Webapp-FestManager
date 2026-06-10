import { useState } from 'react';
import { Plus, User, Trash2, Search, ShieldCheck, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AddStaffForm from './AddStaffForm';
import { SkeletonList } from '@/components/ui/skeleton';
import type { StaffMember } from '../../types';

interface HRGlobalProps {
  onSelectStaff: (id: string) => void;
}

type TypeFilter = 'Tất cả' | 'Nhân viên cứng' | 'Part-time';

export default function HRGlobal({ onSelectStaff }: HRGlobalProps) {
  const { state, deleteStaff, approveRegistration, rejectRegistration } = useApp();
  const { staff, events, currentUser, pendingRegistrations } = state;
  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const [showForm,    setShowForm]    = useState(false);
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState<TypeFilter>('Tất cả');
  const [showPending, setShowPending] = useState(true);

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

  const visibleStaff = canViewAll
    ? staff
    : staff.filter(s => s.userId === currentUser?.id);

  const filtered = visibleStaff.filter(s => {
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
          className="bg-white rounded-xl shadow-card border border-slate-100 hover:border-brand-300 transition-colors flex items-stretch"
        >
          <button
            onClick={() => onSelectStaff(String(s.id))}
            className="flex-1 text-left p-4 min-w-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <User size={18} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500">{s.city}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">{eventCountMap.get(s.id) ?? 0} sự kiện</p>
                <p className="text-xs text-slate-400">{s.contracts.length} hợp đồng</p>
              </div>
            </div>
          </button>
          {isAdmin && (
            <button
              onClick={e => handleDelete(e, s.id, s.name)}
              className="px-3 text-red-300 hover:text-red-500 hover:bg-red-50 border-l border-slate-100 transition-colors rounded-r-xl"
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
        <h1 className="text-xl font-bold text-slate-800">Nhân sự</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 bg-brand-500 text-white text-sm font-semibold px-3 py-2 rounded-lg"
          >
            <Plus size={16} />
            Thêm nhân viên
          </button>
        )}
      </div>

      {/* Pending registrations — admin only */}
      {isAdmin && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPending(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                Yêu cầu đăng ký quản lý
              </span>
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRegistrations.length}
              </span>
            </div>
            <span className="text-indigo-400 text-xs">{showPending ? '▲' : '▼'}</span>
          </button>

          {showPending && (
            <div className="px-4 pb-4 space-y-2">
              {pendingRegistrations.length === 0 && (
                <p className="text-xs text-indigo-400 text-center py-2">
                  Chưa có yêu cầu đăng ký nào
                </p>
              )}
              {pendingRegistrations.map(req => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl p-3 border border-indigo-100 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{req.displayName}</p>
                    <p className="text-xs text-indigo-600">Quản lý · Chờ duyệt</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => approveRegistration(req.userId)}
                      className="flex items-center gap-1 bg-herb-500 hover:bg-herb-600 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Duyệt"
                    >
                      <Check size={12} /> Duyệt
                    </button>
                    <button
                      onClick={() => rejectRegistration(req.userId)}
                      className="flex items-center gap-1 bg-red-400 hover:bg-red-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Từ chối"
                    >
                      <X size={12} /> Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc thành phố..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-brand-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 bg-white text-slate-800 placeholder:text-slate-300"
        />
      </div>

      {/* Type filter pills */}
      {canViewAll && (
        <div className="flex gap-1.5">
          {(['Tất cả', 'Nhân viên cứng', 'Part-time'] as TypeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                typeFilter === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-brand-50 text-slate-600 hover:bg-brand-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {showForm && isAdmin && (
        <AddStaffForm onClose={() => setShowForm(false)} />
      )}

      {state.loading ? (
        <SkeletonList count={4} variant="row" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">Chưa có nhân viên</p>
      ) : typeFilter === 'Tất cả' && canViewAll ? (
        <>
          {permanent.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                  Nhân viên cứng · {permanent.length}
                </span>
              </div>
              {renderList(permanent)}
            </div>
          )}
          {partTime.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Part-time · {partTime.length}
                </span>
              </div>
              {renderList(partTime)}
            </div>
          )}
        </>
      ) : (
        renderList(filtered)
      )}
    </div>
  );
}
