import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Package, Clock,
  DollarSign, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Search, ChevronRight,
} from 'lucide-react';
import { Avatar, Button, Card } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useInventoryQuery } from '../../hooks/queries/useInventoryQuery';
import StatusBadge from '../shared/StatusBadge';
import type { FestivalEvent, StaffMember, InventoryItem, StaffRef, CurrentUser } from '../../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDate(d: string): Date {
  const [dd, mm, yyyy] = d.split('-');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

function monthKey(d: string): string {
  const [, mm, yyyy] = d.split('-');
  return `${yyyy}-${mm}`;
}

function sumExpenses(e: FestivalEvent): number {
  return Object.values(e.financials.expenses).reduce((s, v) => s + (v ?? 0), 0);
}

function pct(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? name[0] ?? '?').toUpperCase();
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { data: events    = [] } = useEventsQuery();
  const { data: inventory = [] } = useInventoryQuery();
  const { data: staff     = [] } = useStaffQuery();

  if (!currentUser) return null;

  const canViewAll = currentUser.role === 'admin' || currentUser.role === 'manager';

  if (!canViewAll) {
    return <StaffDashboard events={events} staff={staff} currentUser={currentUser} navigate={navigate} />;
  }

  return <AdminDashboard events={events} staff={staff} inventory={inventory} currentUser={currentUser} navigate={navigate} />;
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

type TabKey = 'overview' | 'finance' | 'hr' | 'inventory';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',  label: 'Tổng quan' },
  { key: 'finance',   label: 'Tài chính' },
  { key: 'hr',        label: 'Nhân sự'   },
  { key: 'inventory', label: 'Kho hàng'  },
];

function AdminDashboard({ events, staff, inventory, currentUser, navigate }: {
  events: FestivalEvent[];
  staff: StaffMember[];
  inventory: InventoryItem[];
  currentUser: CurrentUser;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted">{greeting()}</p>
        <h1 className="text-2xl font-bold text-foreground">{currentUser.name} 👋</h1>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mb-0.5 no-scrollbar">
        <div className="flex gap-1 p-1 bg-default/60 rounded-xl shrink-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-[var(--surface)] shadow-sm text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab  events={events} staff={staff} inventory={inventory} navigate={navigate} />}
      {tab === 'finance'   && <FinanceTab   events={events} navigate={navigate} />}
      {tab === 'hr'        && <HRTab        events={events} staff={staff} navigate={navigate} />}
      {tab === 'inventory' && <InventoryTab inventory={inventory} navigate={navigate} />}
    </div>
  );
}

// ─── Tab: Tổng quan ──────────────────────────────────────────────────────────

