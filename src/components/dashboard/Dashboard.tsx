import React from 'react';
import { Calendar, Users, Package, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import type { ActiveTab, FestivalEvent, StaffMember } from '../../types';

interface DashboardProps {
  onSelectEvent: (id: number) => void;
  onNavigate:    (tab: ActiveTab) => void;
}

export default function Dashboard({ onSelectEvent, onNavigate }: DashboardProps) {
  const { state } = useApp();
  const { currentUser, events, inventory, staff } = state;

  if (!currentUser) return null;

  const isAdmin    = currentUser.role === 'admin';
  const isManager  = currentUser.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const myStaffMember = canViewAll ? null : (
    staff.find(s => s.userId === currentUser.id) ??
    staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase())
  );
  const myNumericId = myStaffMember?.id ?? null;
  const myEvents    = myNumericId ? events.filter(e => e.staff.some(s => s.id === myNumericId)) : [];

  const upcomingEvents   = events.filter(e => e.status === 'Sắp tới' || e.status === 'Lên kế hoạch' || e.status === 'Đang diễn ra');
  const activeEvent      = events.find(e => e.status === 'Đang diễn ra');
  const lowStockCount    = inventory.filter(i => i.current < i.threshold).length;
  const pendingExpenses  = events.flatMap(e => e.receipts).filter(r => r.status === 'pending');
  const myPendingExpenses = pendingExpenses.filter(r => myNumericId != null && r.staffId === String(myNumericId));

  const parse = (d: string) => {
    const [dd, mm, yyyy] = d.split('-');
    void dd;
    return new Date(`${yyyy}-${mm}-${dd}`).getTime();
  };

  const displayEvents = canViewAll
    ? [...upcomingEvents].sort((a, b) => parse(a.date) - parse(b.date)).slice(0, 3)
    : [...myEvents].sort((a, b) => parse(a.date) - parse(b.date));

  return (
    <div className="space-y-5">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-hero">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />

        <div className="relative">
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
            {canViewAll ? 'Tổng quan' : 'Cá nhân'}
          </p>
          <h1 className="text-xl font-black leading-tight text-white">
            Xin chào, {currentUser.name} 👋
          </h1>
          {activeEvent ? (
            <Button
              onPress={() => onSelectEvent(activeEvent.id)}
              variant="ghost"
              className="mt-3 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-herb-400 animate-pulse" />
              Đang diễn ra: {activeEvent.name}
              <ChevronRight size={14} />
            </Button>
          ) : (
            <p className="text-white/70 text-sm mt-1">
              {upcomingEvents.length > 0
                ? `${upcomingEvents.length} sự kiện sắp tới`
                : 'Không có sự kiện nào đang diễn ra'}
            </p>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      {canViewAll ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar size={18} />}
            label="Sự kiện sắp tới"
            value={upcomingEvents.length}
            color="brand"
            onClick={() => onNavigate('schedule')}
          />
          <StatCard
            icon={<Users size={18} />}
            label="Tổng nhân viên"
            value={staff.length}
            color="indigo"
            onClick={() => onNavigate('hr')}
          />
          <StatCard
            icon={<Package size={18} />}
            label="Kho sắp hết"
            value={lowStockCount}
            color={lowStockCount > 0 ? 'red' : 'herb'}
            alert={lowStockCount > 0}
            onClick={() => onNavigate('inventory')}
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Chi phí chờ duyệt"
            value={pendingExpenses.length}
            color={pendingExpenses.length > 0 ? 'red' : 'herb'}
            alert={pendingExpenses.length > 0}
            onClick={() => onNavigate('finance')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar size={18} />}
            label="Sự kiện của tôi"
            value={myEvents.length}
            color="brand"
            onClick={() => onNavigate('schedule')}
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Chi phí chờ duyệt"
            value={myPendingExpenses.length}
            color={myPendingExpenses.length > 0 ? 'red' : 'herb'}
            alert={myPendingExpenses.length > 0}
            onClick={() => onNavigate('profile')}
          />
        </div>
      )}

      {/* ── Upcoming events ── */}
      <div>
        <SectionHeader
          title={canViewAll ? 'Sự kiện sắp tới' : 'Sự kiện của tôi'}
          onMore={canViewAll ? () => onNavigate('schedule') : undefined}
        />
        {displayEvents.length === 0 ? (
          <EmptyState text="Không có sự kiện nào" />
        ) : (
          <div className="space-y-2.5">
            {displayEvents.map(event => (
              <Card
                key={event.id}
                render={(props) => <button {...(props as React.ComponentPropsWithRef<'button'>)} onClick={() => onSelectEvent(event.id)} />}
                className="w-full text-left rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-300 hover:shadow-card active:scale-[0.99] transition-all duration-150 cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{event.name}</p>
                    <p className="text-xs text-brand-400 mt-0.5">{event.date} · {event.location}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{event.staff.length} nhân viên</p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Staff: pending expenses ── */}
      {!canViewAll && myPendingExpenses.length > 0 && (
        <div>
          <SectionHeader title="Chi phí chờ duyệt" />
          <div className="space-y-2">
            {myPendingExpenses.map(exp => (
              <Card key={exp.id} variant="secondary" className="rounded-2xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{exp.type}</p>
                  <p className="text-xs text-slate-400">{exp.date}</p>
                </div>
                <span className="text-sm font-bold text-indigo-600">{exp.amount}€</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Analytics — admin/manager ── */}
      {canViewAll && (
        <div className="space-y-5">
          <div>
            <SectionHeader title="Doanh thu theo tháng" icon={<TrendingUp size={14} />} />
            <RevenueChart events={events} />
          </div>
          <div>
            <SectionHeader title="Top nhân viên" onMore={() => onNavigate('hr')} />
            <TopStaffList events={events} staff={staff} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

type StatColor = 'brand' | 'indigo' | 'herb' | 'red';

const colorMap: Record<StatColor, { bg: string; icon: string; value: string }> = {
  brand:  { bg: 'bg-brand-50',   icon: 'text-brand-500',  value: 'text-brand-600'  },
  indigo: { bg: 'bg-indigo-50',  icon: 'text-indigo-500', value: 'text-indigo-600' },
  herb:   { bg: 'bg-herb-500/10', icon: 'text-herb-500',  value: 'text-herb-600'   },
  red:    { bg: 'bg-red-50',     icon: 'text-red-500',    value: 'text-red-600'    },
};

function StatCard({ icon, label, value, color, alert, onClick }: {
  icon:    React.ReactNode;
  label:   string;
  value:   number;
  color:   StatColor;
  alert?:  boolean;
  onClick?: () => void;
}) {
  const c = colorMap[color];
  return (
    <Card
      render={(props) => <button {...(props as React.ComponentPropsWithRef<'button'>)} onClick={onClick} />}
      className={`${c.bg} rounded-2xl p-4 flex items-center gap-3 w-full text-left active:scale-[0.97] hover:brightness-95 cursor-pointer`}
    >
      <div className={`shrink-0 ${c.icon}`}>{icon}</div>
      <div>
        <p className={`text-2xl font-black ${alert ? 'text-red-500' : c.value}`}>{value}</p>
        <p className="text-xs text-slate-400 leading-tight mt-0.5">{label}</p>
      </div>
    </Card>
  );
}

function SectionHeader({ title, onMore, icon }: { title: string; onMore?: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-1.5 text-xs font-bold text-brand-500 uppercase tracking-widest">
        {icon} {title}
      </h2>
      {onMore && (
        <Button onPress={onMore} variant="ghost" size="sm" className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-brand-600 font-medium transition-colors">
          Xem thêm <ChevronRight size={12} />
        </Button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 text-center py-6">{text}</p>;
}

function RevenueChart({ events }: { events: FestivalEvent[] }) {
  const monthMap: Record<string, number> = {};
  events.forEach(e => {
    const [dd, mm, yyyy] = e.date.split('-');
    void dd;
    const key = `${mm}/${yyyy}`;
    monthMap[key] = (monthMap[key] ?? 0) + e.financials.income;
  });
  const entries = Object.entries(monthMap)
    .sort((a, b) => {
      const [ma, ya] = a[0].split('/');
      const [mb, yb] = b[0].split('/');
      return new Date(`${ya}-${ma}-01`).getTime() - new Date(`${yb}-${mb}-01`).getTime();
    })
    .slice(-6);

  if (entries.length === 0) return <EmptyState text="Chưa có dữ liệu" />;

  const maxVal = Math.max(...entries.map(([, v]) => v), 100000);

  return (
    <Card className="rounded-2xl p-4 bg-white dark:bg-slate-800">
      <div className="flex items-end gap-2 h-24">
        {entries.map(([month, val]) => (
          <div key={month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-lg transition-all"
              style={{
                height: `${Math.max((val / maxVal) * 80, 4)}px`,
                background: 'linear-gradient(180deg, #8B5CF6, #6366F1)',
              }}
            />
            <span className="text-[9px] text-slate-400 leading-none">{month}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2 text-right">Max: {maxVal.toLocaleString('fr-FR')}€</p>
    </Card>
  );
}

function TopStaffList({ events, staff }: { events: FestivalEvent[]; staff: StaffMember[] }) {
  const counts: Record<number, number> = {};
  events.forEach(e => e.staff.forEach(s => { counts[s.id] = (counts[s.id] ?? 0) + 1; }));
  const top = Object.entries(counts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([id, count]) => ({ member: staff.find(s => s.id === Number(id)), count }))
    .filter(x => x.member);

  if (top.length === 0) return <EmptyState text="Chưa có dữ liệu" />;

  const rankStyle = [
    'bg-indigo-100 text-indigo-600',
    'bg-brand-100  text-brand-600',
    'bg-herb-500/10 text-herb-600',
  ];

  return (
    <Card className="rounded-2xl divide-y divide-slate-50 dark:divide-slate-700 bg-white dark:bg-slate-800">
      {top.map(({ member, count }, i) => (
        <div key={member!.id} className="flex items-center gap-3 px-4 py-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankStyle[i]}`}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{member!.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{member!.city}</p>
          </div>
          <span className="text-sm font-bold text-brand-500">{count} sự kiện</span>
        </div>
      ))}
    </Card>
  );
}
