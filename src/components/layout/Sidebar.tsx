import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Popover } from '@heroui/react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import UserSheetContent from './UserSheetContent';

interface Notification { id: string; message: string; timestamp: string; type: string }

interface SidebarProps {
  onOpenSheet: () => void;
  notifCount?: number;
  notifications: Notification[];
  clearAll: () => void;
  clearOne: (id: string) => void;
  onLogout: () => void;
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

function getCollapsed(): boolean {
  try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
}

export default function Sidebar({ onOpenSheet, notifCount = 0, notifications, clearAll, clearOne, onLogout }: SidebarProps) {
  const { currentUser, logout } = useApp();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { data: events = [] } = useEventsQuery();
  const [isCollapsed, setIsCollapsed] = useState(getCollapsed);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // suppress unused warning — onOpenSheet is for mobile BottomNav compatibility
  void onOpenSheet;

  const toggleCollapse = () => {
    setIsCollapsed(v => {
      const next = !v;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { /* noop */ }
      return next;
    });
  };

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

  const avatarBtn = (
    <div className="relative w-9 h-9 rounded-full accent-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm cursor-pointer">
      {currentUser.name.charAt(0).toUpperCase()}
      {notifCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-danger-foreground text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-content1">
          {notifCount > 9 ? '9+' : notifCount}
        </span>
      )}
    </div>
  );

  const w = isCollapsed ? 'w-16' : 'w-64';

  return (
    <aside className={`hidden md:flex flex-col ${w} shrink-0 sticky top-0 h-screen bg-content1 border-r border-separator/80 transition-[width] duration-200 overflow-hidden`}>

      {/* User Profile (Top) */}
      <div className="h-20 w-full flex items-center px-3 justify-center border-b border-separator/40 shrink-0">
        {/* Desktop: Popover */}
        <Popover isOpen={popoverOpen} onOpenChange={setPopoverOpen}>
          <Popover.Trigger className="w-full">
            <Button
              variant="ghost"
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-default/40 h-auto ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              {avatarBtn}
              {!isCollapsed && (
                <div className="min-w-0 flex-1 text-left overflow-hidden">
                  <p className="text-[13.5px] font-bold text-foreground truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-default-500 font-medium mt-0.5">
                    {roleLabel[currentUser.role]}
                  </p>
                </div>
              )}
            </Button>
          </Popover.Trigger>
          <Popover.Content className="p-0 w-72 overflow-hidden rounded-2xl border border-separator shadow-xl">
            <Popover.Dialog aria-label="Tài khoản người dùng">
              <UserSheetContent
                onClose={() => setPopoverOpen(false)}
                onLogout={() => { setPopoverOpen(false); onLogout(); }}
                notifications={notifications}
                clearAll={clearAll}
                clearOne={clearOne}
              />
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {tabs.map(({ path, icon, label, badge }) => {
          const isActive = activeSegment === path;
          const normalBadge = badgeFor(path);
          return (
            <Button
              key={path}
              variant="ghost"
              onPress={() => navigate('/' + path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium h-auto transition-all ${isCollapsed ? 'justify-center' : 'justify-start'} ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'text-default-500 hover:text-foreground hover:bg-default/40 dark:hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{icon}</span>
              {!isCollapsed && <span>{label}</span>}
              {!isCollapsed && normalBadge > 0 && (
                <span className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold bg-danger text-danger-foreground">
                  {normalBadge > 9 ? '9+' : normalBadge}
                </span>
              )}
              {isCollapsed && normalBadge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
              )}
              {!isCollapsed && badge === 'New' && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                  New
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-2 py-4 border-t border-separator/50 flex flex-col gap-1 shrink-0">
        <Button
          variant="ghost"
          onPress={() => navigate('/profile')}
          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium h-auto text-default-500 hover:text-foreground hover:bg-default/40 dark:hover:bg-white/5 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <span className="shrink-0"><HelpCircle size={18} /></span>
          {!isCollapsed && <span>Trợ giúp & Thông tin</span>}
        </Button>

        <Button
          variant="ghost"
          onPress={logout}
          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium h-auto text-default-500 hover:text-danger hover:bg-danger/10 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <span className="shrink-0"><LogOut size={18} /></span>
          {!isCollapsed && <span>Đăng xuất</span>}
        </Button>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          onPress={toggleCollapse}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="relative w-full flex items-center justify-center px-3 py-2 rounded-xl text-sm h-auto text-default-400 hover:text-foreground hover:bg-default/40 transition-all mt-1"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
    </aside>
  );
}
