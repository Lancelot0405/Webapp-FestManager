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
}

const ADMIN_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={19} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={19} />, label: 'Kho hàng'   },
  { path: 'finance',   icon: <DollarSign      size={19} />, label: 'Tài chính'  },
  { path: 'hr',        icon: <Users           size={19} />, label: 'Nhân sự'    },
  { path: 'clients',   icon: <Building2       size={19} />, label: 'Khách hàng' },
];

const MANAGER_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={19} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={19} />, label: 'Kho hàng'   },
  { path: 'hr',        icon: <Users           size={19} />, label: 'Nhân sự'    },
];

const STAFF_TABS = [
  { path: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Tổng quan'  },
  { path: 'schedule',  icon: <Calendar        size={19} />, label: 'Lịch trình' },
  { path: 'inventory', icon: <Package         size={19} />, label: 'Kho hàng'   },
];

export default function BottomNav({ navVisible = true }: BottomNavProps) {
  const { currentUser } = useApp();
  const navigate        = useNavigate();
  const location        = useLocation();

  const [hovered, setHovered] = useState<string | null>(null);
  const trackHover = (e: React.PointerEvent<HTMLElement>) => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const tab = el?.closest('[data-navtab]') as HTMLElement | null;
    setHovered(tab?.dataset.navtab ?? null);
  };
  const clearHover = () => setHovered(null);

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

  const activeSegment = location.pathname.split('/')[1] || 'dashboard';

  return (
    <div
      className="fixed bottom-3 left-1/2 z-20 pb-safe"
      style={{ width: 'min(calc(100% - 24px), 480px)', transform: 'translateX(-50%)' }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: navVisible ? 0 : 'calc(100% + 2rem)', opacity: navVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}
      >
        <Tabs
          selectedKey={activeSegment}
          onSelectionChange={(key) => navigate('/' + key.toString())}
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
            onPointerMove={trackHover}
            onPointerLeave={clearHover}
            onPointerCancel={clearHover}
          >
            <Tabs.List
              aria-label="Navigation"
              className="relative w-full flex justify-around items-center gap-0.5 !bg-transparent !p-0 !shadow-none"
            >
              {tabs.map(({ path, icon, label }) => {
                const isActive = activeSegment === path;
                return (
                  <Tabs.Tab
                    key={path}
                    id={path}
                    aria-label={label}
                    data-navtab={path}
                    className={`
                      group relative flex items-center justify-center h-auto min-w-0 rounded-full cursor-pointer
                      outline-none select-none p-2.5 transition-transform active:scale-90
                      ${isActive ? 'bg-accent shadow-sm' : ''}
                    `}
                  >
                    {!isActive && hovered === path && (
                      <motion.span
                        layoutId="navHoverPill"
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-foreground/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-10 shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-white' : hovered === path ? 'text-accent' : 'text-muted'
                    }`}>
                      <motion.span
                        animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        {icon}
                      </motion.span>
                    </span>
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </motion.div>
    </div>
  );
}
