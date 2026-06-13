import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

interface BottomNavProps {
  navVisible?:   boolean;
  onOpenSheet?:  () => void;
  notifCount?:   number;
}

const ADMIN_TABS = [
  { path: 'dashboard', icon: (c: boolean) => <LayoutDashboard size={c ? 18 : 20} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: (c: boolean) => <Calendar        size={c ? 18 : 20} />, label: 'Lịch trình' },
  { path: 'inventory', icon: (c: boolean) => <Package         size={c ? 18 : 20} />, label: 'Kho hàng'   },
  { path: 'finance',   icon: (c: boolean) => <DollarSign      size={c ? 18 : 20} />, label: 'Tài chính'  },
  { path: 'hr',        icon: (c: boolean) => <Users           size={c ? 18 : 20} />, label: 'Nhân sự'    },
  { path: 'clients',   icon: (c: boolean) => <Building2       size={c ? 18 : 20} />, label: 'Khách hàng' },
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
  const compact = tabs.length >= 5;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const activeSegment = location.pathname.split('/')[1] || 'dashboard';

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-20 pb-safe transition-transform duration-300 ease-out"
      style={{
        width: 'min(calc(100% - 24px), 480px)',
        transform: `translateX(-50%) translateY(${navVisible ? '0' : 'calc(100% + 2rem)'})`,
      }}
    >
      {/* Nav pill — uses HeroUI surface token + custom backdrop blur */}
      <div
        className="bg-surface/90 border border-separator flex justify-around items-center px-1.5 py-1.5 rounded-[28px] shadow-lg dark:shadow-black/40"
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        {tabs.map(({ path, icon, label }) => {
          const isActive = activeSegment === path;
          return (
            <Button
              key={path}
              variant="ghost"
              onPress={() => navigate('/' + path)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="flex flex-col items-center gap-0.5 px-1 py-1 min-w-0 flex-1 h-auto rounded-none bg-transparent hover:bg-transparent"
            >
              <div className={`flex items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'accent-gradient shadow-sm'
                  : 'hover:bg-default/50'
              }`}>
                <span className={`block transition-colors duration-150 ${
                  isActive ? 'text-white' : 'text-muted'
                }`}>
                  {icon(compact)}
                </span>
              </div>
              <span className={`leading-none font-semibold transition-colors duration-150 ${
                compact ? 'text-[9px]' : 'text-[10px]'
              } ${isActive ? 'text-accent' : 'text-muted'}`}>
                {label}
              </span>
            </Button>
          );
        })}

        {/* Separator + Avatar */}
        <div className="w-px h-8 bg-separator self-center mx-0.5 shrink-0" />
        <Button
          variant="ghost"
          isIconOnly
          onPress={onOpenSheet}
          aria-label="Tài khoản"
          className="relative flex-shrink-0 w-9 h-9 min-w-0 rounded-full accent-gradient shadow-sm hover:opacity-90 active:scale-95 transition-all mx-1"
        >
          <span className="text-[12px] font-bold text-white">{initials}</span>
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-danger-foreground text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[var(--surface)]">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Button>
      </div>
    </nav>
  );
}
