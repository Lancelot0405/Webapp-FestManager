import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Package, Clock,
  AlertTriangle,
  Search, ChevronRight,
  RotateCw, Bell, Download, SlidersHorizontal, ArrowUpDown, LayoutGrid,
} from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
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
  return Object.values(e.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
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
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const { notifications } = useRealtimeNotifications(isAdminOrManager);
  const notifCount = notifications.length;

  return (
    <div className="space-y-5">
      {/* Greeting & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            {greeting()}, {currentUser.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" isIconOnly size="sm" className="rounded-full text-muted hover:bg-default/50" aria-label="Tìm kiếm">
            <Search size={16} />
          </Button>
          <Button variant="ghost" isIconOnly size="sm" className="relative rounded-full text-muted hover:bg-default/50" aria-label="Thông báo">
            <Bell size={16} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-background" />
            )}
          </Button>
          <Button size="sm" className="bg-accent text-white dark:text-foreground font-semibold px-4 rounded-xl flex items-center gap-1.5 shadow-sm">
            + Mời thành viên
          </Button>
        </div>
      </div>

      {/* Control Bar (Tabs & Filters) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator/50 pb-3">
        {/* Tab bar */}
        <div className="inline-flex items-center gap-0.5 p-1 bg-default/50 border border-separator rounded-full">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-surface dark:bg-white/15 text-foreground shadow-sm'
                  : 'text-default-500 hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" isIconOnly size="sm" className="rounded-xl border border-separator hover:bg-default/50 text-muted" aria-label="Làm mới">
            <RotateCw size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl border border-separator text-muted font-medium hover:bg-default/50 flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs">
            <Calendar size={13} /> Hàng tháng
          </Button>
          <Button size="sm" className="bg-accent/10 hover:bg-accent/15 text-accent font-semibold px-4 rounded-xl h-auto py-1.5 text-xs">
            <Download size={13} className="inline mr-1" /> Tải xuống
          </Button>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab  events={events} staff={staff} navigate={navigate} />}
      {tab === 'finance'   && <FinanceTab   events={events} navigate={navigate} />}
      {tab === 'hr'        && <HRTab        events={events} staff={staff} navigate={navigate} />}
      {tab === 'inventory' && <InventoryTab inventory={inventory} navigate={navigate} />}
    </div>
  );
}

// ─── Tab: Tổng quan ──────────────────────────────────────────────────────────

