import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface TopBarProps {
  onOpenSheet:      () => void;
  navVisible?:      boolean;
  notifCount?:      number;
}

export default function TopBar({ onOpenSheet, navVisible = true, notifCount = 0 }: TopBarProps) {
  const { state }       = useApp();
  const { currentUser } = state;
  const navigate = useNavigate();

  if (!currentUser) return null;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <header
      className="md:hidden px-4 pt-safe sticky z-10 transition-[top] duration-300 ease-out"
      style={{ top: navVisible ? 0 : '-3.75rem' }}
    >
      <div className="flex justify-between items-center h-14">
        {/* Logo */}
        <Button
          variant="ghost"
          onPress={handleLogoClick}
          className="h-auto min-w-0 p-0 bg-transparent flex items-center gap-2 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-[var(--shadow-float)]">
            <UtensilsCrossed size={15} className="text-[var(--background)]" />
          </div>
          <span className="text-lg font-black tracking-tight text-[var(--text-primary)] select-none">
            FestManager
          </span>
        </Button>

        {/* Avatar button */}
        <Button
          isIconOnly
          variant="ghost"
          onPress={onOpenSheet}
          className="relative h-auto w-9 h-9 min-w-0 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm focus:outline-none active:scale-95 transition-transform"
          aria-label="Tài khoản"
        >
          <span className="text-[13px] font-bold text-[var(--background)]">{initials}</span>
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--background)]">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
