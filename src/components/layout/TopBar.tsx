import { UtensilsCrossed } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

interface TopBarProps {
  onLogoClick:   () => void;
  onOpenSheet:   () => void;
  navVisible?:   boolean;
}

export default function TopBar({ onLogoClick, onOpenSheet, navVisible = true }: TopBarProps) {
  const { state }       = useApp();
  const { currentUser } = state;
  const isAdmin         = currentUser?.role === 'admin';
  const isManager       = currentUser?.role === 'manager';
  const { notifications } = useRealtimeNotifications(isAdmin || isManager);

  if (!currentUser) return null;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header
      className="md:hidden px-4 pt-safe sticky z-10 transition-[top] duration-300 ease-out"
      style={{ top: navVisible ? 0 : '-3.75rem' }}
    >
      <div className="flex justify-between items-center h-14">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-[var(--shadow-float)]">
            <UtensilsCrossed size={15} className="text-[var(--background)]" />
          </div>
          <span className="text-lg font-black tracking-tight text-[var(--text-primary)] select-none">
            FestManager
          </span>
        </button>

        {/* Avatar button */}
        <button
          onClick={onOpenSheet}
          className="relative w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm focus:outline-none active:scale-95 transition-transform"
          aria-label="Tài khoản"
        >
          <span className="text-[13px] font-bold text-[var(--background)]">{initials}</span>
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--background)]">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