function OverviewTab({ events, staff, navigate }: {
  events: FestivalEvent[];
  staff: StaffMember[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const now  = new Date();
  const curM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevM = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`;

  const totalIncome   = events.reduce((s, e) => s + e.financials.income, 0);
  const totalExpenses = events.reduce((s, e) => s + sumExpenses(e), 0);

  const curIncome  = events.filter(e => monthKey(e.date) === curM).reduce((s, e) => s + e.financials.income, 0);
  const prevIncome = events.filter(e => monthKey(e.date) === prevM).reduce((s, e) => s + e.financials.income, 0);
  const curExpenses = events.filter(e => monthKey(e.date) === curM).reduce((s, e) => s + sumExpenses(e), 0);
  const prevExpenses = events.filter(e => monthKey(e.date) === prevM).reduce((s, e) => s + sumExpenses(e), 0);
  const curEvents  = events.filter(e => monthKey(e.date) === curM).length;
  const prevEvents = events.filter(e => monthKey(e.date) === prevM).length;

  const incomeDelta   = pct(curIncome, prevIncome);
  const expensesDelta = pct(curExpenses, prevExpenses);
  const eventsDelta   = pct(curEvents, prevEvents);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Tổng doanh thu"
          value={totalIncome.toLocaleString('fr-FR') + ' €'}
          delta={incomeDelta}
          onClick={() => navigate('/finance')}
        />
        <StatCard
          label="Tổng chi phí"
          value={totalExpenses.toLocaleString('fr-FR') + ' €'}
          delta={expensesDelta}
          onClick={() => navigate('/finance')}
        />
        <StatCard
          label="Sự kiện"
          value={String(events.length)}
          delta={eventsDelta}
          onClick={() => navigate('/schedule')}
        />
        <StatCard
          label="Nhân viên"
          value={String(staff.length)}
          delta={null}
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
        <StatCard label="Doanh thu" value={totalIncome.toLocaleString('fr-FR') + ' €'} onClick={() => navigate('/finance')} />
        <StatCard label="Chi phí"   value={totalExpenses.toLocaleString('fr-FR') + ' €'} onClick={() => navigate('/finance')} />
        <StatCard label="Lợi nhuận" value={profit.toLocaleString('fr-FR') + ' €'} onClick={() => navigate('/finance')} />
        <StatCard label="Chờ duyệt" value={String(pending.length)} onClick={() => navigate('/finance')} />
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
        <StatCard label="Tổng nhân viên"   value={String(staff.length)} onClick={() => navigate('/hr')} />
        <StatCard label="Cố định"          value={String(permanent)}    onClick={() => navigate('/hr')} />
        <StatCard label="Bán thời gian"    value={String(partTime)}     onClick={() => navigate('/hr')} />
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
        <StatCard label="Tổng mặt hàng" value={String(inventory.length)} onClick={() => navigate('/inventory')} />
        <StatCard label="Sắp hết hàng"  value={String(low.length)}       onClick={() => navigate('/inventory')} />
        <StatCard label="Đủ hàng"       value={String(ok.length)}        onClick={() => navigate('/inventory')} />
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
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <span className="bg-default text-default-foreground px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0">
            {events.length}
          </span>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pb-3 border-b border-separator/50">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" className="rounded-xl border border-separator text-muted font-medium hover:bg-default/50 flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs">
            <SlidersHorizontal size={13} /> Lọc
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl border border-separator text-muted font-medium hover:bg-default/50 flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs">
            <ArrowUpDown size={13} /> Sắp xếp
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl border border-separator text-muted font-medium hover:bg-default/50 flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs">
            <LayoutGrid size={13} /> Cột
          </Button>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-default/50 border border-separator text-foreground placeholder:text-muted outline-none focus:border-accent/50 transition-colors w-full sm:w-44"
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

interface StatCardProps {
  label: string;
  value: string;
  delta?: number | null;
  onClick?: () => void;
  icon?: ReactNode;
  color?: string;
}

function StatCard({ label, value, delta, onClick, icon, color }: StatCardProps) {
  const colorClasses = useMemo(() => {
    if (!color) return { bg: 'bg-accent/10', text: 'text-accent' };
    switch (color) {
      case 'indigo':
        return { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-500' };
      case 'danger':
        return { bg: 'bg-danger/10 dark:bg-danger/20', text: 'text-danger' };
      case 'emerald':
        return { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-500' };
      default:
        return { bg: 'bg-accent/10', text: 'text-accent' };
    }
  }, [color]);

  return (
    <Card
      className="hover:shadow-lg hover:border-default-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between min-h-[104px] rounded-2xl bg-surface dark:bg-zinc-900/50 border border-separator/80 shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted/80 uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClasses.bg} ${colorClasses.text}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between mt-3">
        <span className="text-2xl font-bold text-foreground tracking-tight">{value}</span>
        {delta != null && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
            delta >= 0
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-danger/10 text-danger'
          }`}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
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
    <div className="space-y-1.5 relative">
      {/* Grid lines */}
      <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-40">
        <div className="border-t border-separator/80 w-full" />
        <div className="border-t border-separator/80 w-full" />
        <div className="border-t border-separator/80 w-full" />
      </div>
      <div className="flex items-end gap-2 h-32 relative z-10">
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * 100, 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div
                className="w-full rounded-t-[4px] transition-all hover:opacity-85"
                style={{ height: `${h}%`, background: 'var(--accent)' }}
                title={d.value.toLocaleString('fr-FR') + ' €'}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 relative z-10">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted font-medium">{d.label}</span>
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
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal grid lines */}
        <line x1="0" y1="25" x2={W} y2="25" stroke="var(--separator)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="0" y1="50" x2={W} y2="50" stroke="var(--separator)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="0" y1="75" x2={W} y2="75" stroke="var(--separator)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />

        <path d={area} fill="url(#evtGrad)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)" className="transition-all hover:r-4 cursor-pointer" />
        ))}
      </svg>
      <div className="flex">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted font-medium">{p.label}</span>
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
    <div className="space-y-1.5 relative">
      {/* Grid lines */}
      <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-40">
        <div className="border-t border-separator/80 w-full" />
        <div className="border-t border-separator/80 w-full" />
        <div className="border-t border-separator/80 w-full" />
      </div>
      <div className="flex items-end gap-2 h-32 relative z-10">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex items-end gap-1 h-full">
            <div className="flex-1 rounded-t-[3px] transition-all hover:opacity-85" style={{ height: `${Math.max((d.income / max) * 100, 2)}%`, background: 'var(--accent)' }} title={'Doanh thu: ' + d.income.toLocaleString('fr-FR') + ' €'} />
            <div className="flex-1 rounded-t-[3px] transition-all hover:opacity-85" style={{ height: `${Math.max((d.expense / max) * 100, 2)}%`, background: '#F43F5E' }} title={'Chi phí: ' + d.expense.toLocaleString('fr-FR') + ' €'} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 relative z-10">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted font-medium">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 justify-end relative z-10">
        <span className="flex items-center gap-1.5 text-[10px] text-muted font-medium">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--accent)' }} /> Doanh thu
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted font-medium">
          <span className="w-2 h-2 rounded-full inline-block bg-[#F43F5E]" /> Chi phí
        </span>
      </div>
    </div>
  );
}
