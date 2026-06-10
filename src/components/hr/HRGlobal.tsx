import { useState } from 'react';
import { Plus, User, Trash2, Search, ShieldCheck, Check, X } from 'lucide-react';
import { Button, Card, Chip, Input } from '@heroui/react';
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
        <Card
          key={s.id}
          className="border border-slate-100 hover:border-brand-300 transition-colors flex flex-row items-stretch shadow-card rounded-xl overflow-hidden"
          shadow="none"
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
            <Button
              isIconOnly
              variant="light"
              onPress={e => handleDelete(e as unknown as React.MouseEvent, s.id, s.name)}
              className="px-3 text-red-300 hover:text-red-500 hover:bg-red-50 border-l border-slate-100 rounded-none rounded-r-xl h-auto"
            >
              <Trash2 size={15} />
            </Button>
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Nhân sự</h1>
        {isAdmin && (
          <Button
            color="primary"
            size="sm"
            onPress={() => setShowForm(true)}
            startContent={<Plus size={16} />}
            className="font-semibold"
          >
            Thêm nhân viên
          </Button>
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
                <Card
                  key={req.id}
                  className="p-3 border border-indigo-100 rounded-xl"
                  shadow="none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{req.displayName}</p>
                      <p className="text-xs text-indigo-600">Quản lý · Chờ duyệt</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        color="success"
                        onPress={() => approveRegistration(req.userId)}
                        startContent={<Check size={12} />}
                        className="text-xs font-medium text-white"
                        title="Duyệt"
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        onPress={() => rejectRegistration(req.userId)}
                        startContent={<X size={12} />}
                        className="text-xs font-medium"
                        title="Từ chối"
                      >
                        Từ chối
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <Input
        size="sm"
        variant="bordered"
        placeholder="Tìm theo tên hoặc thành phố..."
        value={search}
        onValueChange={setSearch}
        startContent={<Search size={15} className="text-slate-400" />}
        classNames={{
          inputWrapper: 'border-brand-200 focus-within:border-brand-400 bg-white rounded-xl',
          input: 'text-slate-800 placeholder:text-slate-300',
        }}
      />

      {/* Type filter pills */}
      {canViewAll && (
        <div className="flex gap-1.5">
          {(['Tất cả', 'Nhân viên cứng', 'Part-time'] as TypeFilter[]).map(t => (
            <Chip
              key={t}
              variant={typeFilter === t ? 'flat' : 'bordered'}
              color={typeFilter === t ? 'primary' : 'default'}
              onClick={() => setTypeFilter(t)}
              className="cursor-pointer text-xs font-semibold"
            >
              {t}
            </Chip>
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
