import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
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
    <motion.aside
      className={`hidden md:flex flex-col ${w} shrink-0 sticky top-0 h-dvh pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] bg-background border-r border-border transition-[width] duration-200 overflow-hidden`}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ── User Profile ── */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={`w-full h-auto px-3 py-4 rounded-none hover:bg-default-100 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
          >
            {/* Avatar */}
            <motion.div
              className="relative shrink-0"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {notifCount > 0 ? (
                <div className="relative shrink-0">
                  <Avatar className="size-10 shadow-sm">
                    <AvatarFallback className="accent-gradient text-white text-sm font-bold flex items-center justify-center">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-destructive rounded-full border border-background">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                </div>
              ) : (
                <Avatar className="size-10 shadow-sm">
                  <AvatarFallback className="accent-gradient text-white text-sm font-bold flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>

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
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72 overflow-hidden rounded-2xl border border-border shadow-xl" align="start">
          <UserSheetContent
            onClose={() => setPopoverOpen(false)}
            onLogout={() => { setPopoverOpen(false); onLogout(); }}
            notifications={notifications}
            clearAll={clearAll}
            clearOne={clearOne}
          />
        </PopoverContent>
      </Popover>

      <Separator />

      {/* ── Nav items ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {tabs.map(({ path, icon, label, badge }, i) => {
          const isActive = activeSegment === path;
          const numBadge = badgeFor(path);

          return (
            <motion.div
              key={path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25, ease: 'easeOut' }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/' + path)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  w-full h-auto px-3 py-2.5 rounded-xl text-sm font-medium
                  flex items-center gap-3 transition-colors relative
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                  ${isActive
                    ? 'bg-default-100 text-foreground font-semibold'
                    : 'text-default-500 hover:text-foreground hover:bg-default-100 dark:hover:bg-default-100/20'
                  }
                `}
              >
                <motion.span
                  className={`shrink-0 ${isActive ? 'text-foreground' : 'text-default-400'}`}
                  animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {icon}
                </motion.span>

                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{label}</span>

                    {numBadge > 0 && (
                      <Badge className="bg-destructive/10 text-destructive border-none text-[10px] h-5 px-1.5 rounded-full hover:bg-destructive/10 font-bold">
                        {numBadge > 9 ? '9+' : numBadge}
                      </Badge>
                    )}

                    {badge === 'New' && numBadge === 0 && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] h-5 px-1.5 rounded-full hover:bg-emerald-500/10 font-bold">
                        New
                      </Badge>
                    )}
                  </>
                )}

                {isCollapsed && numBadge > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                )}
              </Button>
            </motion.div>
          );
        })}
      </nav>

      <Separator />

      {/* ── Bottom Actions ── */}
      <div className="px-2 py-3 flex flex-col gap-0.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/profile')}
          className={`w-full h-auto px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-default-500 hover:text-foreground hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <span className="shrink-0 text-default-400"><HelpCircle size={18} /></span>
          {!isCollapsed && <span>Trợ giúp & Thông tin</span>}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={logout}
          className={`w-full h-auto px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-default-500 hover:text-danger hover:bg-danger/10 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <span className="shrink-0 text-default-400 group-hover:text-danger"><LogOut size={18} /></span>
          {!isCollapsed && <span>Đăng xuất</span>}
        </Button>

        {/* Collapse toggle */}
        <Button
          type="button"
          variant="ghost"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="w-full h-auto px-3 py-2 rounded-xl text-default-400 hover:text-foreground hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors flex items-center justify-center mt-1"
        >
          {isCollapsed
            ? <PanelLeftOpen  size={16} />
            : <PanelLeftClose size={16} />
          }
        </Button>
      </div>
    </motion.aside>
  );
}
