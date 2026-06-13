import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Package,
  DollarSign,
  Users,
  User,
  Building2,
  UtensilsCrossed,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';

interface SidebarProps {
  onOpenSheet?: () => void;
  notifCount?:  number;
}

const ADMIN_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={18} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={18} />, label: 'Kho hàng'   },
  { path: 'finance',   icon: <DollarSign      size={18} />, label: 'Tài chính'  },
  { path: 'hr',        icon: <Users           size={18} />, label: 'Nhân sự'    },
  { path: 'clients',   icon: <Building2       size={18} />, label: 'Khách hàng' },
];

const MANAGER_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={18} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={18} />, label: 'Kho hàng'   },
  { path: 'hr',        icon: <Users           size={18} />, label: 'Nhân sự'    },
  { path: 'profile',   icon: <User            size={18} />, label: 'Hồ sơ'      },
];

const STAFF_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={18} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={18} />, label: 'Kho hàng'   },
  { path: 'profile',   icon: <User            size={18} />, label: 'Hồ sơ'      },
];

const roleLabel: Record<string, string> = {
  admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên',
};

const roleBadgeClass: Record<string, string> = {
  admin:   'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  staff:   'bg-default text-default-foreground',
};

export default function Sidebar({ onOpenSheet, notifCount = 0 }: SidebarProps) {
  const { currentUser } = useApp();
  const navigate        = useNavigate();
  const location        = useLocation();
  const { data: events = [] } = useEventsQuery();

  if (!currentUser) return null;

  const tabs = currentUser.role === 'admin'   ? ADMIN_TABS
             : currentUser.role === 'manager' ? MANAGER_TABS
             : STAFF_TABS;

  const pendingExpenses = events.reduce(
    (sum, e) => sum + e.receipts.filter(r => r.status === 'pending').length,
    0
  );
  const badgeFor = (path: string) =>
    path === 'finance' && pendingExpenses > 0 ? pendingExpenses : 0;

  const activeSegment = location.pathname.split('/')[1] || 'dashboard';

  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-64 shrink-0 sticky top-0 h-screen bg-surface border-r border-separator">

      {/* Logo */}
      <button
        onClick={() => navigate('/dashboard')}
        className="h-16 flex items-center gap-3 px-3 lg:px-5 border-b border-separator hover:bg-default/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 justify-center lg:justify-start"
      >
        <div className="w-8 h-8 rounded-xl accent-gradient flex items-center justify-center shrink-0">
          <UtensilsCrossed size={15} className="text-white" />
        </div>
        <span className="hidden lg:block text-[15px] font-bold tracking-tight text-foreground select-none">
          FestManager
        </span>
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-0.5 overflow-y-auto">
        {tabs.map(({ path, icon, label }) => {
          const isActive = activeSegment === path;
          const badge    = badgeFor(path);
          return (
            <button
              key={path}
              onClick={() => navigate('/' + path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-2.5 lg:px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 justify-center lg:justify-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-foreground hover:bg-default/50'
              }`}
            >
              <span className="shrink-0">{icon}</span>
              <span className="hidden lg:block">{label}</span>
              {badge > 0 && (
                <>
                  <span className="hidden lg:flex ml-auto h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] font-bold bg-danger text-danger-foreground">
                    {badge > 9 ? '9+' : badge}
                  </span>
                  <span className="lg:hidden absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Section label */}
      <div className="hidden lg:block px-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Tài khoản</p>
      </div>

      {/* User footer */}
      <div className="px-2 lg:px-3 pb-4 pt-1 border-t border-separator">
        <button
          onClick={onOpenSheet}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-default/50 transition-colors justify-center lg:justify-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Mở tài khoản và cài đặt"
        >
          <div className="relative w-8 h-8 rounded-full accent-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-danger-foreground text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </div>
          <div className="hidden lg:block min-w-0 flex-1 text-left">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
              {currentUser.name}
            </p>
            <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleBadgeClass[currentUser.role] ?? roleBadgeClass.staff}`}>
              {roleLabel[currentUser.role]}
            </span>
          </div>
          <ChevronUp size={14} className="hidden lg:block text-muted shrink-0" />
        </button>
      </div>
    </aside>
  );
}
