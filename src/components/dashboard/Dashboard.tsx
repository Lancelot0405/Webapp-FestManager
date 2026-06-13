import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Package, Clock, TrendingUp, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Avatar, Button, Card } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useInventoryQuery } from '../../hooks/queries/useInventoryQuery';
import StatusBadge from '../shared/StatusBadge';
import type { FestivalEvent, StaffMember, StaffRef } from '../../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { data: events = [] }    = useEventsQuery();
  const { data: inventory = [] } = useInventoryQuery();
  const { data: staff = [] }     = useStaffQuery();

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
    <div className="space-y-6">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 right-8 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/8" />

        <div className="relative">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1.5">
            {canViewAll ? 'Bảng điều khiển' : 'Cá nhân'}
          </p>
          <h1 className="text-[22px] font-bold leading-tight text-white">
            Xin chào, {currentUser.name} 👋
          </h1>
          {activeEvent ? (
            <Button
              onPress={() => navigate("/schedule/" + activeEvent.id)}
              className="mt-3 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-3.5 py-2 text-sm font-semibold text-white h-auto"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Đang diễn ra: {activeEvent.name}
              <ChevronRight size={14} />
            </Button>
          ) : (
            <p className="text-indigo-200 text-sm mt-1.5">
              {upcomingEvents.length > 0
                ? `${upcomingEvents.length} sự kiện sắp tới`
                : 'Không có sự kiện nào đang diễn ra'}
            </p>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      {canViewAll ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Calendar size={17} />}
            label="Sự kiện sắp tới"
            value={upcomingEvents.length}
            color="indigo"
            onClick={() => navigate("/schedule")}
          />
          <StatCard
            icon={<Users size={17} />}
            label="Tổng nhân viên"
            value={staff.length}
            color="violet"
            onClick={() => navigate("/hr")}
          />
          <StatCard
            icon={<Package size={17} />}
            label="Kho sắp hết"
            value={lowStockCount}
            color={lowStockCount > 0 ? 'danger' : 'amber'}
            onClick={() => navigate("/inventory")}
          />
          <StatCard
            icon={<Clock size={17} />}
            label="Chi phí chờ duyệt"
            value={pendingExpenses.length}
            color={pendingExpenses.length > 0 ? 'danger' : 'emerald'}
            onClick={() => navigate("/finance")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar size={17} />}
            label="Sự kiện của tôi"
            value={myEvents.length}
            color="indigo"
            onClick={() => navigate("/schedule")}
          />
          <StatCard
            icon={<Clock size={17} />}
            label="Chi phí chờ duyệt"
            value={myPendingExpenses.length}
            color={myPendingExpenses.length > 0 ? 'danger' : 'emerald'}
            onClick={() => navigate("/profile")}
          />
        </div>
      )}

      {/* ── Upcoming events ── */}
      <div>
        <SectionHeader
          title={canViewAll ? 'Sự kiện sắp tới' : 'Sự kiện của tôi'}
          onMore={canViewAll ? () => navigate("/schedule") : undefined}
        />
        {displayEvents.length === 0 ? (
          <EmptyState text="Không có sự kiện nào" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayEvents.map(event => (
              <Card
                key={event.id}
                className="p-0 overflow-hidden border border-separator hover:border-accent/30 hover:shadow-md transition-all duration-150 group"
              >
                <Button
                  variant="ghost"
                  onPress={() => navigate("/schedule/" + event.id)}
                  className="card-btn w-full h-auto rounded-none p-4 text-left hover:bg-default/30"
                >
                  <div className="flex w-full justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">{event.name}</p>
                      <p className="text-xs text-muted mt-0.5">{event.date} · {event.location}</p>
                      <StaffAvatars members={event.staff} />
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={event.status} />
                      <ArrowUpRight size={13} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Button>
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
              <Card key={exp.id} className="flex-row justify-between items-center p-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{exp.type}</p>
                  <p className="text-xs text-muted mt-0.5">{exp.date}</p>
                </div>
                <span className="text-sm font-bold text-accent">{exp.amount}€</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Analytics — admin/manager ── */}
      {canViewAll && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <SectionHeader title="Doanh thu theo tháng" icon={<TrendingUp size={13} />} />
            <RevenueChart events={events} />
          </div>
          <div>
            <SectionHeader title="Top nhân viên" onMore={() => navigate('/hr')} />
            <TopStaffList events={events} staff={staff} />
          </div>
        </div>
      )}
    </div>
  );
}

type StatColor = 'indigo' | 'violet' | 'emerald' | 'amber' | 'danger';

