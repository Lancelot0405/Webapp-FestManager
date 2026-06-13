import React from 'react';
import {
  Calendar, Users, Package, Clock, TrendingUp, ChevronRight,
  ArrowRight, Zap, MapPin, BarChart2, AlertTriangle, CheckCircle2,
  DollarSign, Star,
} from 'lucide-react';
import { Button, Avatar } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import type { FestivalEvent, StaffMember, StaffRef } from '../../types';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useInventoryQuery } from '../../hooks/queries/useInventoryQuery';
import { useNavigate } from 'react-router-dom';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(d: string) {
  const [dd, mm, yyyy] = d.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`).getTime();
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + '€';
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? name[0] ?? '?').toUpperCase();
}

function getDateParts(d: string) {
  const [dd, mm] = d.split('-');
  const months = ['Jan','Fév','Mar','Avr','Mai','Jui','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return { day: dd, month: months[parseInt(mm) - 1] ?? mm };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate  = useNavigate();
  const { state } = useApp();
  const { data: events    = [] } = useEventsQuery();
  const { data: inventory = [] } = useInventoryQuery();
  const { currentUser, staff }   = state;

  if (!currentUser) return null;

  const isAdmin    = currentUser.role === 'admin';
  const isManager  = currentUser.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const myStaffMember = canViewAll ? null : (
    staff.find(s => s.userId === currentUser.id) ??
    staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase())
  );
  const myNumericId = myStaffMember?.id ?? null;

  const upcomingEvents    = events.filter(e => ['Sắp tới','Lên kế hoạch','Đang diễn ra'].includes(e.status));
  const activeEvent       = events.find(e => e.status === 'Đang diễn ra');
  const completedEvents   = events.filter(e => e.status === 'Đã hoàn thành');
  const lowStockItems     = inventory.filter(i => i.current < i.threshold);
  const pendingExpenses   = events.flatMap(e => e.receipts).filter(r => r.status === 'pending');
  const totalIncome       = completedEvents.reduce((s, e) => s + e.financials.income, 0);
  const myEvents          = myNumericId ? events.filter(e => e.staff.some(s => s.id === myNumericId)) : [];
  const myPendingExpenses = pendingExpenses.filter(r => myNumericId != null && r.staffId === String(myNumericId));

  const displayEvents = canViewAll
    ? [...upcomingEvents].sort((a, b) => parseDate(a.date) - parseDate(b.date)).slice(0, 5)
    : [...myEvents].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const now = new Date();
  const dateLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 animate-fade-up">

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-[var(--primary)] shadow-[var(--shadow-hero)]">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 right-16 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-4 right-40 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1 capitalize">
              {dateLabel}
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              Xin chào, {currentUser.name} 👋
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {canViewAll
                ? `${upcomingEvents.length} sự kiện sắp tới · ${pendingExpenses.length} chi phí chờ duyệt`
                : `${myEvents.length} sự kiện của bạn · ${myPendingExpenses.length} chi phí chờ duyệt`}
            </p>
          </div>

          {/* Active event pill */}
          {activeEvent ? (
            <Button
              onPress={() => navigate('/schedule/' + activeEvent.id)}
              variant="ghost"
              className="self-start md:self-auto flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl px-4 py-2.5 text-white font-semibold text-sm transition-all shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse shrink-0" />
              {activeEvent.name}
              <ChevronRight size={14} />
            </Button>
          ) : (
            <div className="self-start md:self-auto flex items-center gap-2 bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-white/50 text-sm shrink-0">
              <Clock size={14} />
              Không có sự kiện đang diễn ra
            </div>
          )}
        </div>
      </div>

      {/* ── KPI STATS ────────────────────────────────────────────────────── */}
      {canViewAll ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={<Calendar size={20} />}
            label="Sự kiện sắp tới"
            value={upcomingEvents.length}
            sub={`${completedEvents.length} đã hoàn thành`}
            color="primary"
            onClick={() => navigate('/schedule')}
          />
          <KpiCard
            icon={<DollarSign size={20} />}
            label="Doanh thu"
            value={formatCurrency(totalIncome)}
            sub={`${completedEvents.length} sự kiện`}
            color="success"
            onClick={() => navigate('/finance')}
          />
          <KpiCard
            icon={<Package size={20} />}
            label="Kho sắp hết"
            value={lowStockItems.length}
            sub={`${inventory.length} mặt hàng tổng`}
            color={lowStockItems.length > 0 ? 'danger' : 'primary'}
            alert={lowStockItems.length > 0}
            onClick={() => navigate('/inventory')}
          />
          <KpiCard
            icon={<Clock size={20} />}
            label="Chi phí chờ"
            value={pendingExpenses.length}
            sub="Cần phê duyệt"
            color={pendingExpenses.length > 0 ? 'warning' : 'primary'}
            alert={pendingExpenses.length > 0}
            onClick={() => navigate('/finance')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            icon={<Calendar size={20} />}
            label="Sự kiện của tôi"
            value={myEvents.length}
            sub="Tổng sự kiện"
            color="primary"
            onClick={() => navigate('/schedule')}
          />
          <KpiCard
            icon={<Clock size={20} />}
            label="Chi phí chờ"
            value={myPendingExpenses.length}
            sub="Cần phê duyệt"
            color={myPendingExpenses.length > 0 ? 'warning' : 'primary'}
            alert={myPendingExpenses.length > 0}
            onClick={() => navigate('/profile')}
          />
        </div>
      )}

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Truy cập nhanh" />
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          <QuickAction icon={<Calendar size={18} />}     label="Lịch sự kiện" onClick={() => navigate('/schedule')} />
          <QuickAction icon={<Package size={18} />}      label="Kho hàng"     onClick={() => navigate('/inventory')} />
          {canViewAll && <QuickAction icon={<BarChart2 size={18} />}   label="Tài chính"    onClick={() => navigate('/finance')} />}
          {canViewAll && <QuickAction icon={<Users size={18} />}       label="Nhân sự"      onClick={() => navigate('/hr')} />}
          {!canViewAll && <QuickAction icon={<Users size={18} />}      label="Hồ sơ"        onClick={() => navigate('/profile')} />}
          {!canViewAll && <QuickAction icon={<BarChart2 size={18} />}  label="Chi phí"      onClick={() => navigate('/profile')} />}
        </div>
      </div>

      {/* ── ACTIVE EVENT DETAIL ──────────────────────────────────────────── */}
      {activeEvent && (
        <div>
          <SectionHeader title="Đang diễn ra" icon={<Zap size={14} className="text-[var(--success)]" />} />
          <Button
            onPress={() => navigate('/schedule/' + activeEvent.id)}
            variant="ghost"
            className="w-full h-auto justify-start text-left glass-card rounded-2xl p-5 hover:border-[var(--success)]/30 transition-all glow-success"
          >
            <div className="flex w-full items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--success)]/10 border border-[var(--success)]/20 flex flex-col items-center justify-center shrink-0">
                <span className="text-lg font-black text-[var(--success)] leading-none">
                  {getDateParts(activeEvent.date).day}
                </span>
                <span className="text-[10px] font-semibold text-[var(--success)]/70 uppercase">
                  {getDateParts(activeEvent.date).month}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[var(--text-primary)] text-base truncate">{activeEvent.name}</p>
                  <StatusBadge status={activeEvent.status} />
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
                  <MapPin size={11} /> {activeEvent.location}
                </div>
                <StaffAvatars members={activeEvent.staff} />
              </div>
              <ArrowRight size={18} className="text-[var(--text-muted)] shrink-0" />
            </div>
          </Button>
        </div>
      )}

      {/* ── UPCOMING EVENTS + ANALYTICS GRID ────────────────────────────── */}
      <div className={`grid gap-5 ${canViewAll ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Upcoming events list */}
        <div>
          <SectionHeader
            title={canViewAll ? 'Sự kiện sắp tới' : 'Sự kiện của tôi'}
            onMore={canViewAll ? () => navigate('/schedule') : undefined}
          />
          {displayEvents.length === 0 ? (
            <EmptyState text="Không có sự kiện nào" />
          ) : (
            <div className="space-y-2">
              {displayEvents.filter(e => e.status !== 'Đang diễn ra').slice(0, 4).map(event => (
                <EventRow key={event.id} event={event} onClick={() => navigate('/schedule/' + event.id)} />
              ))}
              {displayEvents.filter(e => e.status !== 'Đang diễn ra').length === 0 && (
                <EmptyState text="Không có sự kiện sắp tới" />
              )}
            </div>
          )}
        </div>

        {/* Analytics — admin/manager only */}
        {canViewAll && (
          <div className="space-y-5">
            <div>
              <SectionHeader title="Doanh thu theo tháng" icon={<TrendingUp size={14} />} />
              <RevenueChart events={events} />
            </div>
            <div>
              <SectionHeader title="Top nhân viên" icon={<Star size={14} />} onMore={() => navigate('/hr')} />
              <TopStaffList events={events} staff={staff} />
            </div>
          </div>
        )}
      </div>

      {/* ── STAFF: PENDING EXPENSES ─────────────────────────────────────── */}
      {!canViewAll && myPendingExpenses.length > 0 && (
        <div>
          <SectionHeader title="Chi phí chờ duyệt" icon={<AlertTriangle size={14} className="text-[var(--warning)]" />} />
          <div className="space-y-2">
            {myPendingExpenses.map(exp => (
              <div key={exp.id} className="glass-card rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-[var(--warning)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{exp.type}</p>
                    <p className="text-xs text-[var(--text-muted)]">{exp.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{exp.amount}€</p>
                  <span className="text-[10px] font-semibold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 px-2 py-0.5 rounded-full">Chờ duyệt</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INVENTORY ALERTS ─────────────────────────────────────────────── */}
      {canViewAll && lowStockItems.length > 0 && (
        <div>
          <SectionHeader
            title={`Cảnh báo kho (${lowStockItems.length})`}
            icon={<AlertTriangle size={14} className="text-[var(--danger)]" />}
            onMore={() => navigate('/inventory')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {lowStockItems.slice(0, 4).map(item => (
              <div key={item.id} className="glass-card rounded-2xl p-3 flex items-center gap-3 glow-danger border-[var(--danger)]/15">
                <div className="w-8 h-8 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-center justify-center shrink-0">
                  <Package size={14} className="text-[var(--danger)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
                  <p className="text-xs text-[var(--danger)]">
                    Còn {item.current} {item.unit} / Ngưỡng {item.threshold}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type KpiColor = 'primary' | 'success' | 'danger' | 'warning';

function KpiCard({ icon, label, value, sub, color, alert, onClick }: {
  icon:    React.ReactNode;
  label:   string;
  value:   number | string;
  sub:     string;
  color:   KpiColor;
  alert?:  boolean;
  onClick?: () => void;
}) {
  const colorMap: Record<KpiColor, { icon: string; value: string; bg: string; border: string; glow: string }> = {
    primary: { icon: 'text-[var(--text-secondary)]',  value: 'text-[var(--text-primary)]', bg: 'bg-[var(--glass-bg)]', border: 'border-[var(--glass-border)]', glow: '' },
    success: { icon: 'text-[var(--success)]',         value: 'text-[var(--success)]',      bg: 'bg-[var(--success)]/8',  border: 'border-[var(--success)]/15', glow: '' },
    danger:  { icon: 'text-[var(--danger)]',          value: 'text-[var(--danger)]',       bg: 'bg-[var(--danger)]/8',   border: 'border-[var(--danger)]/15',  glow: 'glow-danger' },
    warning: { icon: 'text-[var(--warning)]',         value: 'text-[var(--warning)]',      bg: 'bg-[var(--warning)]/8',  border: 'border-[var(--warning)]/15', glow: 'glow-warning' },
  };
  const c = colorMap[color];

  return (
    <Button
      variant="ghost"
      onPress={onClick}
      className={`glass-card rounded-2xl p-4 flex flex-col gap-3 w-full h-auto justify-start text-left active:scale-[0.97] transition-all ${alert ? c.glow : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.bg} border ${c.border} ${c.icon}`}>
        {icon}
      </div>
      <div className="min-w-0 w-full">
        <p className={`text-2xl font-black leading-none ${c.value}`}>{value}</p>
        <p className="text-xs text-[var(--text-muted)] leading-tight mt-1 font-medium">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)]/70 mt-0.5">{sub}</p>
      </div>
    </Button>
  );
}

function QuickAction({ icon, label, onClick }: {
  icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onPress={onClick}
      className="glass-card rounded-2xl p-3 flex flex-col items-center gap-2 w-full h-auto active:scale-[0.97] transition-all hover:border-[var(--primary)]/20"
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)]">
        {icon}
      </div>
      <span className="text-[11px] font-semibold text-[var(--text-muted)] leading-tight text-center">{label}</span>
    </Button>
  );
}

function EventRow({ event, onClick }: { event: FestivalEvent; onClick: () => void }) {
  const { day, month } = getDateParts(event.date);
  return (
    <Button
      variant="ghost"
      onPress={onClick}
      className="w-full h-auto justify-start text-left glass-card rounded-2xl p-3.5 hover:border-[var(--primary)]/25 hover:shadow-[var(--shadow-card)] active:scale-[0.99] transition-all"
    >
      <div className="flex w-full items-center gap-3">
        {/* Date badge */}
        <div className="w-11 h-11 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex flex-col items-center justify-center shrink-0">
          <span className="text-sm font-black text-[var(--text-primary)] leading-none">{day}</span>
          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{month}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] truncate text-sm">{event.name}</p>
          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mt-0.5">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={event.status} />
          <span className="text-[10px] text-[var(--text-muted)]">
            {event.staff.length} NV
          </span>
        </div>
      </div>
    </Button>
  );
}

function StaffAvatars({ members }: { members: StaffRef[] }) {
  if (members.length === 0) {
    return <p className="text-xs text-[var(--text-muted)] mt-1.5">Chưa có nhân viên</p>;
  }
  const shown = members.slice(0, 5);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center mt-2 gap-2">
      <div className="flex -space-x-2">
        {shown.map(m => (
          <Avatar key={m.id} className="w-5 h-5 ring-2 ring-[var(--card)]">
            <Avatar.Fallback className="bg-[var(--primary)]/15 text-[var(--primary)] text-[9px] font-bold">
              {initials(m.name)}
            </Avatar.Fallback>
          </Avatar>
        ))}
        {extra > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--glass-bg)] text-[9px] font-semibold text-[var(--text-muted)] ring-2 ring-[var(--card)]">
            +{extra}
          </span>
        )}
      </div>
      <span className="text-[11px] text-[var(--text-muted)]">{members.length} nhân viên</span>
    </div>
  );
}

function SectionHeader({ title, onMore, icon }: { title: string; onMore?: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
        {icon} {title}
      </h2>
      {onMore && (
        <Button
          onPress={onMore}
          variant="ghost"
          size="sm"
          className="flex items-center gap-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition-colors"
        >
          Xem thêm <ChevronRight size={12} />
        </Button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-2">
      <CheckCircle2 size={28} className="text-[var(--text-muted)]/40" />
      <p className="text-sm text-[var(--text-muted)]">{text}</p>
    </div>
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

  if (entries.length === 0) return <EmptyState text="Chưa có dữ liệu doanh thu" />;

  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  const total  = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[var(--text-muted)] font-medium">6 tháng gần nhất</p>
        <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(total)}</p>
      </div>
      <div className="flex items-end gap-2 h-28">
        {entries.map(([month, val]) => (
          <div key={month} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] text-[var(--primary)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              {formatCurrency(val)}
            </span>
            <div
              className="w-full rounded-t-lg transition-all duration-300 hover:opacity-90"
              style={{
                height: `${Math.max((val / maxVal) * 88, 6)}px`,
                background: 'linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 50%, transparent))',
              }}
            />
            <span className="text-[9px] text-[var(--text-muted)] leading-none">{month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopStaffList({ events, staff }: { events: FestivalEvent[]; staff: StaffMember[] }) {
  const counts: Record<number, number> = {};
  events.forEach(e => e.staff.forEach(s => { counts[s.id] = (counts[s.id] ?? 0) + 1; }));
  const top = Object.entries(counts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 4)
    .map(([id, count]) => ({ member: staff.find(s => s.id === Number(id)), count }))
    .filter(x => x.member);

  if (top.length === 0) return <EmptyState text="Chưa có dữ liệu" />;

  const rankStyles = [
    { badge: 'bg-yellow-400/15 text-yellow-500 border-yellow-400/20', bar: 'bg-yellow-400' },
    { badge: 'bg-slate-400/15 text-slate-400 border-slate-400/20',   bar: 'bg-slate-400' },
    { badge: 'bg-amber-600/15 text-amber-600 border-amber-600/20',   bar: 'bg-amber-600' },
    { badge: 'bg-[var(--glass-bg)] text-[var(--text-muted)] border-[var(--glass-border)]', bar: 'bg-[var(--text-muted)]/40' },
  ];

  const maxCount = top[0]?.count ?? 1;

  return (
    <div className="glass-card rounded-2xl divide-y divide-[var(--glass-border)]">
      {top.map(({ member, count }, i) => {
        const rs = rankStyles[i] ?? rankStyles[3];
        return (
          <div key={member!.id} className="flex items-center gap-3 px-4 py-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${rs.badge}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{member!.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full bg-[var(--glass-border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${rs.bar}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-[var(--text-muted)] shrink-0">{count} SK</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
