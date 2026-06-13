import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Chip, Popover, Separator } from '@heroui/react';
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
  PanelLeftClose,
  PanelLeftOpen,
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
  admin: 'Admin', manager: 'Quản lý', staff: 'Nhân viên',
};

function getCollapsed(): boolean {
  try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
}

export default function Sidebar({ onOpenSheet, notifCount = 0, notifications, clearAll, clearOne, onLogout }: SidebarProps) {
  const { currentUser, logout } = useApp();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { data: events = [] } = useEventsQuery();
  const [isCollapsed, setIsCollapsed] = useState(getCollapsed);
  const [popoverOpen, setPopoverOpen] = useState(false);

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
    (sum, e) => sum + e.receipts.filter(r => r.status === 'pending').length, 0
  );
  const badgeFor = (path: string) => path === 'finance' && pendingExpenses > 0 ? pendingExpenses : 0;

  const activeSegment = location.pathname.split('/')[1] || 'dashboard';

  const w = isCollapsed ? 'w-[72px]' : 'w-[240px]';

  return (
    <aside className={`hidden md:flex flex-col ${w} shrink-0 sticky top-0 h-screen bg-background border-r border-default-200 transition-[width] duration-200 overflow-hidden`}>

      {/* ── User Profile ── */}
      <Popover isOpen={popoverOpen} onOpenChange={setPopoverOpen}>
        <Popover.Trigger className="w-full shrink-0">
          <Button
            variant="ghost"
            className={`w-full h-auto px-3 py-4 rounded-none hover:bg-default-100 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold text-foreground truncate leading-snug">
                  {currentUser.name}
                </p>
                <p className="text-xs text-default-500 truncate leading-snug mt-0.5">
                  {roleLabel[currentUser.role]}
                </p>
              </div>
            )}
          </Button>
        </Popover.Trigger>
        <Popover.Content className="p-0 w-72 overflow-hidden rounded-2xl border border-default-200 shadow-xl">
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

      <Separator />

      {/* ── Nav items ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {tabs.map(({ path, icon, label, badge }) => {
          const isActive    = activeSegment === path;
          const numBadge    = badgeFor(path);

          return (
            <Button
              key={path}
              variant="ghost"
              onPress={() => navigate('/' + path)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                w-full h-auto px-3 py-2.5 rounded-xl text-sm font-medium
                flex items-center gap-3 transition-colors
                ${isCollapsed ? 'justify-center' : 'justify-start'}
                ${isActive
                  ? 'bg-default-100 text-foreground font-semibold'
                  : 'text-default-500 hover:text-foreground hover:bg-default-100 dark:hover:bg-default-100/20'
                }
              `}
            >
              <span className={`shrink-0 ${isActive ? 'text-foreground' : 'text-default-400'}`}>
                {icon}
              </span>

              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{label}</span>

                  {numBadge > 0 && (
                    <Chip size="sm" variant="soft" color="danger" className="text-[10px] h-5 min-w-0 px-1.5">
                      {numBadge > 9 ? '9+' : numBadge}
                    </Chip>
                  )}

                  {badge === 'New' && numBadge === 0 && (
                    <Chip size="sm" variant="soft" color="success" className="text-[10px] h-5 min-w-0 px-1.5">
                      New
                    </Chip>
                  )}
                </>
              )}

              {/* Collapsed: dot badge */}
              {isCollapsed && numBadge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
              )}
            </Button>
          );
        })}
      </nav>

      <Separator />

      {/* ── Bottom Actions ── */}
      <div className="px-2 py-3 flex flex-col gap-0.5 shrink-0">
        <Button
          variant="ghost"
          onPress={() => navigate('/profile')}
          className={`w-full h-auto px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-default-500 hover:text-foreground hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <span className="shrink-0 text-default-400"><HelpCircle size={18} /></span>
          {!isCollapsed && <span>Trợ giúp & Thông tin</span>}
        </Button>

        <Button
          variant="ghost"
          onPress={logout}
          className={`w-full h-auto px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-default-500 hover:text-danger hover:bg-danger/10 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <span className="shrink-0 text-default-400 group-hover:text-danger"><LogOut size={18} /></span>
          {!isCollapsed && <span>Đăng xuất</span>}
        </Button>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          onPress={toggleCollapse}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="w-full h-auto px-3 py-2 rounded-xl text-default-400 hover:text-foreground hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors flex items-center justify-center mt-1"
        >
          {isCollapsed
            ? <PanelLeftOpen  size={16} />
            : <PanelLeftClose size={16} />
          }
        </Button>
      </div>
    </aside>
  );
}