function OverviewTab({ events, staff, inventory, navigate }: {
  events: FestivalEvent[];
  staff: StaffMember[];
  inventory: InventoryItem[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const now  = new Date();
  const curM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevM = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`;

  const totalIncome   = events.reduce((s, e) => s + e.financials.income, 0);
  const totalExpenses = events.reduce((s, e) => s + sumExpenses(e), 0);
  const lowStock      = inventory.filter(i => i.current <= i.threshold).length;
  const pendingCount  = events.flatMap(e => e.receipts).filter(r => r.status === 'pending').length;

  const curIncome  = events.filter(e => monthKey(e.date) === curM).reduce((s, e) => s + e.financials.income, 0);
  const prevIncome = events.filter(e => monthKey(e.date) === prevM).reduce((s, e) => s + e.financials.income, 0);
  const curEvents  = events.filter(e => monthKey(e.date) === curM).length;
  const prevEvents = events.filter(e => monthKey(e.date) === prevM).length;

  const incomeDelta = pct(curIncome, prevIncome);
  const eventsDelta = pct(curEvents, prevEvents);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<DollarSign size={16} />}
          label="Tổng doanh thu"
          value={totalIncome.toLocaleString('fr-FR') + '€'}
          delta={incomeDelta}
          color="indigo"
          onClick={() => navigate('/finance')}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Tổng chi phí"
          value={totalExpenses.toLocaleString('fr-FR') + '€'}
          color="amber"
          onClick={() => navigate('/finance')}
        />
        <StatCard
          icon={<Calendar size={16} />}
          label="Sự kiện"
          value={String(events.length)}
          delta={eventsDelta}
          color="violet"
          onClick={() => navigate('/schedule')}
        />
        <StatCard
          icon={<Users size={16} />}
          label="Nhân viên"
          value={String(staff.length)}
          color="emerald"
          onClick={() => navigate('/hr')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Doanh thu theo tháng</h3>
            <span className="text-xs text-muted">6 tháng gần nhất</span>
          </div>
          <RevenueBarChart events={events} />
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Sự kiện theo tháng</h3>
            <span className="text-xs text-muted">6 tháng gần nhất</span>
          </div>
          <EventsLineChart events={events} />
        </Card>
      </div>

      {/* Events table */}
      <EventsTable
        events={events}
        navigate={navigate}
        title="Tất cả sự kiện"
        emptyText="Chưa có sự kiện nào"
      />
    </div>
  );
}

// ─── Tab: Tài chính ──────────────────────────────────────────────────────────

function FinanceTab({ events, navigate }: {
  events: FestivalEvent[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const totalIncome   = events.reduce((s, e) => s + e.financials.income, 0);
  const totalExpenses = events.reduce((s, e) => s + sumExpenses(e), 0);
  const profit        = totalIncome - totalExpenses;
  const pending       = events.flatMap(e => e.receipts).filter(r => r.status === 'pending');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign size={16} />} label="Doanh thu" value={totalIncome.toLocaleString('fr-FR') + '€'} color="indigo" onClick={() => navigate('/finance')} />
        <StatCard icon={<TrendingUp size={16} />} label="Chi phí"   value={totalExpenses.toLocaleString('fr-FR') + '€'} color="amber" onClick={() => navigate('/finance')} />
        <StatCard icon={<DollarSign size={16} />} label="Lợi nhuận" value={profit.toLocaleString('fr-FR') + '€'} color={profit >= 0 ? 'emerald' : 'danger'} onClick={() => navigate('/finance')} />
        <StatCard icon={<Clock size={16} />}      label="Chờ duyệt" value={String(pending.length)} color={pending.length > 0 ? 'danger' : 'emerald'} onClick={() => navigate('/finance')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Doanh thu & Chi phí theo tháng</h3>
          <IncomeExpenseChart events={events} />
        </Card>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Chi phí chờ duyệt</h3>
            <Button variant="ghost" onPress={() => navigate('/finance')}
              className="h-auto p-0 min-w-0 text-xs text-accent font-medium hover:bg-transparent">
              Xem tất cả <ChevronRight size={12} />
            </Button>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">Không có chi phí nào chờ duyệt</p>
          ) : (
            <div className="divide-y divide-[var(--separator)]">
              {pending.slice(0, 6).map(exp => (
                <div key={exp.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exp.staffName}</p>
                    <p className="text-xs text-muted">{exp.type} · {exp.date}</p>
                  </div>
                  <span className="text-sm font-bold text-accent">{exp.amount}€</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Nhân sự ────────────────────────────────────────────────────────────

function HRTab({ events, staff, navigate }: {
  events: FestivalEvent[];
  staff: StaffMember[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [search, setSearch] = useState('');

  const eventCounts = useMemo(() => {
    const map: Record<number, number> = {};
    events.forEach(e => e.staff.forEach(s => { map[s.id] = (map[s.id] ?? 0) + 1; }));
    return map;
  }, [events]);

  const permanent = staff.filter(s => s.staffType === 'permanent').length;
  const partTime  = staff.filter(s => s.staffType === 'part-time').length;

  const filtered = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
  }, [staff, search]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={<Users size={16} />}    label="Tổng nhân viên"   value={String(staff.length)} color="indigo" onClick={() => navigate('/hr')} />
        <StatCard icon={<Users size={16} />}    label="Cố định"          value={String(permanent)}    color="violet" onClick={() => navigate('/hr')} />
        <StatCard icon={<Calendar size={16} />} label="Bán thời gian"    value={String(partTime)}     color="amber"  onClick={() => navigate('/hr')} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-separator flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground">Danh sách nhân viên <span className="text-muted font-normal">({staff.length})</span></h3>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg bg-default/60 border border-separator text-foreground placeholder:text-muted outline-none focus:border-accent/50 transition-colors w-44"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted border-b border-separator bg-default/30">
          <span>Nhân viên</span>
          <span>Thành phố</span>
          <span>Loại hợp đồng</span>
          <span>Sự kiện</span>
        </div>

        <div className="divide-y divide-[var(--separator)]">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Không tìm thấy nhân viên</p>
          ) : (
            filtered.map(s => (
              <div
                key={s.id}
                className="flex md:grid md:grid-cols-[1fr_1fr_1fr_auto] items-center gap-3 md:gap-4 px-4 py-3 hover:bg-default/30 transition-colors cursor-pointer"
                onClick={() => navigate('/hr')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-accent">{initials(s.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted md:hidden">{s.city}</p>
                  </div>
                </div>
                <p className="hidden md:block text-sm text-muted">{s.city}</p>
                <div className="hidden md:block">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.staffType === 'permanent'
                      ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {s.staffType === 'permanent' ? 'Cố định' : 'Bán thời gian'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground ml-auto md:ml-0">
                  {eventCounts[s.id] ?? 0}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Kho hàng ───────────────────────────────────────────────────────────

function InventoryTab({ inventory, navigate }: {
  inventory: InventoryItem[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const low    = inventory.filter(i => i.current <= i.threshold);
  const ok     = inventory.filter(i => i.current > i.threshold);
  const critical = low.filter(i => i.current === 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={<Package size={16} />}       label="Tổng mặt hàng" value={String(inventory.length)} color="indigo"  onClick={() => navigate('/inventory')} />
        <StatCard icon={<AlertTriangle size={16} />} label="Sắp hết hàng"  value={String(low.length)}       color={low.length > 0 ? 'danger' : 'emerald'}  onClick={() => navigate('/inventory')} />
        <StatCard icon={<Package size={16} />}       label="Đủ hàng"       value={String(ok.length)}        color="emerald" onClick={() => navigate('/inventory')} />
      </div>

      {low.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-separator">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-danger" /> Hàng cần bổ sung
            </h3>
            <Button variant="ghost" onPress={() => navigate('/inventory')}
              className="h-auto p-0 min-w-0 text-xs text-accent font-medium hover:bg-transparent">
              Xem tất cả <ChevronRight size={12} />
            </Button>
          </div>
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted border-b border-separator bg-default/30">
            <span>Tên hàng</span>
            <span>Hiện tại</span>
            <span>Ngưỡng cảnh báo</span>
            <span>Trạng thái</span>
          </div>
          <div className="divide-y divide-[var(--separator)]">
            {low.map(item => (
              <div key={item.id} className="flex md:grid md:grid-cols-[1fr_auto_auto_auto] items-center gap-3 md:gap-4 px-4 py-3 hover:bg-default/30 transition-colors">
                <p className="text-sm font-medium text-foreground flex-1">{item.name}</p>
                <span className="text-sm font-bold text-danger">{item.current} {item.unit}</span>
                <span className="hidden md:inline text-sm text-muted">{item.threshold} {item.unit}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                  item.current === 0
                    ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}>
                  {item.current === 0 ? 'Hết hàng' : 'Sắp hết'}
                </span>
              </div>
            ))}
            {critical.length > 0 && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-500/5">
                <p className="text-xs text-danger font-medium">{critical.length} mặt hàng đã hết hoàn toàn</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {low.length === 0 && (
        <Card className="py-10 flex flex-col items-center gap-2">
          <Package size={32} className="text-emerald-500" />
          <p className="text-sm font-medium text-foreground">Kho hàng đang ở mức tốt</p>
          <p className="text-xs text-muted">Tất cả mặt hàng đều trên ngưỡng cảnh báo</p>
        </Card>
      )}
    </div>
  );
}

// ─── Staff Dashboard ──────────────────────────────────────────────────────────

function StaffDashboard({ events, staff, currentUser, navigate }: {
  events: FestivalEvent[];
  staff: StaffMember[];
  currentUser: CurrentUser;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const myMember = staff.find(s => s.userId === currentUser.id)
    ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase());
  const myId = myMember?.id ?? null;

  const myEvents   = myId ? events.filter(e => e.staff.some(s => s.id === myId)) : [];
  const myPending  = events.flatMap(e => e.receipts).filter(r => r.status === 'pending' && myId != null && r.staffId === String(myId));
  const upcoming   = myEvents.filter(e => e.status === 'Sắp tới' || e.status === 'Lên kế hoạch' || e.status === 'Đang diễn ra');

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">{greeting()}</p>
        <h1 className="text-2xl font-bold text-foreground">{currentUser.name} 👋</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Calendar size={16} />}
          label="Sự kiện của tôi"
          value={String(myEvents.length)}
          color="indigo"
          onClick={() => navigate('/schedule')}
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Chi phí chờ duyệt"
          value={String(myPending.length)}
          color={myPending.length > 0 ? 'danger' : 'emerald'}
          onClick={() => navigate('/profile')}
        />
      </div>

      <EventsTable
        events={upcoming}
        navigate={navigate}
        title="Sự kiện sắp tới của tôi"
        emptyText="Không có sự kiện nào"
      />

      {myPending.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-separator">
            <h3 className="text-sm font-semibold text-foreground">Chi phí chờ duyệt</h3>
          </div>
          <div className="divide-y divide-[var(--separator)]">
            {myPending.map(exp => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{exp.type}</p>
                  <p className="text-xs text-muted">{exp.date}</p>
                </div>
                <span className="text-sm font-bold text-accent">{exp.amount}€</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Events Table ─────────────────────────────────────────────────────────────

function EventsTable({ events, navigate, title, emptyText }: {
  events: FestivalEvent[];
  navigate: ReturnType<typeof useNavigate>;
  title: string;
  emptyText: string;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  }, [events, search]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()),
  [filtered]);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-separator flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {title} <span className="text-muted font-normal">({events.length})</span>
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="pl-7 pr-3 py-1.5 text-xs rounded-lg bg-default/60 border border-separator text-foreground placeholder:text-muted outline-none focus:border-accent/50 transition-colors w-44"
          />
        </div>
      </div>

      {/* Column headers — desktop only */}
      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted border-b border-separator bg-default/30">
        <span>Sự kiện</span>
        <span>Ngày</span>
        <span>Địa điểm</span>
        <span>Nhân viên</span>
        <span>Trạng thái</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--separator)]">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">{emptyText}</p>
        ) : (
          sorted.map(event => (
            <button
              key={event.id}
              onClick={() => navigate('/schedule/' + event.id)}
              className="w-full text-left flex md:grid md:grid-cols-[2fr_1fr_1.5fr_1fr_auto] items-center gap-3 md:gap-4 px-4 py-3 hover:bg-default/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                  {event.name}
                </p>
                <p className="text-xs text-muted md:hidden">{event.date} · {event.location}</p>
              </div>
              <p className="hidden md:block text-sm text-muted shrink-0">{event.date}</p>
              <p className="hidden md:block text-sm text-muted truncate">{event.location}</p>
              <div className="hidden md:flex items-center gap-1.5">
                <StaffAvatarGroup members={event.staff} />
              </div>
              <div className="ml-auto md:ml-0 shrink-0">
                <StatusBadge status={event.status} />
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type StatColor = 'indigo' | 'violet' | 'emerald' | 'amber' | 'danger';

const colorMap: Record<StatColor, { icon: string; badge: string }> = {
  indigo:  { icon: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',  badge: 'bg-indigo-50  dark:bg-indigo-500/10  text-indigo-600  dark:text-indigo-400'  },
  violet:  { icon: 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',  badge: 'bg-violet-50  dark:bg-violet-500/10  text-violet-600  dark:text-violet-400'  },
  emerald: { icon: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  amber:   { icon: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',      badge: 'bg-amber-50   dark:bg-amber-500/10   text-amber-600   dark:text-amber-400'   },
  danger:  { icon: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',              badge: 'bg-red-50    dark:bg-red-500/10    text-red-600    dark:text-red-400'       },
};

function StatCard({ icon, label, value, delta, color = 'indigo', onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number | null;
  color?: StatColor;
  onClick?: () => void;
}) {
  const c = colorMap[color];
  return (
    <Card className="p-0 overflow-hidden hover:shadow-md transition-all duration-150 cursor-pointer" onClick={onClick}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
            {icon}
          </div>
          {delta != null && (
            <span className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
              delta >= 0
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {delta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted mt-1">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Staff Avatar Group ───────────────────────────────────────────────────────

function StaffAvatarGroup({ members }: { members: StaffRef[] }) {
  if (members.length === 0) return <span className="text-xs text-muted">–</span>;
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map(m => (
        <div key={m.id} className="w-6 h-6 rounded-full bg-accent/10 ring-2 ring-[var(--surface)] flex items-center justify-center">
          <span className="text-[9px] font-bold text-accent">{initials(m.name)}</span>
        </div>
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-default/80 ring-2 ring-[var(--surface)] flex items-center justify-center">
          <span className="text-[9px] font-semibold text-muted">+{extra}</span>
        </div>
      )}
    </div>
  );
}

// ─── Revenue Bar Chart ────────────────────────────────────────────────────────

function RevenueBarChart({ events }: { events: FestivalEvent[] }) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      const k = monthKey(e.date);
      map[k] = (map[k] ?? 0) + e.financials.income;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, v]) => ({ label: k.slice(5) + '/' + k.slice(2, 4), value: v }));
  }, [events]);

  if (data.length === 0) return <p className="text-sm text-muted py-6 text-center">Chưa có dữ liệu</p>;

  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * 100, 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${h}%`, background: 'linear-gradient(180deg, #6366F1, #8B5CF6)' }}
                title={d.value.toLocaleString('fr-FR') + '€'}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Events Line Chart (SVG) ──────────────────────────────────────────────────

function EventsLineChart({ events }: { events: FestivalEvent[] }) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      const k = monthKey(e.date);
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, v]) => ({ label: k.slice(5) + '/' + k.slice(2, 4), value: v }));
  }, [events]);

  if (data.length === 0) return <p className="text-sm text-muted py-6 text-center">Chưa có dữ liệu</p>;

  const max = Math.max(...data.map(d => d.value), 1);
  const W = 300; const H = 100; const PAD = 8;
  const points = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + (1 - d.value / max) * (H - PAD * 2);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${path} L ${points[points.length - 1]!.x} ${H} L ${points[0]!.x} ${H} Z`;

  return (
    <div className="space-y-1.5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 128 }}>
        <defs>
          <linearGradient id="evtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#evtGrad)" />
        <path d={path} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366F1" />
        ))}
      </svg>
      <div className="flex">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Income/Expense Chart (Finance tab) ───────────────────────────────────────

function IncomeExpenseChart({ events }: { events: FestivalEvent[] }) {
  const data = useMemo(() => {
    const inc: Record<string, number> = {};
    const exp: Record<string, number> = {};
    events.forEach(e => {
      const k = monthKey(e.date);
      inc[k] = (inc[k] ?? 0) + e.financials.income;
      exp[k] = (exp[k] ?? 0) + sumExpenses(e);
    });
    const keys = [...new Set([...Object.keys(inc), ...Object.keys(exp)])].sort().slice(-6);
    return keys.map(k => ({
      label: k.slice(5) + '/' + k.slice(2, 4),
      income: inc[k] ?? 0,
      expense: exp[k] ?? 0,
    }));
  }, [events]);

  if (data.length === 0) return <p className="text-sm text-muted py-6 text-center">Chưa có dữ liệu</p>;

  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex items-end gap-0.5">
            <div className="flex-1 rounded-t-sm" style={{ height: `${Math.max((d.income / max) * 100, 2)}%`, background: '#6366F1' }} title={'Thu: ' + d.income.toLocaleString()} />
            <div className="flex-1 rounded-t-sm" style={{ height: `${Math.max((d.expense / max) * 100, 2)}%`, background: '#F59E0B' }} title={'Chi: ' + d.expense.toLocaleString()} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 justify-end">
        <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Doanh thu</span>
        <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Chi phí</span>
      </div>
    </div>
  );
}