const statColorMap: Record<StatColor, { iconBg: string; iconText: string; value: string }> = {
  indigo:  { iconBg: 'bg-indigo-100 dark:bg-indigo-500/15',  iconText: 'text-indigo-600 dark:text-indigo-400',  value: 'text-indigo-600 dark:text-indigo-400'  },
  violet:  { iconBg: 'bg-violet-100 dark:bg-violet-500/15',  iconText: 'text-violet-600 dark:text-violet-400',  value: 'text-violet-600 dark:text-violet-400'  },
  emerald: { iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',iconText: 'text-emerald-600 dark:text-emerald-400',value: 'text-foreground'             },
  amber:   { iconBg: 'bg-amber-100 dark:bg-amber-500/15',    iconText: 'text-amber-600 dark:text-amber-400',    value: 'text-foreground'             },
  danger:  { iconBg: 'bg-red-100 dark:bg-red-500/15',        iconText: 'text-red-600 dark:text-red-400',        value: 'text-red-600 dark:text-red-400'         },
};

function StatCard({ icon, label, value, color = 'indigo', onClick }: {
  icon: React.ReactNode; label: string; value: number;
  color?: StatColor; onClick?: () => void;
}) {
  const c = statColorMap[color];
  return (
    <Card className="p-0 overflow-hidden hover:shadow-md transition-all duration-150">
      <Button
        variant="ghost"
        onPress={onClick}
        className="card-btn w-full h-auto rounded-none p-4 flex flex-col gap-3 text-left hover:bg-default/30"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
          <span className={c.iconText}>{icon}</span>
        </div>
        <div>
          <p className={`text-2xl font-bold leading-none ${c.value}`}>{value}</p>
          <p className="text-xs text-muted mt-1 leading-tight">{label}</p>
        </div>
      </Button>
    </Card>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return (last[0] ?? name[0] ?? '?').toUpperCase();
}

function StaffAvatars({ members }: { members: StaffRef[] }) {
  if (members.length === 0) return <p className="text-xs text-muted mt-1.5">Chưa có nhân viên</p>;
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center mt-2">
      <div className="flex -space-x-1.5">
        {shown.map(m => (
          <Avatar key={m.id} className="w-5 h-5 ring-2 ring-[var(--surface)]">
            <Avatar.Fallback className="bg-accent/10 text-accent text-[9px] font-bold">{initials(m.name)}</Avatar.Fallback>
          </Avatar>
        ))}
        {extra > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-default/50 text-[9px] font-semibold text-muted ring-2 ring-[var(--surface)]">
            +{extra}
          </span>
        )}
      </div>
      <span className="ml-2 text-[11px] text-muted">{members.length} nhân viên</span>
    </div>
  );
}

function SectionHeader({ title, onMore, icon }: { title: string; onMore?: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        {icon && <span className="text-muted">{icon}</span>}
        {title}
      </h2>
      {onMore && (
        <Button
          variant="ghost"
          onPress={onMore}
          className="flex items-center gap-1 text-xs text-accent font-medium h-auto p-0 min-w-0 rounded-none hover:bg-transparent underline-offset-2 hover:underline"
        >
          Xem thêm <ChevronRight size={12} />
        </Button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="py-10 flex flex-col items-center gap-2">
      <p className="text-sm text-muted">{text}</p>
    </Card>
  );
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
  if (entries.length === 0) return (
    <Card className="py-8 flex items-center justify-center">
      <p className="text-sm text-muted">Chưa có dữ liệu</p>
    </Card>
  );
  const maxVal = Math.max(...entries.map(([, v]) => v), 100000);
  return (
    <Card className="p-4">
      <div className="flex items-end gap-2 h-28">
        {entries.map(([month, val]) => {
          const pct = Math.max((val / maxVal) * 100, 4);
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${pct}%`,
                  background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
                  opacity: pct < 20 ? 0.5 : 1,
                }}
              />
              <span className="text-[9px] text-muted leading-none">{month}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted mt-2 text-right">Max: {maxVal.toLocaleString('fr-FR')}€</p>
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
  if (top.length === 0) return (
    <Card className="py-8 flex items-center justify-center">
      <p className="text-sm text-muted">Chưa có dữ liệu</p>
    </Card>
  );
  const rankConfig = [
    { bg: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400', label: '1' },
    { bg: 'bg-slate-100 dark:bg-slate-500/15 text-slate-500 dark:text-slate-400', label: '2' },
    { bg: 'bg-orange-100 dark:bg-orange-500/15 text-orange-500 dark:text-orange-400', label: '3' },
  ];
  return (
    <Card className="p-0 divide-y divide-[var(--separator)]">
      {top.map(({ member, count }, i) => (
        <div key={member!.id} className="flex items-center gap-3 px-4 py-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${rankConfig[i].bg}`}>
            {rankConfig[i].label}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{member!.name}</p>
            <p className="text-xs text-muted">{member!.city}</p>
          </div>
          <span className="text-xs font-semibold text-muted shrink-0">{count} sự kiện</span>
        </div>
      ))}
    </Card>
  );
}
