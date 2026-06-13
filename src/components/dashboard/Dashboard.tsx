import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Package, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { Button, Avatar } from '@heroui/react';
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
    <div className="space-y-5">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-5 shadow-[var(--shadow-hero)] border border-[var(--glass-border)]">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[var(--primary)]/5" />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-[var(--primary)]/5" />

        <div className="relative">
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-widest mb-1">
            {canViewAll ? 'Tổng quan' : 'Cá nhân'}
          </p>
          <h1 className="text-xl font-black leading-tight text-[var(--text-primary)]">
            Xin chào, {currentUser.name} 👋
          </h1>
          {activeEvent ? (
            <Button
              onPress={() => navigate("/schedule/" + activeEvent.id)}
              variant="ghost"
              className="mt-3 flex items-center gap-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 border border-[var(--primary)]/20 rounded-xl px-3 py-1.5 text-sm font-semibold text-[var(--primary)] transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              Đang diễn ra: {activeEvent.name}
              <ChevronRight size={14} />
            </Button>
          ) : (
            <p className="text-[var(--text-muted)] text-sm mt-1">
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
          <StatCard icon={<Calendar size={18} />} label="Sự kiện sắp tới" value={upcomingEvents.length} onClick={() => navigate("/schedule")} />
          <StatCard icon={<Users size={18} />} label="Tổng nhân viên" value={staff.length} accentColor="indigo" onClick={() => navigate("/hr")} />
          <StatCard icon={<Package size={18} />} label="Kho sắp hết" value={lowStockCount} alert={lowStockCount > 0} onClick={() => navigate("/inventory")} />
          <StatCard icon={<Clock size={18} />} label="Chi phí chờ duyệt" value={pendingExpenses.length} alert={pendingExpenses.length > 0} onClick={() => navigate("/finance")} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Calendar size={18} />} label="Sự kiện của tôi" value={myEvents.length} onClick={() => navigate("/schedule")} />
          <StatCard icon={<Clock size={18} />} label="Chi phí chờ duyệt" value={myPendingExpenses.length} alert={myPendingExpenses.length > 0} onClick={() => navigate("/profile")} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {displayEvents.map(event => (
              <Button
                key={event.id}
                variant="ghost"
                onPress={() => navigate("/schedule/" + event.id)}
                className="w-full h-auto justify-start text-left glass-card rounded-2xl p-4 hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-card)] active:scale-[0.99] transition-all duration-150"
              >
                <div className="flex w-full justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{event.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{event.date} · {event.location}</p>
                    <StaffAvatars members={event.staff} />
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              </Button>
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
              <div key={exp.id} className="glass-card rounded-2xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{exp.type}</p>
                  <p className="text-xs text-[var(--text-muted)]">{exp.date}</p>
                </div>
                <span className="text-sm font-bold text-indigo-400">{exp.amount}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Analytics — admin/manager ── */}
      {canViewAll && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <SectionHeader title="Doanh thu theo tháng" icon={<TrendingUp size={14} />} />
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

function StatCard({ icon, label, value, alert, accentColor, onClick }: {
  icon: React.ReactNode; label: string; value: number;
  alert?: boolean; accentColor?: 'indigo'; onClick?: () => void;
}) {
  const glowClass  = alert ? 'glow-danger border-[var(--danger)]/20' : '';
  const iconColor  = alert ? 'text-[var(--danger)]' : accentColor === 'indigo' ? 'text-indigo-400' : 'text-[var(--primary)]';
  const valueColor = alert ? 'text-[var(--danger)]' : accentColor === 'indigo' ? 'text-indigo-400' : 'text-[var(--text-primary)]';
  return (
    <Button variant="ghost" onPress={onClick} className={`glass-card rounded-2xl p-4 flex items-center gap-3 w-full h-auto justify-start text-left active:scale-[0.97] transition-all ${glowClass}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--glass-bg)] border border-[var(--glass-border)] ${iconColor}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-2xl font-black leading-none ${valueColor}`}>{value}</p>
        <p className="text-xs text-[var(--text-muted)] leading-tight mt-1">{label}</p>
      </div>
    </Button>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return (last[0] ?? name[0] ?? '?').toUpperCase();
}

function StaffAvatars({ members }: { members: StaffRef[] }) {
  if (members.length === 0) return <p className="text-xs text-[var(--text-muted)] mt-1">Chưa có nhân viên</p>;
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center mt-1.5">
      <div className="flex -space-x-2">
        {shown.map(m => (
          <Avatar key={m.id} className="w-6 h-6 ring-2 ring-[var(--card)]">
            <Avatar.Fallback className="bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-semibold">{initials(m.name)}</Avatar.Fallback>
          </Avatar>
        ))}
        {extra > 0 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--glass-bg)] text-[10px] font-semibold text-[var(--text-muted)] ring-2 ring-[var(--card)]">+{extra}</span>}
      </div>
      <span className="ml-2 text-xs text-[var(--text-muted)]">{members.length} nhân viên</span>
    </div>
  );
}

function SectionHeader({ title, onMore, icon }: { title: string; onMore?: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{icon} {title}</h2>
      {onMore && <Button onPress={onMore} variant="ghost" size="sm" className="flex items-center gap-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition-colors">Xem thêm <ChevronRight size={12} /></Button>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-[var(--text-muted)] text-center py-6">{text}</p>;
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
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-end gap-2 h-24">
        {entries.map(([month, val]) => (
          <div key={month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max((val / maxVal) * 80, 4)}px`, background: 'linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 60%, transparent))' }} />
            <span className="text-[9px] text-[var(--text-muted)] leading-none">{month}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-2 text-right">Max: {maxVal.toLocaleString('fr-FR')}€</p>
    </div>
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
  const rankColors = ['bg-[var(--warning)]/15 text-[var(--warning)]', 'bg-[var(--glass-bg)] text-[var(--text-secondary)]', 'bg-[var(--success)]/10 text-[var(--success)]'];
  return (
    <div className="glass-card rounded-2xl divide-y divide-[var(--glass-border)]">
      {top.map(({ member, count }, i) => (
        <div key={member!.id} className="flex items-center gap-3 px-4 py-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-[var(--glass-border)] ${rankColors[i]}`}>{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{member!.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{member!.city}</p>
          </div>
          <span className="text-sm font-bold text-[var(--text-secondary)]">{count} sự kiện</span>
        </div>
      ))}
    </div>
  );
}
