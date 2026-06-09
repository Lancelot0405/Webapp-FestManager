import {
  LayoutDashboard,
  Calendar,
  Package,
  DollarSign,
  Users,
  User,
  Building2,
  UtensilsCrossed,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab:    ActiveTab;
  onTabChange:  (tab: ActiveTab) => void;
  onLogoClick:  () => void;
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

export default function Sidebar({ activeTab, onTabChange, onLogoClick }: SidebarProps) {
  const { state }       = useApp();
  const { currentUser } = state;

  if (!currentUser) return null;

  const tabs = currentUser.role === 'admin'   ? ADMIN_TABS
             : currentUser.role === 'manager' ? MANAGER_TABS
             : STAFF_TABS;

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-white/95 dark:bg-espresso-700/95 backdrop-blur-sm border-r border-brand-100 dark:border-espresso-600 shrink-0 sticky top-0 h-screen animate-slide-left shadow-card">

      {/* Logo */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-2.5 px-5 h-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 border-b border-brand-50 dark:border-espresso-600"
      >
        <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-[0_2px_8px_0_rgb(249_115_22/0.35)]">
          <UtensilsCrossed size={16} className="text-white" />
        </div>
        <span className="text-lg font-black tracking-tight text-brand-gradient select-none">
          FestManager
        </span>
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {tabs.map(({ tab, icon, label }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'bg-brand-gradient text-white shadow-[0_2px_8px_0_rgb(249_115_22/0.30)]'
                  : 'text-espresso-600 dark:text-espresso-200 hover:bg-brand-50 dark:hover:bg-espresso-600/50'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-brand-400 dark:text-brand-500'}>
                {icon}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* User info footer */}
      <div className="px-4 py-4 border-t border-brand-50 dark:border-espresso-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-espresso-800 dark:text-espresso-50 truncate">
              {currentUser.name}
            </p>
            <p className="text-[10px] font-medium text-brand-400 dark:text-brand-500 uppercase tracking-wide">
              {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
