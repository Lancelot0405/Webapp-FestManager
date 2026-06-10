import { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
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
  activeTab:   ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
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

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { state }       = useApp();
  const { currentUser } = state;

  // Ẩn nav khi bàn phím iOS mở — dùng rAF để tránh race condition
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let rafId = 0;
    const handler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setKeyboardOpen(window.innerHeight - vv.height > 150);
      });
    };
    vv.addEventListener('resize', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!currentUser || keyboardOpen) return null;

  const tabs = currentUser.role === 'admin'   ? ADMIN_TABS
             : currentUser.role === 'manager' ? MANAGER_TABS
             : STAFF_TABS;

  return (
    <nav className="bg-white dark:bg-slate-900 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md pb-safe z-20">
      <div className="flex justify-around items-center px-1 pt-1.5">
        {tabs.map(({ tab, icon, label }) => {
          const isActive = activeTab === tab;
          return (
            <Button
              key={tab}
              variant="ghost"
              onPress={() => onTabChange(tab)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 flex-1 h-auto rounded-xl"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-brand-gradient shadow-[0_2px_8px_0_rgb(124_58_237/0.35)]'
                  : 'text-slate-400'
              }`}>
                <span className={isActive ? 'text-white' : ''}>
                  {icon}
                </span>
              </div>
              <span className={`text-[10px] font-semibold leading-none transition-colors ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
