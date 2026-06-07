// =============================================================================
// src/components/dashboard/Dashboard.tsx
// =============================================================================

import { useState, useEffect } from 'react';
import { Calendar, Users, Package, Clock, Download, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import type { ActiveTab, FestivalEvent, StaffMember } from '../../types';

interface DashboardProps {
  onSelectEvent: (id: number) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export default function Dashboard({ onSelectEvent, onNavigate }: DashboardProps) {
  const { state } = useApp();
  const { currentUser, events, inventory, staff } = state;

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null);
  const [installDismissed, setInstallDismissed] = useState(() => localStorage.getItem('fm_install_dismissed') === '1');
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Detect iOS (Safari)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = (window.navigator as any).standalone === true;
    setIsIos(ios && !standalone);

    // Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIos) { setShowIosGuide(true); return; }
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const dismissInstall = () => {
    localStorage.setItem('fm_install_dismissed', '1');
    setInstallDismissed(true);
    setShowIosGuide(false);
  };

  const showInstallBanner = !installDismissed && (installPrompt !== null || isIos);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Tìm numeric staff ID của user hiện tại
  const myStaffMember = isAdmin ? null : (
    staff.find(s => s.userId === currentUser.id)
    ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase())
  );
  const myNumericId = myStaffMember?.id ?? null;

  // Events mà staff được phân công
  const myEvents = myNumericId
    ? events.filter(e => e.staff.some(s => s.id === myNumericId))
    : [];

  // Computed stats
  const upcomingEvents = events.filter(
    e => e.status === 'Sắp tới' || e.status === 'Lên kế hoạch' || e.status === 'Đang diễn ra'
  );
  const lowStockCount = inventory.filter(i => i.current < i.threshold).length;
  const totalStaff = staff.length;
  const pendingExpenses = events.flatMap(e => e.receipts).filter(r => r.status === 'pending');
  const myPendingExpenses = pendingExpenses.filter(r =>
    myNumericId != null && r.staffId === String(myNumericId)
  );

  // Admin: 3 sự kiện sắp nhất; Staff: sự kiện được phân công
  const parse = (d: string) => {
    const [dd, mm, yyyy] = d.split('-');
    return new Date(`${yyyy}-${mm}-${dd}`).getTime();
  };

  const displayEvents = isAdmin
    ? [...upcomingEvents].sort((a, b) => parse(a.date) - parse(b.date)).slice(0, 3)
    : [...myEvents].sort((a, b) => parse(a.date) - parse(b.date));

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white">
        <h1 className="text-lg font-bold leading-tight">
          Xin chào, {currentUser.name} 👋
        </h1>
        <p className="text-blue-100 text-sm mt-0.5">
          {isAdmin ? 'Bảng điều khiển quản trị' : 'Bảng thông tin cá nhân'}
        </p>
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && !showIosGuide && (
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl p-4 flex items-center gap-3 text-white shadow-md">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">Cài đặt FestManager</p>
            <p className="text-xs text-white/80 mt-0.5">Thêm vào màn hình chính để dùng nhanh hơn</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              Cài
            </button>
            <button onClick={dismissInstall} className="text-white/60 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* iOS install guide */}
      {showIosGuide && (
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800 text-sm">Cài app trên iPhone / iPad</p>
            <button onClick={dismissInstall} className="text-gray-400"><X size={16} /></button>
          </div>
          <div className="space-y-2.5">
            <Step n={1} text='Bấm nút Chia sẻ ở thanh dưới Safari (biểu tượng hình vuông có mũi tên lên ↑)' />
            <Step n={2} text='Cuộn xuống và chọn "Thêm vào màn hình chính"' />
            <Step n={3} text='Bấm "Thêm" ở góc phải trên cùng' />
          </div>
          <p className="text-xs text-gray-400">Sau khi cài xong, mở app từ màn hình chính để dùng như ứng dụng native.</p>
        </div>
      )}

      {/* Quick stats */}
      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar size={20} className="text-blue-500" />}
            label="Sự kiện sắp tới"
            value={upcomingEvents.length}
            bg="bg-blue-50"
            onClick={() => onNavigate('schedule')}
          />
          <StatCard
            icon={<Users size={20} className="text-purple-500" />}
            label="Tổng nhân viên"
            value={totalStaff}
            bg="bg-purple-50"
            onClick={() => onNavigate('hr')}
          />
          <StatCard
            icon={<Package size={20} className="text-red-500" />}
            label="Kho sắp hết"
            value={lowStockCount}
            bg="bg-red-50"
            alert={lowStockCount > 0}
            onClick={() => onNavigate('inventory')}
          />
          <StatCard
            icon={<Clock size={20} className="text-yellow-500" />}
            label="Chi phí chờ duyệt"
            value={pendingExpenses.length}
            bg="bg-yellow-50"
            alert={pendingExpenses.length > 0}
            onClick={() => onNavigate('finance')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar size={20} className="text-blue-500" />}
            label="Sự kiện của tôi"
            value={myEvents.length}
            bg="bg-blue-50"
            onClick={() => onNavigate('schedule')}
          />
          <StatCard
            icon={<Clock size={20} className="text-yellow-500" />}
            label="Chi phí chờ duyệt"
            value={myPendingExpenses.length}
            bg="bg-yellow-50"
            alert={myPendingExpenses.length > 0}
            onClick={() => onNavigate('profile')}
          />
        </div>
      )}

      {/* Upcoming events */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {isAdmin ? 'Sự kiện sắp tới' : 'Sự kiện của tôi'}
        </h2>
        {displayEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Không có sự kiện nào</p>
        ) : (
          <div className="space-y-2.5">
            {displayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-150"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{event.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.date} · {event.location}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{event.staff.length} nhân viên</p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Staff: pending expenses */}
      {!isAdmin && myPendingExpenses.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Chi phí chờ duyệt</h2>
          <div className="space-y-2">
            {myPendingExpenses.map(exp => (
              <div key={exp.id} className="bg-yellow-50 rounded-2xl p-3 flex justify-between items-center border border-yellow-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{exp.type}</p>
                  <p className="text-xs text-gray-500">{exp.date}</p>
                </div>
                <span className="text-sm font-bold text-yellow-700">{exp.amount}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics section - admin only */}
      {isAdmin && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Doanh thu theo tháng</h2>
          <RevenueChart events={events} />

          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-4">Top nhân viên</h2>
          <TopStaffList events={events} staff={staff} />
        </div>
      )}
    </div>
  );
}

// Sub-component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  alert?: boolean;
  onClick?: () => void;
}

function StatCard({ icon, label, value, bg, alert, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${bg} rounded-2xl p-4 flex items-center gap-3 w-full text-left transition-all duration-150 active:opacity-70 ${onClick ? 'hover:brightness-95 cursor-pointer' : ''}`}
    >
      <div className="shrink-0">{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
      </div>
    </button>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-sm text-gray-700 leading-snug">{text}</p>
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

  if (entries.length === 0) return <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>;

  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-end gap-2 h-24">
        {entries.map(([month, val]) => (
          <div key={month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-blue-500 rounded-t-md transition-all"
              style={{ height: `${Math.max((val / maxVal) * 80, 4)}px` }}
            />
            <span className="text-[9px] text-gray-400 leading-none">{month}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">Max: {maxVal.toLocaleString('fr-FR')}€</p>
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

  if (top.length === 0) return <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
      {top.map(({ member, count }, i) => (
        <div key={member!.id} className="flex items-center gap-3 px-4 py-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{member!.name}</p>
            <p className="text-xs text-gray-400">{member!.city}</p>
          </div>
          <span className="text-sm font-bold text-blue-600">{count} sự kiện</span>
        </div>
      ))}
    </div>
  );
}
