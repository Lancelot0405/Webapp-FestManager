// =============================================================================
// src/components/layout/BottomNav.tsx
// =============================================================================

import {
    LayoutDashboard,
    Calendar,
    Package,
    DollarSign,
    Users,
    User,
    Building2,
  } from 'lucide-react';
  import { useApp } from '../../context/AppContext';
  import type { ActiveTab } from '../../types';

  interface BottomNavProps {
    activeTab:    ActiveTab;
    onTabChange:  (tab: ActiveTab) => void;
  }

  const ADMIN_TABS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Tổng quan' },
    { tab: 'schedule',  icon: <Calendar       size={20} />, label: 'Lịch trình' },
    { tab: 'inventory', icon: <Package        size={20} />, label: 'Kho hàng'   },
    { tab: 'finance',   icon: <DollarSign     size={20} />, label: 'Tài chính'  },
    { tab: 'hr',        icon: <Users          size={20} />, label: 'Nhân sự'    },
    { tab: 'clients',   icon: <Building2      size={20} />, label: 'Khách hàng' },
  ];

  const STAFF_TABS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Tổng quan' },
    { tab: 'schedule',  icon: <Calendar       size={20} />, label: 'Lịch trình' },
    { tab: 'inventory', icon: <Package        size={20} />, label: 'Kho hàng'   },
    { tab: 'profile',   icon: <User           size={20} />, label: 'Hồ sơ'      },
  ];

  export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const { state } = useApp();
    const { currentUser } = state;

    if (!currentUser) return null;

    const tabs = currentUser.role === 'admin' ? ADMIN_TABS : STAFF_TABS;

    return (
      <nav className="bg-white/95 backdrop-blur-sm border-t border-gray-100 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md pb-safe z-20">
        <div className="flex justify-around items-center px-2 pt-2">
          {tabs.map(({ tab, icon, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-0 flex-1 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 active:bg-gray-100'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-150 ${isActive ? 'bg-blue-50' : ''}`}>
                  {icon}
                </div>
                <span className={`text-[10px] font-semibold leading-none transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
