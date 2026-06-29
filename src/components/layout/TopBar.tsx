import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import UserOverlay from './UserOverlay';

interface Notification { id: string; message: string; timestamp: string; type: string }

interface TopBarProps {
  navVisible?:   boolean;
  notifCount?:   number;
  notifications: Notification[];
  clearAll:      () => void;
  clearOne:      (id: string) => void;
  onLogout:      () => void;
}

export default function TopBar({ navVisible = true, notifCount = 0, notifications, clearAll, clearOne, onLogout }: TopBarProps) {
  const { currentUser } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { subscribed, loading: pushLoading, subscribe, supported: pushSupported } = usePushNotifications();
  const [overlayOpen, setOverlayOpen] = useState(false);

  if (!currentUser) return null;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header
      className="md:hidden fixed top-0 right-0 z-20 transition-transform duration-300 ease-out"
      style={{ transform: navVisible ? 'translateY(0)' : 'translateY(-100%)' }}
    >
      <div className="flex justify-end items-center gap-1 min-h-11 px-3 pt-safe">
        <Button
          type="button"
          variant="ghost"
          onClick={toggleTheme}
          className="rounded-full text-muted hover:bg-default/50 h-8 w-8 p-0"
          aria-label={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {pushSupported && (
          <Button
            type="button"
            variant="ghost"
            onClick={subscribe}
            disabled={pushLoading || subscribed}
            className="relative rounded-full text-muted hover:bg-default/50 h-8 w-8 p-0"
            aria-label={subscribed ? 'Đã bật thông báo' : 'Bật thông báo'}
          >
            {pushLoading
              ? <Loader2 className="size-4 animate-spin" />
              : <Bell size={16} className={subscribed ? 'text-accent' : ''} />
            }
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border border-background" />
            )}
          </Button>
        )}

        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOverlayOpen(true)}
            aria-label="Tài khoản"
            className="w-9 h-9 min-w-0 p-0 rounded-full hover:bg-transparent flex items-center justify-center"
          >
            {notifCount > 0 ? (
              <div className="relative">
                <Avatar className="size-8 shadow-sm">
                  <AvatarFallback className="accent-gradient text-white text-[13px] font-bold flex items-center justify-center">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-destructive rounded-full border border-background">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              </div>
            ) : (
              <Avatar className="size-8 shadow-sm">
                <AvatarFallback className="accent-gradient text-white text-[13px] font-bold flex items-center justify-center">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
          </Button>
        </motion.div>
      </div>

      <UserOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onLogout={onLogout}
        notifications={notifications}
        clearAll={clearAll}
        clearOne={clearOne}
      />
    </header>
  );
}
