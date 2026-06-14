import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShieldCheck, Check, X } from 'lucide-react';
import { Avatar, Button, Card, Chip, ScrollShadow } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useFABRegister } from '../../hooks/useFABRegister';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { usePendingRegistrationsQuery } from '../../hooks/queries/usePendingRegistrationsQuery';
import { useDeleteStaff } from '../../hooks/queries/mutations/useDeleteStaff';
import { useApproveRegistration } from '../../hooks/queries/mutations/useApproveRegistration';
import { useRejectRegistration } from '../../hooks/queries/mutations/useRejectRegistration';
import AddStaffForm from './AddStaffForm';
import { Input } from '@/components/shared/GlassInput';

import ListSkeleton from '@/components/shared/skeletons/ListSkeleton';
import type { StaffMember } from '../../types';

type TypeFilter = 'Tất cả' | 'Nhân viên cứng' | 'Part-time';

export default function HRGlobal() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { data: staff = [], isLoading } = useStaffQuery();
  const { data: events = [] } = useEventsQuery();
  const { data: pendingRegistrations = [] } = usePendingRegistrationsQuery();
  const deleteStaffMutation = useDeleteStaff();
  const approveRegistrationMutation = useApproveRegistration();
  const rejectRegistrationMutation = useRejectRegistration();

  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const [showForm,    setShowForm]    = useState(false);
  const openForm = useCallback(() => setShowForm(true), []);
  useFABRegister(isAdmin ? openForm : null, 'Thêm nhân viên');
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
      deleteStaffMutation.mutate(staffId);
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

  const getInitials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  const renderList = (list: StaffMember[]) => (
    <ScrollShadow className="max-h-[60vh]">
      <div className="grid grid-cols-2 gap-3">
        {list.map(s => (
          <Card
            key={s.id}
            className="group overflow-hidden transition-all duration-150 hover:border-accent/40 hover:shadow-md active:scale-[0.99] p-0 gap-0"
          >
            {/* Main clickable area */}
            <Button
              variant="ghost"
              onPress={() => navigate('/hr/' + s.id)}
              className="card-btn w-full h-auto justify-start rounded-none rounded-t-xl p-4 text-left group-hover:bg-accent/5 flex flex-col items-start gap-3"
            >
              <Avatar className="size-11 transition-all duration-150 group-hover:ring-2 group-hover:ring-accent/40 group-hover:ring-offset-1 group-hover:ring-offset-surface">
                <Avatar.Fallback className="bg-accent/10 text-accent text-sm font-bold">
                  {getInitials(s.name)}
                </Avatar.Fallback>
              </Avatar>
              <div className="w-full min-w-0">
                <p className="font-semibold text-foreground text-sm leading-tight transition-colors duration-150 group-hover:text-accent truncate">
                  {s.name}
                </p>
                <p className="text-xs text-muted mt-0.5 truncate">{s.city || '—'}</p>
              </div>
            </Button>

            {/* Footer: stats + delete */}
            <div className="border-t border-separator group-hover:border-accent/20 transition-colors duration-150 px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">{eventCountMap.get(s.id) ?? 0} sự kiện</p>
                <p className="text-xs text-muted">{s.contracts.length} hợp đồng</p>
              </div>
              {isAdmin && (
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  onPress={e => handleDelete(e as unknown as React.MouseEvent, s.id, s.name)}
                  className="text-muted hover:text-danger hover:bg-danger/10 rounded-lg h-auto p-1.5 transition-colors"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ScrollShadow>
  );

  return (
    <div className="space-y-4 pb-32">
      {/* Pending registrations — admin only */}
      {isAdmin && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl overflow-hidden">
          <Button
            variant="ghost"
            onPress={() => setShowPending(v => !v)}
            className="card-btn w-full h-auto justify-between rounded-none px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-400">
                Yêu cầu đăng ký quản lý
              </span>
              <Chip size="sm" variant="soft" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-bold">
                {pendingRegistrations.length}
              </Chip>
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
                <Card key={req.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{req.displayName}</p>
                      <p className="text-xs text-indigo-400">Quản lý · Chờ duyệt</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onPress={() => approveRegistrationMutation.mutate(req.userId)}
                        className="text-xs font-medium bg-success/10 text-success border border-success/20 rounded-lg flex items-center gap-1 hover:bg-success/20 transition-colors"
                      >
                        <Check size={12} /> Duyệt
                      </Button>
                      <Button
                        size="sm"
                        onPress={() => rejectRegistrationMutation.mutate(req.userId)}
                        className="text-xs font-medium bg-danger/10 text-danger border border-danger/20 rounded-lg flex items-center gap-1 hover:bg-danger/20 transition-colors"
                      >
                        <X size={12} /> Từ chối
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
                  ? 'bg-accent text-white dark:text-foreground border-accent'
                  : 'bg-default/50 text-foreground/80 border-separator hover:border-accent/30'
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

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">Chưa có nhân viên</p>
      ) : typeFilter === 'Tất cả' && canViewAll ? (
        <>
          {permanent.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Chip size="sm" variant="soft" color="accent" className="font-semibold">
                  Nhân viên cứng · {permanent.length}
                </Chip>
              </div>
              {renderList(permanent)}
            </div>
          )}
          {partTime.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Chip size="sm" variant="soft" className="font-semibold bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  Part-time · {partTime.length}
                </Chip>
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
