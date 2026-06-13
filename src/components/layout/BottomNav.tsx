import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from '@heroui/react';
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

interface BottomNavProps {
  navVisible?: boolean;
  onOpenSheet?: () => void;
  notifCount?: number;
}

const ADMIN_TABS = [
  { path: 'dashboard', icon: (c: boolean) => <LayoutDashboard size={c ? 18 : 20} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: (c: boolean) => <Calendar        size={c ? 18 : 20} />, label: 'Lịch trình' },
  { path: 'inventory', icon: (c: boolean) => <Package         size={c ? 18 : 20} />, label: 'Kho hàng'   },
  { path: 'finance',   icon: (c: boolean) => <DollarSign      size={c ? 18 : 20} />, label: 'Tài chính'  },
  { path: 'hr',        icon: (c: boolean) => <Users           size={c ? 18 : 20} />, label: 'Nhân sự'    },
  { path: 'clients',   icon: (c: boolean) => <Building2       size={c ? 18 : 20} />, label: 'Khách hàng' },
  { path: 'profile',   icon: (c: boolean) => <User            size={c ? 18 : 20} />, label: 'Hồ sơ'      },
];

const MANAGER_TABS = [
  { path: 'dashboard', icon: (c: boolean) => <LayoutDashboard size={c ? 18 : 20} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: (c: boolean) => <Calendar        size={c ? 18 : 20} />, label: 'Lịch trình' },
  { path: 'inventory', icon: (c: boolean) => <Package         size={c ? 18 : 20} />, label: 'Kho hàng'   },
  { path: 'hr',        icon: (c: boolean) => <Users           size={c ? 18 : 20} />, label: 'Nhân sự'    },
  { path: 'profile',   icon: (c: boolean) => <User            size={c ? 18 : 20} />, label: 'Hồ sơ'      },
];

const STAFF_TABS = [
  { path: 'dashboard', icon: (c: boolean) => <LayoutDashboard size={c ? 18 : 20} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: (c: boolean) => <Calendar        size={c ? 18 : 20} />, label: 'Lịch trình' },
  { path: 'inventory', icon: (c: boolean) => <Package         size={c ? 18 : 20} />, label: 'Kho hàng'   },
  { path: 'profile',   icon: (c: boolean) => <User            size={c ? 18 : 20} />, label: 'Hồ sơ'      },
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
    return () => {
      vv.removeEventListener('resize', handler);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!currentUser || keyboardOpen) return null;

  const tabs    = currentUser.role === 'admin'   ? ADMIN_TABS
               : currentUser.role === 'manager' ? MANAGER_TABS
               : STAFF_TABS;
  const compact = tabs.length >= 6;

  const initials = currentUser?.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '';

  const activeSegment = location.pathname.split('/')[1] || 'dashboard';

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-20 pb-safe transition-transform duration-300 ease-out"
      style={{
        width: 'min(calc(100% - 24px), 480px)',
        transform: `translateX(-50%) translateY(${navVisible ? '0' : 'calc(100% + 2rem)'})`,
      }}
    >
      <Tabs
        selectedKey={activeSegment}
        onSelectionChange={(key) => {
          if (key === 'profile') {
            onOpenSheet?.();
          } else {
            navigate('/' + key.toString());
          }
        }}
        className="w-full"
      >
        <Tabs.ListContainer
          className="w-full bg-surface/75 border border-separator/60 rounded-[28px] shadow-lg dark:shadow-black/40 p-1.5 backdrop-blur-lg"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <Tabs.List aria-label="Navigation" className="w-full flex justify-around items-center gap-1 !bg-transparent !p-0 !shadow-none">
            {tabs.map(({ path, icon, label }) => {
              const isActive = activeSegment === path;
              const isProfile = path === 'profile';
              return (
                <Tabs.Tab
                  key={path}
                  id={path}
                  className="flex-1 flex flex-col items-center justify-center py-2 h-auto min-w-0 rounded-[20px] cursor-pointer transition-all duration-200 relative group select-none outline-none data-[selected=false]:hover:bg-default/40 data-[selected=false]:active:bg-default/60"
                >
                  <div className="flex flex-col items-center gap-0.5 z-10 relative">
                    <span className={`block transition-colors duration-150 ${
                      isActive ? 'text-white' : 'text-muted group-hover:text-foreground/90'
                    }`}>
                      {isProfile ? (
                        <div className="relative">
                          <div className={`rounded-full accent-gradient flex items-center justify-center text-white font-bold transition-transform group-active:scale-95 shadow-sm ${
                            compact ? 'w-5.5 h-5.5 text-[9px]' : 'w-6 h-6 text-[10px]'
                          }`}>
                            {initials}
                          </div>
                          {notifCount > 0 && (
                            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-surface">
                              {notifCount > 9 ? '9+' : notifCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        icon(compact)
                      )}
                    </span>
                    <span className={`leading-none font-semibold transition-colors duration-150 ${
                      compact ? 'text-[9px]' : 'text-[10px]'
                    } ${isActive ? 'text-white' : 'text-muted group-hover:text-foreground/90'}`}>
                      {label}
                    </span>
                  </div>
                  <Tabs.Indicator className="bg-accent rounded-[20px]" />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </nav>
  );
}
