import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import {
  LayoutDashboard,
  Calendar,
  Package,
  DollarSign,
  Users,
  User,
  Building2,
  HelpCircle,
  LogOut,
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
  { path: 'hr',        icon: <Users           size={18} />, label: 'Nhân sự', badge: 'New' },
  { path: 'clients',   icon: <Building2       size={18} />, label: 'Khách hàng' },
];

const MANAGER_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={18} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={18} />, label: 'Kho hàng'   },
  { path: 'hr',        icon: <Users           size={18} />, label: 'Nhân sự', badge: 'New' },
  { path: 'profile',   icon: <User            size={18} />, label: 'Hồ sơ'      },
];

const STAFF_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={18} />, label: 'Lịch trình', badge: 'New' },
  { path: 'inventory', icon: <Package         size={18} />, label: 'Kho hàng'   },
  { path: 'profile',   icon: <User            size={18} />, label: 'Hồ sơ'      },
];

const roleLabel: Record<string, string> = {
  admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên',
};

export default function Sidebar({ onOpenSheet, notifCount = 0 }: SidebarProps) {
  const { currentUser, logout } = useApp();
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
    <aside className="hidden md:flex flex-col w-16 lg:w-64 shrink-0 sticky top-0 h-screen bg-background border-r border-separator/80">

      {/* User Profile (Top) */}
      <div className="h-20 w-full flex items-center px-3 lg:px-5 justify-center lg:justify-start border-b border-separator/40">
        <Button
          variant="ghost"
          onPress={onOpenSheet}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-default/40 justify-center lg:justify-start h-auto"
        >
          <div className="relative w-9 h-9 rounded-full accent-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {currentUser.name.charAt(0).toUpperCase()}
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-danger-foreground text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </div>
          <div className="hidden lg:block min-w-0 flex-1 text-left">
            <p className="text-[13.5px] font-bold text-foreground truncate leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-default-500 font-medium mt-0.5">
              {roleLabel[currentUser.role]}
            </p>
          </div>
        </Button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1 overflow-y-auto">
        {tabs.map(({ path, icon, label, badge }) => {
          const isActive = activeSegment === path;
          const normalBadge = badgeFor(path);
          return (
            <Button
              key={path}
              variant="ghost"
              onPress={() => navigate('/' + path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium justify-center lg:justify-start h-auto transition-all ${
                isActive
                  ? 'bg-default-200/50 dark:bg-white/10 text-foreground font-semibold shadow-sm'
                  : 'text-default-500 hover:text-foreground hover:bg-default/40 dark:hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{icon}</span>
              <span className="hidden lg:block">{label}</span>
              {normalBadge > 0 && (
                <>
                  <span className="hidden lg:flex ml-auto h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] font-bold bg-danger text-danger-foreground">
                    {normalBadge > 9 ? '9+' : normalBadge}
                  </span>
                  <span className="lg:hidden absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                </>
              )}
              {badge === 'New' && (
                <span className="hidden lg:flex ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                  New
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-2 lg:px-3 py-4 border-t border-separator/50 flex flex-col gap-1">
        {/* Help & Information */}
        <Button
          variant="ghost"
          onPress={() => navigate('/profile')}
          className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium justify-center lg:justify-start h-auto text-default-500 hover:text-foreground hover:bg-default/40 dark:hover:bg-white/5"
        >
          <span className="shrink-0"><HelpCircle size={18} /></span>
          <span className="hidden lg:block">Trợ giúp & Thông tin</span>
        </Button>

        {/* Log out */}
        <Button
          variant="ghost"
          onPress={logout}
          className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium justify-center lg:justify-start h-auto text-default-500 hover:text-danger hover:bg-danger/10"
        >
          <span className="shrink-0"><LogOut size={18} /></span>
          <span className="hidden lg:block">Đăng xuất</span>
        </Button>
      </div>
    </aside>
  );
}
