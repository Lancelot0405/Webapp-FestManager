import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs } from '@heroui/react';
import {
  LayoutDashboard,
  Calendar,
  Package,
  DollarSign,
  Users,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BottomNavProps {
  navVisible?: boolean;
  onOpenSheet?: () => void;
  notifCount?: number;
}

const ADMIN_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={19} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={19} />, label: 'Kho hàng'   },
  { path: 'finance',   icon: <DollarSign      size={19} />, label: 'Tài chính'  },
  { path: 'hr',        icon: <Users           size={19} />, label: 'Nhân sự'    },
  { path: 'clients',   icon: <Building2       size={19} />, label: 'Khách hàng' },
  { path: 'profile',   icon: null,                          label: 'Hồ sơ'      },
];

const MANAGER_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={19} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={19} />, label: 'Kho hàng'   },
  { path: 'hr',        icon: <Users           size={19} />, label: 'Nhân sự'    },
  { path: 'profile',   icon: null,                          label: 'Hồ sơ'      },
];

const STAFF_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={19} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={19} />, label: 'Kho hàng'   },
  { path: 'profile',   icon: null,                          label: 'Hồ sơ'      },
];

export default function BottomNav({ navVisible = true, onOpenSheet, notifCount = 0 }: BottomNavProps) {
  const { currentUser } = useApp();
  const navigate        = useNavigate();
  const location        = useLocation();

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
    return () => { vv.removeEventListener('resize', handler); cancelAnimationFrame(rafId); };
  }, []);

  if (!currentUser || keyboardOpen) return null;

  const tabs = currentUser.role === 'admin'   ? ADMIN_TABS
             : currentUser.role === 'manager' ? MANAGER_TABS
             : STAFF_TABS;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '';
  const activeSegment = location.pathname.split('/')[1] || 'dashboard';

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-20 pb-safe transition-transform duration-300 ease-out"
      style={{
        width: 'min(calc(100% - 24px), 480px)',
        transform: `translateX(-50%) translateY(${navVisible ? '0' : 'calc(100% + 2rem)'})`,
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))',
      }}
    >
      <Tabs
        selectedKey={activeSegment}
        onSelectionChange={(key) => {
          if (key === 'profile') { onOpenSheet?.(); }
          else { navigate('/' + key.toString()); }
        }}
        className="w-full"
      >
        <Tabs.ListContainer
          className="w-full rounded-full p-1.5 border shadow-lg"
          style={{
            WebkitBackdropFilter: 'blur(25px)',
            backdropFilter: 'blur(25px)',
            backgroundColor: 'color-mix(in oklch, var(--surface) 85%, transparent)',
            borderColor: 'color-mix(in oklch, var(--surface-foreground) 10%, transparent)',
            boxShadow: '0 8px 32px color-mix(in oklch, var(--foreground) 8%, transparent)',
          }}
        >
          <Tabs.List
            aria-label="Navigation"
            className="w-full flex justify-around items-center gap-0.5 !bg-transparent !p-0 !shadow-none"
          >
            {tabs.map(({ path, icon, label }) => {
              const isActive  = activeSegment === path;
              const isProfile = path === 'profile';
              return (
                <Tabs.Tab
                  key={path}
                  id={path}
                  aria-label={label}
                  className={`
                    group flex items-center justify-center h-auto min-w-0 rounded-full cursor-pointer
                    outline-none select-none transition-all duration-200 ease-out p-2.5
                    ${isActive
                      ? 'bg-accent shadow-sm'
                      : 'hover:bg-white hover:shadow-md active:scale-95'}
                  `}
                >
                  <span className={`shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-muted group-hover:text-accent'
                  }`}>
                    {isProfile ? (
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <div className={`w-5 h-5 rounded-full accent-gradient flex items-center justify-center text-white text-[9px] font-bold ${
                          isActive ? 'ring-2 ring-white/70' : ''
                        }`}>
                          {initials}
                        </div>
                        {notifCount > 0 && (
                          <span className="absolute -top-0.5 -right-1 w-3 h-3 bg-danger text-white text-[7px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                            {notifCount > 9 ? '9+' : notifCount}
                          </span>
                        )}
                      </motion.div>
                    ) : (
                      icon
                    )}
                  </span>
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </nav>
  );
}
