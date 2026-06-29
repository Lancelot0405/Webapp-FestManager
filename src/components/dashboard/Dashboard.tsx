import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { animations } from '../../lib/animations';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Package, Clock,
  AlertTriangle,
  ChevronRight,
  Eye, Smartphone,
  DollarSign, MapPin, Zap, TrendingUp, TrendingDown,
  Users, UserCheck, Briefcase, CheckCircle2,
  CalendarDays, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/shared/EmptyState';
import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useInventoryQuery } from '../../hooks/queries/useInventoryQuery';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useToast } from '../../context/ToastContext';
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? name[0] ?? '?').toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-violet-400 via-purple-400 to-blue-500',
  'from-pink-400 to-rose-500',
  'from-teal-400 to-cyan-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-green-500',
  'from-amber-400 to-orange-400',
  'from-sky-400 to-blue-500',
  'from-fuchsia-400 to-pink-500',
];

function avatarGradient(id: number | string): string {
  const n = typeof id === 'number' ? id : id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[Math.abs(n) % AVATAR_GRADIENTS.length];
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
  const { isIos, isStandalone, triggerInstall } = useInstallPrompt();
  const showToast = useToast();

  const handleInstall = async () => {
    const result = await triggerInstall();
    if (result === 'already') {
      showToast('FestManager đã được cài trên thiết bị này.', 'info');
    } else if (result === 'guide') {
      if (isIos) {
        showToast('Safari: bấm nút Chia sẻ ↑ → "Thêm vào màn hình chính"', 'info');
      } else {
        showToast('Dùng menu trình duyệt (⋮) → "Cài đặt ứng dụng"', 'info');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Greeting (desktop) & Top Actions */}
      <div className={`items-center justify-between gap-2 ${isStandalone ? 'hidden md:flex' : 'flex'}`}>
        <h1 className="hidden md:block text-xl md:text-2xl font-bold text-foreground tracking-tight truncate">
          {greeting()}, {currentUser.name}
        </h1>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* PWA install */}
          {!isStandalone && (
            <Button
              type="button"
              size="sm"
              onClick={handleInstall}
              className="rounded-xl font-semibold px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Smartphone size={14} /> Cài đặt ứng dụng
            </Button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 w-max min-w-full relative">
          {TABS.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`text-sm whitespace-nowrap pb-2 font-medium transition-colors relative outline-none cursor-pointer ${
                  isActive ? 'text-accent font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} {...animations.pageEnter}>
          {tab === 'overview'  && <OverviewTab  events={events} staff={staff} inventory={inventory} navigate={navigate} />}
          {tab === 'finance'   && <FinanceTab   events={events} navigate={navigate} />}
          {tab === 'hr'        && <HRTab        events={events} staff={staff} navigate={navigate} />}
          {tab === 'inventory' && <InventoryTab inventory={inventory} navigate={navigate} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Date Badge ───────────────────────────────────────────────────────────────

const MONTH_ABBR = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];

// ─── Tab: Tổng quan ──────────────────────────────────────────────────────────

function OverviewTab({ events, staff, inventory, navigate }: {
  events: FestivalEvent[];
  staff: StaffMember[];
  inventory: InventoryItem[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const totalIncome    = events.reduce((s, e) => s + e.financials.income, 0);
  const activeEvents   = events.filter(e => e.status === 'Đang diễn ra');
  const upcomingEvents = events.filter(e => e.status === 'Sắp tới' || e.status === 'Lên kế hoạch');
  const completedCount = events.filter(e => e.status === 'Đã hoàn thành').length;
  const lowStock       = inventory.filter(i => i.current <= i.threshold);
  const pendingCount   = events.flatMap(e => e.receipts).filter(r => r.status === 'pending').length;

  const topStaff = useMemo(() => {
    const map: Record<number, { member: StaffMember; count: number }> = {};
    events.forEach(e => e.staff.forEach(s => {
      const m = staff.find(st => st.id === s.id);
      if (m) map[s.id] = { member: m, count: (map[s.id]?.count ?? 0) + 1 };
    }));
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [events, staff]);

  return (
    <div className="space-y-6">

      {/* KPI cards 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Sự kiện sắp tới"
          value={String(upcomingEvents.length + activeEvents.length)}
          icon={<Calendar size={16} />}
          subtext={`${completedCount} đã hoàn thành`}
          onClick={() => navigate('/schedule')}
        />
        <StatCard
          label="Doanh thu"
          value={totalIncome.toLocaleString('fr-FR') + '€'}
          icon={<DollarSign size={16} />}
          subtext={`${events.length} sự kiện`}
          glow="success"
          color="emerald"
          onClick={() => navigate('/finance')}
        />
        <StatCard
          label="Kho sắp hết"
          value={String(lowStock.length)}
          icon={<Package size={16} />}
          subtext={`${inventory.length} mặt hàng tổng`}
          glow={lowStock.length > 0 ? 'danger' : undefined}
          color={lowStock.length > 0 ? 'danger' : undefined}
          valueColor={lowStock.length > 0 ? 'danger' : undefined}
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          label="Chi phí chờ"
          value={String(pendingCount)}
          icon={<Clock size={16} />}
          subtext="Cần phê duyệt"
          onClick={() => navigate('/finance')}
        />
      </div>

      {/* Cảnh báo kho */}
      {lowStock.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-widest">
              <AlertTriangle size={13} className="text-danger" /> Cảnh báo kho ({lowStock.length})
            </h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs text-muted font-medium flex items-center gap-0.5 hover:text-foreground transition-colors"
            >
              Xem thêm <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {lowStock.slice(0, 4).map((item, i) => (
              <motion.div key={item.id} {...animations.listItem(i)} {...animations.press}>
                <Card
                  className="p-0 border-danger/15 border"
                  style={{ boxShadow: '0 0 14px 2px rgba(239,68,68,0.10)' }}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-danger" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-danger">Còn {item.current} {item.unit} / Ngưỡng {item.threshold}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Đang diễn ra */}
      {activeEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-widest">
            <Zap size={13} className="text-success" /> Đang diễn ra
          </h2>
          <div className="space-y-2">
            {activeEvents.map((event, i) => (
              <motion.div key={event.id} {...animations.listItem(i)} {...animations.press}>
                <Card
                  className="p-4 cursor-pointer hover:border-success/30 transition-all border"
                  style={{ boxShadow: '0 0 20px 4px rgba(34,197,94,0.12)' }}
                  onClick={() => navigate('/schedule/' + event.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Date badge */}
                    <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-black text-success leading-none">{event.date.split('-')[0]}</span>
                      <span className="text-[10px] font-semibold text-success/70 uppercase">{MONTH_ABBR[Number(event.date.split('-')[1]) - 1]}</span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-foreground truncate">{event.name}</p>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted mt-1">
                        <MapPin size={11} className="shrink-0" /> {event.location}
                      </div>
                      {event.staff.length === 0 ? (
                        <p className="text-xs text-muted/50 mt-1.5">Chưa có nhân viên</p>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex -space-x-1.5">
                            {event.staff.slice(0, 5).map(m => (
                              <div key={m.id} className={`w-5 h-5 rounded-full bg-gradient-to-br ${avatarGradient(m.id)} ring-2 ring-background flex items-center justify-center`}>
                                <span className="text-[8px] font-bold text-white">{initials(m.name)}</span>
                              </div>
                            ))}
                            {event.staff.length > 5 && (
                              <div className="w-5 h-5 rounded-full bg-default-200 ring-2 ring-background flex items-center justify-center">
                                <span className="text-[8px] font-semibold text-muted">+{event.staff.length - 5}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted">{event.staff.length} nhân viên</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-muted shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop: 2-col grid — Sự kiện sắp tới (left) + Analytics (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Sự kiện sắp tới */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest">Sự kiện sắp tới</h2>
            <button
              onClick={() => navigate('/schedule')}
              className="text-xs text-muted font-medium flex items-center gap-0.5 hover:text-foreground transition-colors"
            >
              Xem thêm <ChevronRight size={12} />
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <Card className="py-8 flex flex-col items-center gap-2 border">
              <p className="text-sm text-muted">Không có sự kiện sắp tới</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingEvents
                .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
                .slice(0, 5)
                .map((event, i) => (
                <motion.div key={event.id} {...animations.listItem(i)} {...animations.press}>
                  <Card
                    className="p-3.5 cursor-pointer hover:border-accent/25 hover:shadow-sm transition-all border"
                    onClick={() => navigate('/schedule/' + event.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-default-100 dark:bg-default-200/20 border border-separator/60 flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-black text-foreground leading-none">{event.date.split('-')[0]}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">{MONTH_ABBR[Number(event.date.split('-')[1]) - 1]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                        <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={event.status} />
                        <span className="text-[10px] text-muted">{event.staff.length} NV</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics: Doanh thu + Top nhân viên */}
        <div className="space-y-5">
          {/* Doanh thu theo tháng */}
          <div className="space-y-3">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-widest">
              <TrendingUp size={13} /> Doanh thu theo tháng
            </h2>
            <Card className="p-4 space-y-3 border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">6 tháng gần nhất</span>
                <span className="text-sm font-bold text-foreground">{totalIncome.toLocaleString('fr-FR')} €</span>
              </div>
              <RevenueBarChart events={events} />
            </Card>
          </div>

          {/* Top nhân viên */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted uppercase tracking-widest">☆ Top nhân viên</h2>
              <button
                onClick={() => navigate('/hr')}
                className="text-xs text-muted font-medium flex items-center gap-0.5 hover:text-foreground transition-colors"
              >
                Xem thêm <ChevronRight size={12} />
              </button>
            </div>
            <Card className="overflow-hidden border">
              {topStaff.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                    <span className="text-muted text-xs">✓</span>
                  </div>
                  <p className="text-sm text-muted">Chưa có dữ liệu</p>
                </div>
              ) : (
                <div className="divide-y divide-separator/40">
                  {topStaff.map(({ member, count }, i) => (
                    <motion.div
                      key={member.id}
                      {...animations.listItem(i)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-default-50 dark:hover:bg-default-100/5 transition-colors"
                      onClick={() => navigate('/hr/' + member.id)}
                    >
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(member.id)} flex items-center justify-center shrink-0`}>
                        <span className="text-xs font-bold text-white">{initials(member.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                        <p className="text-xs text-muted">{member.city}</p>
                      </div>
                      <span className="text-xs font-bold text-accent shrink-0">{count} sự kiện</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

      </div>

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
        <StatCard
          label="Doanh thu"
          value={totalIncome.toLocaleString('fr-FR') + ' €'}
          icon={<TrendingUp size={16} />}
          color="emerald"
          glow="success"
          onClick={() => navigate('/finance')}
        />
        <StatCard
          label="Chi phí"
          value={totalExpenses.toLocaleString('fr-FR') + ' €'}
          icon={<TrendingDown size={16} />}
          color="danger"
          onClick={() => navigate('/finance')}
        />
        <StatCard
          label="Lợi nhuận"
          value={profit.toLocaleString('fr-FR') + ' €'}
          icon={<DollarSign size={16} />}
          color={profit >= 0 ? 'emerald' : 'danger'}
          glow={profit >= 0 ? 'success' : 'danger'}
          valueColor={profit >= 0 ? 'success' : 'danger'}
          onClick={() => navigate('/finance')}
        />
        <StatCard
          label="Chờ duyệt"
          value={String(pending.length)}
          icon={<Clock size={16} />}
          color={pending.length > 0 ? 'danger' : 'indigo'}
          onClick={() => navigate('/finance')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3 border">
          <h3 className="text-sm font-semibold text-foreground">Doanh thu & Chi phí theo tháng</h3>
          <IncomeExpenseChart events={events} />
        </Card>
        <Card className="p-4 space-y-3 border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Chi phí chờ duyệt</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/finance')}
              className="h-auto p-0 min-w-0 text-xs text-accent font-medium hover:bg-transparent"
            >
              Xem tất cả <ChevronRight size={12} />
            </Button>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">Không có chi phí nào chờ duyệt</p>
          ) : (
            <div className="divide-y divide-[var(--separator)] border-t border-border">
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
        <StatCard
          label="Tổng nhân viên"
          value={String(staff.length)}
          icon={<Users size={16} />}
          onClick={() => navigate('/hr')}
        />
        <StatCard
          label="Cố định"
          value={String(permanent)}
          icon={<UserCheck size={16} />}
          color="indigo"
          onClick={() => navigate('/hr')}
        />
        <StatCard
          label="Bán thời gian"
          value={String(partTime)}
          icon={<Briefcase size={16} />}
          color="emerald"
          onClick={() => navigate('/hr')}
        />
      </div>

      <Card className="overflow-hidden rounded-2xl border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Danh sách nhân viên</h3>
            <Badge className="bg-muted text-muted-foreground border-none text-[11px] h-5 px-1.5 rounded-full hover:bg-muted font-semibold">
              {staff.length}
            </Badge>
          </div>
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-xs font-medium text-muted-foreground py-3 pl-5 pr-4 bg-muted/50 dark:bg-default-100/20">Nhân viên</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 px-4 bg-muted/50 dark:bg-default-100/20 hidden md:table-cell">Thành phố</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 px-4 bg-muted/50 dark:bg-default-100/20 hidden md:table-cell">Loại hợp đồng</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 px-4 bg-muted/50 dark:bg-default-100/20 hidden md:table-cell">Sự kiện</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-5 pl-4 text-right bg-muted/50 dark:bg-default-100/20">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <EmptyState icon={<Users size={26} />} title="Không tìm thấy nhân viên" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(s => (
                  <TableRow
                    key={s.id}
                    onClick={() => navigate('/hr/' + s.id)}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 dark:hover:bg-default-100/5 transition-colors"
                  >
                    <TableCell className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(s.id)} flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="text-xs font-bold text-white">{initials(s.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                          <p className="text-xs text-default-400 truncate md:hidden">{s.city}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 hidden md:table-cell">
                      <p className="text-sm text-default-500">{s.city}</p>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 hidden md:table-cell">
                      <Badge className={`border-none text-[11px] px-2 py-0.5 rounded-full font-semibold hover:bg-transparent ${
                        s.staffType === 'permanent' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {s.staffType === 'permanent' ? 'Cố định' : 'Bán thời gian'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 hidden md:table-cell">
                      <p className="text-sm font-medium text-foreground">{eventCounts[s.id] ?? 0}</p>
                    </TableCell>
                    <TableCell className="py-3.5 pr-5 pl-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => navigate('/hr/' + s.id)}
                          aria-label="Xem hồ sơ"
                          className="w-8 h-8 rounded-lg text-default-400 hover:text-foreground hover:bg-default-100 p-0 flex items-center justify-center"
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
        <StatCard
          label="Tổng mặt hàng"
          value={String(inventory.length)}
          icon={<Package size={16} />}
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          label="Sắp hết hàng"
          value={String(low.length)}
          icon={<AlertTriangle size={16} />}
          color={low.length > 0 ? 'danger' : 'emerald'}
          glow={low.length > 0 ? 'danger' : undefined}
          valueColor={low.length > 0 ? 'danger' : undefined}
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          label="Đủ hàng"
          value={String(ok.length)}
          icon={<CheckCircle2 size={16} />}
          color="emerald"
          onClick={() => navigate('/inventory')}
        />
      </div>

      {low.length > 0 && (
        <Card className="overflow-hidden border">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-danger" /> Hàng cần bổ sung
            </h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/inventory')}
              className="h-auto p-0 min-w-0 text-xs text-accent font-medium hover:bg-transparent"
            >
              Xem tất cả <ChevronRight size={12} />
            </Button>
          </div>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-xs font-semibold text-muted px-1 py-2">Tên hàng</TableHead>
                  <TableHead className="text-xs font-semibold text-muted px-1 py-2">Hiện tại</TableHead>
                  <TableHead className="text-xs font-semibold text-muted px-1 py-2 hidden md:table-cell">Ngưỡng cảnh báo</TableHead>
                  <TableHead className="text-xs font-semibold text-muted px-1 py-2">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {low.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="py-2.5 px-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                    </TableCell>
                    <TableCell className="py-2.5 px-1">
                      <span className="text-sm font-bold text-danger">{item.current} {item.unit}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-1 hidden md:table-cell">
                      <span className="text-sm text-muted">{item.threshold} {item.unit}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-1">
                      <Badge className={`border-none text-[11px] px-2 py-0.5 rounded-full font-semibold hover:bg-transparent ${
                        item.current === 0 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {item.current === 0 ? 'Hết hàng' : 'Sắp hết'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {critical.length > 0 && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-500/5">
              <p className="text-xs text-danger font-medium">{critical.length} mặt hàng đã hết hoàn toàn</p>
            </div>
          )}
        </Card>
      )}

      {low.length === 0 && (
        <Card className="py-10 flex flex-col items-center gap-2 border">
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
      <div className="hidden md:block">
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
        <Card className="overflow-hidden border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Chi phí chờ duyệt</h3>
          </div>
          <div className="divide-y divide-border">
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
    <Card className="overflow-hidden rounded-2xl border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <Badge className="bg-muted text-muted-foreground border-none text-[11px] h-5 px-1.5 rounded-full hover:bg-muted font-semibold">
            {events.length}
          </Badge>
        </div>
        <div className="relative w-full sm:w-52">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden divide-y divide-border">
        {sorted.length === 0 ? (
          <EmptyState icon={<CalendarDays size={26} />} title={emptyText} />
        ) : sorted.map((event, i) => (
          <motion.div
            key={event.id}
            {...animations.listItem(i)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-default-50 dark:hover:bg-default-100/5 active:bg-default-100/50 transition-colors"
            onClick={() => navigate('/schedule/' + event.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar size={10} className="text-muted shrink-0" />
                <p className="text-xs text-muted truncate">{event.date}</p>
                {event.location && <><span className="text-muted">·</span><p className="text-xs text-muted truncate">{event.location}</p></>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={event.status} />
              <ChevronRight size={14} className="text-muted" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-xs font-medium text-muted-foreground py-3 pl-5 pr-4 bg-muted/50 dark:bg-default-100/20">Sự kiện</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 px-4 bg-muted/50 dark:bg-default-100/20">Ngày</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 px-4 bg-muted/50 dark:bg-default-100/20">Địa điểm</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 px-4 bg-muted/50 dark:bg-default-100/20">Nhân viên</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 px-4 bg-muted/50 dark:bg-default-100/20">Trạng thái</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-5 pl-4 text-right bg-muted/50 dark:bg-default-100/20">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <EmptyState icon={<CalendarDays size={26} />} title={emptyText} />
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map(event => (
                  <TableRow
                    key={event.id}
                    onClick={() => navigate('/schedule/' + event.id)}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 dark:hover:bg-default-100/5 transition-colors"
                  >
                    <TableCell className="py-3.5 pl-5 pr-4">
                      <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <p className="text-sm text-default-500 whitespace-nowrap">{event.date}</p>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <p className="text-sm text-default-500 truncate">{event.location}</p>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <StaffAvatarGroup members={event.staff} />
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell className="py-3.5 pr-5 pl-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => navigate('/schedule/' + event.id)}
                          aria-label="Xem chi tiết"
                          className="w-8 h-8 rounded-lg text-default-400 hover:text-foreground hover:bg-default-100 p-0 flex items-center justify-center"
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
  glow?: 'success' | 'danger';
  subtext?: string;
  valueColor?: 'danger' | 'success';
}

function StatCard({ label, value, delta, onClick, icon, color, glow, subtext, valueColor }: StatCardProps) {
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

  const glowStyle = useMemo(() => {
    if (glow === 'success') return { boxShadow: '0 0 24px 6px rgba(34, 197, 94, 0.18)' };
    if (glow === 'danger')  return { boxShadow: '0 0 24px 6px rgba(239, 68, 68, 0.22)' };
    return {};
  }, [glow]);

  const valueClass = valueColor === 'danger' ? 'text-danger' : valueColor === 'success' ? 'text-success' : 'text-foreground';

  return (
    <Card
      className="hover:shadow-lg hover:border-default-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer p-4 flex flex-col justify-between min-h-[104px] rounded-2xl bg-surface dark:bg-zinc-900/50 border border-border shadow-sm"
      style={glowStyle}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold tracking-tight mt-1 leading-none truncate">
            <span className={valueClass}>{value}</span>
          </p>
          <p className="text-xs font-semibold text-muted mt-1.5 leading-tight">{label}</p>
          {subtext && <p className="text-[10px] text-muted/60 mt-0.5 leading-tight">{subtext}</p>}
          {delta != null && (
            <Badge className={`mt-1.5 text-[11px] font-bold border-none hover:bg-transparent ${
              delta >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'
            }`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
            </Badge>
          )}
        </div>
        {icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClasses.bg} ${colorClasses.text}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Staff Avatar Group ───────────────────────────────────────────────────────

function StaffAvatarGroup({ members }: { members: StaffRef[] }) {
  if (members.length === 0) return <span className="text-xs text-default-400">–</span>;
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((m, i) => (
        <motion.div key={m.id} {...animations.listItem(i)} whileHover={{ scale: 1.2, zIndex: 10 }} transition={{ duration: 0.15 }}
          className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient(m.id)} ring-2 ring-background flex items-center justify-center shadow-sm`}>
          <span className="text-[9px] font-bold text-white">{initials(m.name)}</span>
        </motion.div>
      ))}
      {extra > 0 && (
        <motion.div {...animations.listItem(shown.length)}
          className="w-7 h-7 rounded-full bg-default-200 dark:bg-default-700 ring-2 ring-background flex items-center justify-center">
          <span className="text-[9px] font-semibold text-default-600 dark:text-default-300">+{extra}</span>
        </motion.div>
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
        <div className="border-t border-border w-full" />
        <div className="border-t border-border w-full" />
        <div className="border-t border-border w-full" />
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

// ─── Income/Expense Chart (Finance tab) ───────────────────────────────────────

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
        <div className="border-t border-border w-full" />
        <div className="border-t border-border w-full" />
        <div className="border-t border-border w-full" />
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
