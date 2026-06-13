import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

export default function BottomNav({ navVisible = true }: BottomNavProps) {
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

  const activeSegment = location.pathname.split('/')[1] || 'dashboard';

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-20 pb-safe transition-transform duration-300 ease-out"
      style={{
        width: 'min(calc(100% - 24px), 480px)',
        transform: `translateX(-50%) translateY(${navVisible ? '0' : 'calc(100% + 2rem)'})`,
      }}
    >
      <div
        className="bottom-nav-pill flex justify-around items-center px-1.5 py-1.5 rounded-[28px]"
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        {tabs.map(({ path, icon, label }) => {
          const isActive = activeSegment === path;
          return (
            <button
              key={path}
              onClick={() => navigate('/' + path)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="flex flex-col items-center gap-0.5 px-1 py-1 min-w-0 flex-1 focus:outline-none"
            >
              <div className={`flex items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--primary)] shadow-sm shadow-[var(--primary)]/30'
                  : 'hover:bg-[var(--glass-bg)]'
              }`}>
                <span className={`block transition-colors duration-150 ${
                  isActive ? 'text-white' : 'text-[var(--text-muted)]'
                }`}>
                  {icon(compact)}
                </span>
              </div>
              <span className={`leading-none font-semibold transition-colors duration-150 ${
                compact ? 'text-[9px]' : 'text-[10px]'
              } ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
