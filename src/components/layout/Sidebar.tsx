import { Button } from '@heroui/react';
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
import type { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab:    ActiveTab;
  onTabChange:  (tab: ActiveTab) => void;
  onLogoClick:  () => void;
  onOpenSheet?: () => void;
  notifCount?:  number;
}

const ADMIN_TABS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Tổng quan'  },
  { tab: 'schedule',  icon: <Calendar        size={20} />, label: 'Lịch trình' },
  { tab: 'inventory', icon: <Package         size={20} />, label: 'Kho hàng'   },
  { tab: 'finance',   icon: <DollarSign      size={20} />, label: 'Tài chính'  },
  { tab: 'hr',        icon: <Users           size={20} />, label: 'Nhân sự'    },
  { tab: 'clients',   icon: <Building2       size={20} />, label: 'Khách hàng' },
];

const MANAGER_TABS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Tổng quan'  },
  { tab: 'schedule',  icon: <Calendar        size={20} />, label: 'Lịch trình' },
  { tab: 'inventory', icon: <Package         size={20} />, label: 'Kho hàng'   },
  { tab: 'hr',        icon: <Users           size={20} />, label: 'Nhân sự'    },
  { tab: 'profile',   icon: <User            size={20} />, label: 'Hồ sơ'      },
];

const STAFF_TABS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Tổng quan'  },
  { tab: 'schedule',  icon: <Calendar        size={20} />, label: 'Lịch trình' },
  { tab: 'inventory', icon: <Package         size={20} />, label: 'Kho hàng'   },
  { tab: 'profile',   icon: <User            size={20} />, label: 'Hồ sơ'      },
];

const roleLabel: Record<string, string> = {
  admin: 'Admin', manager: 'Quản lý', staff: 'Nhân viên',
};

export default function Sidebar({ activeTab, onTabChange, onLogoClick, onOpenSheet, notifCount = 0 }: SidebarProps) {
  const { state }       = useApp();
  const { currentUser } = state;

  if (!currentUser) return null;

  const tabs = currentUser.role === 'admin'   ? ADMIN_TABS
             : currentUser.role === 'manager' ? MANAGER_TABS
             : STAFF_TABS;

  const pendingExpenses = state.events.reduce(
    (sum, e) => sum + e.receipts.filter(r => r.status === 'pending').length,
    0
  );
  const badgeFor = (tab: ActiveTab) =>
    tab === 'finance' && pendingExpenses > 0 ? pendingExpenses : 0;

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 glass-card border-r border-[var(--glass-border)] shrink-0 sticky top-0 h-screen animate-slide-left">

      {/* Logo */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-2.5 px-5 h-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 border-b border-[var(--glass-border)]"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-[var(--shadow-float)]">
          <UtensilsCrossed size={16} className="text-[var(--background)]" />
        </div>
        <span className="text-lg font-black tracking-tight text-[var(--text-primary)] select-none">
          FestManager
        </span>
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {tabs.map(({ tab, icon, label }) => {
          const isActive = activeTab === tab;
          const badge = badgeFor(tab);
          return (
            <Button
              key={tab}
              variant={isActive ? 'primary' : 'ghost'}
              onPress={() => onTabChange(tab)}
              aria-current={isActive ? 'page' : undefined}
              fullWidth
              className={`flex items-center gap-3 px-3 py-2.5 justify-start text-sm md:text-base font-semibold h-auto rounded-xl ${
                isActive
                  ? 'bg-[var(--primary)] text-[var(--background)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
              }`}
            >
              <span className={isActive ? 'text-[var(--background)]' : 'text-[var(--text-muted)]'}>
                {icon}
              </span>
              {label}
              {badge > 0 && (
                <span className={`ml-auto min-w-5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-center ${
                  isActive ? 'bg-[var(--background)]/20 text-[var(--background)]' : 'bg-[var(--danger)] text-white'
                }`}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* User info footer — mở UserSheet (theme, thông báo, đăng xuất...) */}
      <div className="px-3 py-3 border-t border-[var(--glass-border)]">
        <button
          onClick={onOpenSheet}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[var(--glass-bg)] transition-colors"
          aria-label="Mở tài khoản và cài đặt"
        >
          <div className="relative w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--background)] text-xs font-bold shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--card)]">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {currentUser.name}
            </p>
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {roleLabel[currentUser.role]}
            </p>
          </div>
          <ChevronUp size={16} className="text-[var(--text-muted)] shrink-0" />
        </button>
      </div>
    </aside>
  );
}
