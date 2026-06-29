import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, Check, X, UserPlus, Pencil, Users, UserCheck, UserMinus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { animations } from '../../lib/animations';
import { useApp } from '../../context/AppContext';
import { useFABRegister } from '../../hooks/useFABRegister';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { usePendingRegistrationsQuery } from '../../hooks/queries/usePendingRegistrationsQuery';
import { useDeleteStaff } from '../../hooks/queries/mutations/useDeleteStaff';
import { useApproveRegistration } from '../../hooks/queries/mutations/useApproveRegistration';
import { useRejectRegistration } from '../../hooks/queries/mutations/useRejectRegistration';
import AddStaffForm from './AddStaffForm';
import SwipeableRow from '../shared/SwipeableRow';
import ListSkeleton from '@/components/shared/skeletons/ListSkeleton';
import EmptyState from '@/components/shared/EmptyState';

type TypeFilter = 'all' | 'permanent' | 'part-time';

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  permanent: 'Nhân viên cứng',
  'part-time': 'Part-time',
};

interface SortDescriptor {
  column: 'name' | 'city' | 'staffType' | 'events';
  direction: 'ascending' | 'descending';
}

export default function HRGlobal() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const isDesktop = useIsDesktop(1024);

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
  useFABRegister(isAdmin && !isDesktop ? openForm : null, 'Thêm nhân viên');

  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showPending, setShowPending] = useState(true);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const eventCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const event of events) {
      for (const s of event.staff) {
        map.set(s.id, (map.get(s.id) ?? 0) + 1);
      }
    }
    return map;
  }, [events]);

  const visibleStaff = canViewAll
    ? staff
    : staff.filter(s => s.userId === currentUser?.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleStaff.filter(s => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'permanent' && s.staffType !== 'part-time') ||
        (typeFilter === 'part-time' && s.staffType === 'part-time');
      return matchSearch && matchType;
    });
  }, [visibleStaff, search, typeFilter]);

  const sortedFiltered = useMemo(() => {
    if (!isDesktop) return filtered;
    const list = [...filtered];
    const dir = sortDescriptor.direction === 'descending' ? -1 : 1;
    switch (sortDescriptor.column) {
      case 'city':
        return list.sort((a, b) => dir * a.city.localeCompare(b.city, 'vi'));
      case 'staffType':
        return list.sort((a, b) => dir * a.staffType.localeCompare(b.staffType));
      case 'events':
        return list.sort((a, b) => dir * ((eventCountMap.get(a.id) ?? 0) - (eventCountMap.get(b.id) ?? 0)));
      default:
        return list.sort((a, b) => dir * a.name.localeCompare(b.name, 'vi'));
    }
  }, [filtered, isDesktop, sortDescriptor, eventCountMap]);

  const totalPermanent = visibleStaff.filter(s => s.staffType !== 'part-time').length;
  const totalPartTime  = visibleStaff.filter(s => s.staffType === 'part-time').length;

  const handleDelete = (staffId: number, staffName: string) => {
    if (window.confirm(`Xóa nhân viên "${staffName}"?\nThao tác này không thể hoàn tác.`)) {
      deleteStaffMutation.mutate(staffId);
    }
  };

  const handleSort = (column: SortDescriptor['column']) => {
    setSortDescriptor(prev => {
      const isAsc = prev.column === column && prev.direction === 'ascending';
      return {
        column,
        direction: isAsc ? 'descending' : 'ascending',
      };
    });
  };

  const renderSortArrow = (column: SortDescriptor['column']) => {
    if (sortDescriptor.column !== column) return null;
    return sortDescriptor.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  // ─── Desktop table ─────────────────────────────────────────────────────────

  const renderDesktopTable = () => (
    <div className="relative w-full overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead onClick={() => handleSort('name')} className="cursor-pointer select-none font-medium text-xs text-muted-foreground py-3 pl-5 bg-muted/50 dark:bg-default-100/20">
              Nhân viên{renderSortArrow('name')}
            </TableHead>
            <TableHead onClick={() => handleSort('city')} className="cursor-pointer select-none font-medium text-xs text-muted-foreground py-3 bg-muted/50 dark:bg-default-100/20">
              Thành phố{renderSortArrow('city')}
            </TableHead>
            <TableHead onClick={() => handleSort('staffType')} className="cursor-pointer select-none font-medium text-xs text-muted-foreground py-3 bg-muted/50 dark:bg-default-100/20">
              Loại HĐ{renderSortArrow('staffType')}
            </TableHead>
            <TableHead onClick={() => handleSort('events')} className="cursor-pointer select-none font-medium text-xs text-muted-foreground py-3 bg-muted/50 dark:bg-default-100/20">
              Sự kiện{renderSortArrow('events')}
            </TableHead>
            <TableHead className="font-medium text-xs text-muted-foreground py-3 bg-muted/50 dark:bg-default-100/20">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFiltered.map(s => (
            <TableRow
              key={s.id}
              onClick={() => navigate('/hr/' + s.id)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 dark:hover:bg-default-100/5 transition-colors"
            >
              <TableCell className="py-3.5 pl-5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 shrink-0 shadow-sm">
                    <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">
                      {getInitials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground">{s.name}</span>
                </div>
              </TableCell>
              <TableCell className="py-3.5">
                <span className="text-muted">{s.city || '—'}</span>
              </TableCell>
              <TableCell className="py-3.5">
                <Badge className={`border-none text-xs font-medium px-2 py-0.5 rounded-full hover:bg-transparent ${
                  s.staffType === 'part-time' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  {CONTRACT_TYPE_LABEL[s.staffType] ?? s.staffType}
                </Badge>
              </TableCell>
              <TableCell className="py-3.5">
                <span className="tabular-nums text-muted">{eventCountMap.get(s.id) ?? 0}</span>
              </TableCell>
              <TableCell className="py-3.5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/hr/' + s.id)}
                    className="text-muted hover:text-accent hover:bg-accent/10 rounded-lg h-8 w-8 p-0 flex items-center justify-center"
                    aria-label="Sửa"
                  >
                    <Pencil size={14} />
                  </Button>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-muted hover:text-danger hover:bg-danger/10 rounded-lg h-8 w-8 p-0 flex items-center justify-center"
                      aria-label="Xóa"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4 pb-32">
      {/* Stats cards */}
      {canViewAll && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5 border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none tabular-nums text-foreground">
                {visibleStaff.length}
              </p>
              <p className="text-[11px] text-muted truncate">Tổng NV</p>
            </div>
          </Card>
          <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5 border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none tabular-nums text-foreground">
                {totalPermanent}
              </p>
              <p className="text-[11px] text-muted truncate">Cứng</p>
            </div>
          </Card>
          <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5 border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <UserMinus size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none tabular-nums text-foreground">
                {totalPartTime}
              </p>
              <p className="text-[11px] text-muted truncate">Part-time</p>
            </div>
          </Card>
        </div>
      )}

      {/* Pending registrations — admin only */}
      {isAdmin && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPending(v => !v)}
            className="w-full h-auto justify-between rounded-none px-4 py-3 hover:bg-indigo-500/5 hover:text-indigo-400"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-400">
                Yêu cầu đăng ký quản lý
              </span>
              <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold hover:bg-indigo-500/20 px-2 py-0.5 rounded-full">
                {pendingRegistrations.length}
              </Badge>
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
                <Card key={req.id} className="p-3 border">
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
                        type="button"
                        size="sm"
                        onClick={() => approveRegistrationMutation.mutate(req.userId)}
                        className="text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-1 hover:bg-emerald-500/20 hover:text-emerald-600 transition-colors px-2.5 h-8"
                      >
                        <Check size={12} /> Duyệt
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => rejectRegistrationMutation.mutate(req.userId)}
                        className="text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-center gap-1 hover:bg-destructive/20 hover:text-destructive transition-colors px-2.5 h-8"
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

      {/* Search + desktop add button */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm theo tên hoặc thành phố..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
            aria-label="Tìm nhân viên"
          />
        </div>
        {isDesktop && isAdmin && (
          <Button
            type="button"
            onClick={openForm}
            className="shrink-0 flex items-center gap-2 bg-accent text-white hover:bg-accent/90 rounded-xl h-9 px-4 font-semibold text-sm"
          >
            <UserPlus size={16} />
            Thêm nhân viên
          </Button>
        )}
      </div>

      {/* Type filter */}
      {canViewAll && (
        <ToggleGroup
          type="single"
          value={typeFilter}
          onValueChange={(val) => {
            if (val) setTypeFilter(val as TypeFilter);
          }}
          className="justify-start gap-1 bg-muted/40 p-1 rounded-xl w-max border"
        >
          <ToggleGroupItem value="all" className="rounded-lg text-xs font-semibold px-3 py-1.5 h-8">Tất cả</ToggleGroupItem>
          <ToggleGroupItem value="permanent" className="rounded-lg text-xs font-semibold px-3 py-1.5 h-8">Nhân viên cứng</ToggleGroupItem>
          <ToggleGroupItem value="part-time" className="rounded-lg text-xs font-semibold px-3 py-1.5 h-8">Part-time</ToggleGroupItem>
        </ToggleGroup>
      )}

      {showForm && isAdmin && (
        <AddStaffForm onClose={() => setShowForm(false)} />
      )}

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={26} />} title="Chưa có nhân viên" description="Thêm nhân viên để bắt đầu quản lý nhân sự." />
      ) : isDesktop ? (
        renderDesktopTable()
      ) : (
        <div className="space-y-2">
          {sortedFiltered.map((s, i) => (
            <motion.div key={s.id} {...animations.listItem(i)}>
              <SwipeableRow
                className="rounded-xl"
                actions={[
                  {
                    icon: <Pencil size={16} />,
                    label: 'Sửa',
                    className: 'bg-accent text-white',
                    onClick: () => navigate('/hr/' + s.id),
                  },
                  ...(isAdmin
                    ? [{
                        icon: <Trash2 size={16} />,
                        label: 'Xoá',
                        className: 'bg-destructive text-destructive-foreground',
                        onClick: () => handleDelete(s.id, s.name),
                      }]
                    : []),
                ]}
              >
                <Card className="overflow-hidden p-0 gap-0 rounded-xl border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/hr/' + s.id)}
                    className="w-full h-auto justify-start rounded-none px-4 py-3 text-left flex flex-row items-center gap-3 hover:bg-muted/50"
                  >
                    <Avatar className="size-11 shrink-0 shadow-sm">
                      <AvatarFallback className="bg-accent/10 text-accent text-sm font-bold flex items-center justify-center">
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-base leading-tight truncate">
                        {s.name}
                      </p>
                      <p className="text-sm text-muted mt-0.5 truncate">{s.city || '—'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge className={`border-none text-xs font-medium px-2 py-0.5 rounded-full hover:bg-transparent ${
                        s.staffType === 'part-time' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {CONTRACT_TYPE_LABEL[s.staffType] ?? s.staffType}
                      </Badge>
                      <p className="text-xs text-muted mt-1">{eventCountMap.get(s.id) ?? 0} sự kiện</p>
                    </div>
                  </Button>
                </Card>
              </SwipeableRow>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
