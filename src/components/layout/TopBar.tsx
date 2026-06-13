import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Bell } from 'lucide-react';
import { Button } from '@heroui/react';
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
      className="md:hidden sticky z-10 transition-[top] duration-300 ease-out bg-surface/85 backdrop-blur-xl border-b border-separator"
      style={{ top: navVisible ? 0 : '-3.75rem' }}
    >
      <div className="flex justify-between items-center h-14 px-4 pt-safe">
        <Button
          variant="ghost"
          onPress={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 h-auto min-w-0 px-0 rounded-none hover:bg-transparent active:opacity-70"
          aria-label="Trang chủ"
        >
          <div className="w-7 h-7 rounded-lg accent-gradient flex items-center justify-center">
            <UtensilsCrossed size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground select-none">
            FestManager
          </span>
        </Button>

        <div className="flex items-center gap-2">
          {notifCount > 0 && (
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              onPress={onOpenSheet}
              aria-label={`${notifCount} thông báo`}
              className="relative rounded-full w-9 h-9"
            >
              <Bell size={18} className="text-muted" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-danger-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            isIconOnly
            onPress={onOpenSheet}
            aria-label="Tài khoản"
            className="relative w-9 h-9 min-w-0 rounded-full accent-gradient shadow-sm hover:bg-transparent"
          >
            <span className="text-[13px] font-bold text-white">{initials}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
