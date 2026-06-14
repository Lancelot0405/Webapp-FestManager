import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon } from 'lucide-react';
import { Avatar, Button, Spinner } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface TopBarProps {
  onOpenSheet:  () => void;
  navVisible?:  boolean;
  notifCount?:  number;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function TopBar({ onOpenSheet, navVisible = true, notifCount = 0 }: TopBarProps) {
  const { currentUser } = useApp();
  const navigate        = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { subscribed, loading: pushLoading, subscribe, supported: pushSupported } = usePushNotifications();

  if (!currentUser) return null;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-20 transition-transform duration-300 ease-out"
      style={{ transform: navVisible ? 'translateY(0)' : 'translateY(-100%)' }}
    >
      <div className="flex justify-between items-center h-14 px-4 pt-safe">
        <Button
          variant="ghost"
          onPress={() => navigate('/dashboard')}
          className="h-auto min-w-0 px-0 rounded-none hover:bg-transparent active:opacity-70"
          aria-label="Trang chủ"
        >
          <span className="text-lg font-bold tracking-tight text-foreground truncate">
            {greeting()}, {currentUser.name}
          </span>
        </Button>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" isIconOnly size="sm"
            onPress={toggleTheme}
            className="rounded-full text-muted hover:bg-default/50"
            aria-label={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {pushSupported && (
            <Button
              variant="ghost" isIconOnly size="sm"
              onPress={subscribe}
              isDisabled={pushLoading || subscribed}
              className="relative rounded-full text-muted hover:bg-default/50"
              aria-label={subscribed ? 'Đã bật thông báo' : 'Bật thông báo'}
            >
              {pushLoading
                ? <Spinner size="sm" color="current" />
                : <Bell size={16} className={subscribed ? 'text-accent' : ''} />
              }
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-background" />
              )}
            </Button>
          )}

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button
              variant="ghost"
              isIconOnly
              onPress={onOpenSheet}
              aria-label="Tài khoản"
              className="w-9 h-9 min-w-0 p-0 rounded-full hover:bg-transparent"
            >
              <Avatar className="size-8 shadow-sm">
                <Avatar.Fallback className="accent-gradient text-white text-[13px] font-bold">
                  {initials}
                </Avatar.Fallback>
              </Avatar>
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
