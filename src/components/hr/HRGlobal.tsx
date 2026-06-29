import { useMemo, useState, useCallback } from 'react';
import type { SortDescriptor } from 'react-aria-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, Check, X, UserPlus, Pencil, Users, UserCheck, UserMinus } from 'lucide-react';
import {
  Avatar, Button, Card, Chip, SearchField,
  Table, ToggleButtonGroup, ToggleButton,
} from '@heroui/react';
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


  // ─── Desktop table ─────────────────────────────────────────────────────────

  const renderDesktopTable = () => (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Danh sách nhân viên"
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <Table.Header>
            <Table.Column isRowHeader allowsSorting id="name">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Nhân viên</Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="city">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Thành phố</Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="staffType">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Loại HĐ</Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="events">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Sự kiện</Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column id="actions">Hành động</Table.Column>
          </Table.Header>
          <Table.Body>
            {sortedFiltered.map(s => (
              <Table.Row
                key={s.id}
                id={s.id}
                onAction={() => navigate('/hr/' + s.id)}
                className="cursor-pointer"
              >
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 shrink-0">
                      <Avatar.Fallback className="bg-accent/10 text-accent text-xs font-bold">
                        {getInitials(s.name)}
                      </Avatar.Fallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{s.name}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-muted">{s.city || '—'}</span>
                </Table.Cell>
                <Table.Cell>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={s.staffType === 'part-time' ? 'default' : 'accent'}
                    className="text-xs font-medium"
                  >
                    {CONTRACT_TYPE_LABEL[s.staffType] ?? s.staffType}
                  </Chip>
                </Table.Cell>
                <Table.Cell>
                  <span className="tabular-nums text-muted">{eventCountMap.get(s.id) ?? 0}</span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={() => navigate('/hr/' + s.id)}
                      className="text-muted hover:text-accent hover:bg-accent/10 rounded-lg"
                    >
                      <Pencil size={14} />
                    </Button>
                    {isAdmin && (
                      <Button
                        isIconOnly
                        variant="ghost"
                        size="sm"
                        onPress={() => handleDelete(s.id, s.name)}
                        className="text-muted hover:text-danger hover:bg-danger/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-32">
      {/* Stats cards */}
      {canViewAll && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5">
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
          <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none tabular-nums text-foreground">
                {totalPermanent}
              </p>
              <p className="text-[11px] text-muted truncate">Cứng</p>
            </div>
          </Card>
          <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
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

      {/* Search + desktop add button */}
      <div className="flex gap-2 items-center">
        <SearchField value={search} onChange={setSearch} className="flex-1" aria-label="Tìm nhân viên">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Tìm theo tên hoặc thành phố..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        {isDesktop && isAdmin && (
          <Button
            onPress={openForm}
            className="shrink-0 flex items-center gap-2 bg-accent text-white"
          >
            <UserPlus size={16} />
            Thêm nhân viên
          </Button>
        )}
      </div>

      {/* Type filter */}
      {canViewAll && (
        <ToggleButtonGroup
          selectionMode="single"
          disallowEmptySelection
          isDetached
          size="sm"
          selectedKeys={new Set([typeFilter])}
          onSelectionChange={keys => {
            const next = [...keys][0];
            if (next !== undefined) setTypeFilter(next as TypeFilter);
          }}
        >
          <ToggleButton id="all">Tất cả</ToggleButton>
          <ToggleButton id="permanent">Nhân viên cứng</ToggleButton>
          <ToggleButton id="part-time">Part-time</ToggleButton>
        </ToggleButtonGroup>
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
                        className: 'bg-danger text-white',
                        onClick: () => handleDelete(s.id, s.name),
                      }]
                    : []),
                ]}
              >
                <Card className="overflow-hidden p-0 gap-0 rounded-xl">
                  <Button
                    variant="ghost"
                    onPress={() => navigate('/hr/' + s.id)}
                    className="card-btn w-full h-auto justify-start rounded-none px-4 py-3 text-left flex flex-row items-center gap-3"
                  >
                    <Avatar className="size-11 shrink-0">
                      <Avatar.Fallback className="bg-accent/10 text-accent text-sm font-bold">
                        {getInitials(s.name)}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-base leading-tight truncate">
                        {s.name}
                      </p>
                      <p className="text-sm text-muted mt-0.5 truncate">{s.city || '—'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Chip
                        size="sm"
                        variant="soft"
                        color={s.staffType === 'part-time' ? 'default' : 'accent'}
                        className="text-xs font-medium"
                      >
                        {CONTRACT_TYPE_LABEL[s.staffType] ?? s.staffType}
                      </Chip>
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
