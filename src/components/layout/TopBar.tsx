import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopBarProps {
  onOpenSheet:  () => void;
  navVisible?:  boolean;
  notifCount?:  number;
}

export default function TopBar({ onOpenSheet, navVisible = true, notifCount = 0 }: TopBarProps) {
  const { currentUser } = useApp();
  const navigate        = useNavigate();

  if (!currentUser) return null;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header
      className="md:hidden sticky z-10 transition-[top] duration-300 ease-out bg-white/85 dark:bg-[#0a0a0f]/85 backdrop-blur-xl border-b border-[var(--glass-border)]"
      style={{ top: navVisible ? 0 : '-3.75rem' }}
    >
      <div className="flex justify-between items-center h-14 px-4 pt-safe">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 focus:outline-none active:opacity-70 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg icon-primary-gradient flex items-center justify-center">
            <UtensilsCrossed size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[var(--text-primary)] select-none">
            FestManager
          </span>
        </button>

        <div className="flex items-center gap-2">
          {notifCount > 0 && (
            <button
              onClick={onOpenSheet}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--glass-bg)] transition-colors focus:outline-none"
              aria-label={`${notifCount} thông báo`}
            >
              <Bell size={18} className="text-[var(--text-muted)]" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            </button>
          )}
          <button
            onClick={onOpenSheet}
            className="relative w-9 h-9 rounded-full icon-primary-gradient flex items-center justify-center focus:outline-none active:scale-95 transition-transform shadow-sm"
            aria-label="Tài khoản"
          >
            <span className="text-[13px] font-bold text-white">{initials}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
