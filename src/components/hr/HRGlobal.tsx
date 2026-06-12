import { useState } from 'react';
import { Plus, User, Trash2, ShieldCheck, Check, X } from 'lucide-react';
import { Button, ScrollShadow } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import AddStaffForm from './AddStaffForm';
import { Input } from '@/components/ui/input';
import { Fab } from '@/components/ui/fab';
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
    <ScrollShadow className="max-h-[60vh]">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {list.map(s => (
        <div
          key={s.id}
          className="glass-card rounded-xl overflow-hidden flex flex-row items-stretch"
        >
          <Button
            variant="ghost"
            onPress={() => onSelectStaff(String(s.id))}
            className="flex-1 h-auto min-w-0 justify-start rounded-none p-4 text-left active:bg-[var(--glass-bg)]"
          >
            <div className="flex w-full items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                <User size={18} className="text-[var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text-primary)]">{s.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.city}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[var(--text-muted)]">{eventCountMap.get(s.id) ?? 0} sự kiện</p>
                <p className="text-xs text-[var(--text-muted)]">{s.contracts.length} hợp đồng</p>
              </div>
            </div>
          </Button>
          {isAdmin && (
            <Button
              isIconOnly
              variant="ghost"
              onPress={e => handleDelete(e as unknown as React.MouseEvent, s.id, s.name)}
              className="px-3 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 border-l border-[var(--glass-border)] rounded-none rounded-r-xl h-auto transition-colors"
            >
              <Trash2 size={15} />
            </Button>
          )}
        </div>
      ))}
    </div>
    </ScrollShadow>
  );

  return (
    <div className="space-y-4 pb-20">
      {isAdmin && (
        <>
          <div className="hidden md:flex justify-end">
            <Button
              size="sm"
              onPress={() => setShowForm(true)}
              variant="primary"
              className="flex items-center gap-1.5 rounded-xl font-semibold"
            >
              <Plus size={16} /> Thêm nhân viên
            </Button>
          </div>
          <Fab onPress={() => setShowForm(true)} label="Thêm nhân viên" icon={<Plus size={24} />} />
        </>
      )}

      {/* Pending registrations — admin only */}
      {isAdmin && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl overflow-hidden">
          <Button
            variant="ghost"
            onPress={() => setShowPending(v => !v)}
            className="w-full h-auto justify-between rounded-none px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-400">
                Yêu cầu đăng ký quản lý
              </span>
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRegistrations.length}
              </span>
            </div>
            <span className="text-indigo-400/60 text-xs">{showPending ? '▲' : '▼'}</span>
          </Button>

          {showPending && (
            <div className="px-4 pb-4 space-y-2">
              {pendingRegistrations.length === 0 && (
                <p className="text-xs text-indigo-400/60 text-center py-2">
                  Chưa có yêu cầu đăng ký nào
                </p>
              )}
              {pendingRegistrations.map(req => (
                <div
                  key={req.id}
                  className="glass-card rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{req.displayName}</p>
                      <p className="text-xs text-indigo-400">Quản lý · Chờ duyệt</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onPress={() => approveRegistration(req.userId)}
                        className="text-xs font-medium bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 rounded-lg flex items-center gap-1 hover:bg-[var(--success)]/20 transition-colors"
                      >
                        <Check size={12} /> Duyệt
                      </Button>
                      <Button
                        size="sm"
                        onPress={() => rejectRegistration(req.userId)}
                        className="text-xs font-medium bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg flex items-center gap-1 hover:bg-[var(--danger)]/20 transition-colors"
                      >
                        <X size={12} /> Từ chối
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <Input
        value={search}
        onChange={setSearch}
        placeholder="Tìm theo tên hoặc thành phố..."
      />

      {/* Type filter pills */}
      {canViewAll && (
        <div className="flex gap-1.5">
          {(['Tất cả', 'Nhân viên cứng', 'Part-time'] as TypeFilter[]).map(t => (
            <Button
              key={t}
              variant="ghost"
              onPress={() => setTypeFilter(t)}
              className={`h-auto min-w-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                typeFilter === t
                  ? 'bg-[var(--primary)] text-[var(--background)] border-[var(--primary)]'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/30'
              }`}
            >
              {t}
            </Button>
          ))}
        </div>
      )}

      {showForm && isAdmin && (
        <AddStaffForm onClose={() => setShowForm(false)} />
      )}

      {state.loading ? (
        <SkeletonList count={4} variant="row" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-10">Chưa có nhân viên</p>
      ) : typeFilter === 'Tất cả' && canViewAll ? (
        <>
          {permanent.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-full border border-[var(--primary)]/20">
                  Nhân viên cứng · {permanent.length}
                </span>
              </div>
              {renderList(permanent)}
            </div>
          )}
          {partTime.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
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
