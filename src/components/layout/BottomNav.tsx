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
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pb-safe" style={{ width: 'min(calc(100% - 32px), 440px)' }}>
      <div
        className="flex justify-around items-center px-3 py-2 rounded-[28px] shadow-2xl"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {tabs.map(({ tab, icon, label }) => {
          const isActive = activeTab === tab;
          return (
            <Button
              key={tab}
              variant="ghost"
              onPress={() => onTabChange(tab)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="flex flex-col items-center gap-1 px-2 py-1.5 min-w-0 flex-1 h-auto rounded-2xl"
            >
              <div className={`px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--glass-border)]'
                  : ''
              }`}>
                <span className={`block transition-colors duration-200 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {icon}
                </span>
              </div>
              <span
                className="text-[10px] font-semibold leading-none transition-colors duration-200"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
