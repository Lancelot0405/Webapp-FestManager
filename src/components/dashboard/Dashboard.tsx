// =============================================================================
// src/components/dashboard/Dashboard.tsx
// =============================================================================

import { Calendar, Users, Package, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';

interface DashboardProps {
  onSelectEvent: (id: number) => void;
}

export default function Dashboard({ onSelectEvent }: DashboardProps) {
  const { state } = useApp();
  const { currentUser, events, inventory, staff } = state;

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
  const allStaffIds = new Set(events.flatMap(e => e.staff.map(s => s.id)));
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
    <div className="space-y-6 pb-20">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          Xin chào, {currentUser.name} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'Bảng điều khiển quản trị' : 'Bảng thông tin cá nhân'}
        </p>
      </div>

      {/* Quick stats */}
      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar size={20} className="text-blue-500" />}
            label="Sự kiện sắp tới"
            value={upcomingEvents.length}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<Users size={20} className="text-purple-500" />}
            label="Tổng nhân viên"
            value={allStaffIds.size}
            bg="bg-purple-50"
          />
          <StatCard
            icon={<Package size={20} className="text-red-500" />}
            label="Kho sắp hết"
            value={lowStockCount}
            bg="bg-red-50"
            alert={lowStockCount > 0}
          />
          <StatCard
            icon={<Clock size={20} className="text-yellow-500" />}
            label="Chi phí chờ duyệt"
            value={pendingExpenses.length}
            bg="bg-yellow-50"
            alert={pendingExpenses.length > 0}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar size={20} className="text-blue-500" />}
            label="Sự kiện của tôi"
            value={myEvents.length}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<Clock size={20} className="text-yellow-500" />}
            label="Chi phí chờ duyệt"
            value={myPendingExpenses.length}
            bg="bg-yellow-50"
            alert={myPendingExpenses.length > 0}
          />
        </div>
      )}

      {/* Upcoming events */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          {isAdmin ? 'Sự kiện sắp tới' : 'Sự kiện của tôi'}
        </h2>
        {displayEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Không có sự kiện nào</p>
        ) : (
          <div className="space-y-3">
            {displayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
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
          <h2 className="text-base font-semibold text-gray-700 mb-3">Chi phí chờ duyệt</h2>
          <div className="space-y-2">
            {myPendingExpenses.map(exp => (
              <div key={exp.id} className="bg-yellow-50 rounded-lg p-3 flex justify-between items-center">
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
}

function StatCard({ icon, label, value, bg, alert }: StatCardProps) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
      </div>
    </div>
  );
}
