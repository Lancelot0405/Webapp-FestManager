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
  } from 'lucide-react';
  import { useApp } from '../../context/AppContext';
  import type { ActiveTab } from '../../types';
  
  interface BottomNavProps {
    activeTab:    ActiveTab;
    onTabChange:  (tab: ActiveTab) => void;
  }
  
  // Cấu hình các tab — tách ra ngoài để dễ thêm tab mới sau này
  const ADMIN_TABS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'dashboard', icon: <LayoutDashboard size={24} />, label: 'Tổng quan' },
    { tab: 'schedule',  icon: <Calendar       size={24} />, label: 'Lịch trình' },
    { tab: 'inventory', icon: <Package        size={24} />, label: 'Kho hàng'   },
    { tab: 'finance',   icon: <DollarSign     size={24} />, label: 'Tài chính'  },
    { tab: 'hr',        icon: <Users          size={24} />, label: 'Nhân sự'    },
  ];
  
  const STAFF_TABS: { tab: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'dashboard', icon: <LayoutDashboard size={24} />, label: 'Tổng quan' },
    { tab: 'schedule',  icon: <Calendar       size={24} />, label: 'Lịch trình' },
    { tab: 'inventory', icon: <Package        size={24} />, label: 'Kho hàng'   },
    { tab: 'profile',   icon: <User           size={24} />, label: 'Hồ sơ'      },
  ];
  
  export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const { state } = useApp();
    const { currentUser } = state;
  
    if (!currentUser) return null;
  
    const tabs = currentUser.role === 'admin' ? ADMIN_TABS : STAFF_TABS;
  
    return (
      <nav className="bg-white border-t border-gray-200 absolute bottom-0 w-full px-4 py-3 flex justify-between items-center pb-safe z-20">
        {tabs.map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === tab ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    );
  }