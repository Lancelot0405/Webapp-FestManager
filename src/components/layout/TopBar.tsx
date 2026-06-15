import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon } from 'lucide-react';
import { Avatar, Badge, Button, Popover, Spinner } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import UserSheetContent from './UserSheetContent';

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
  const [popoverOpen, setPopoverOpen] = useState(false);

  if (!currentUser) return null;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header
      className="md:hidden fixed top-0 right-0 z-20 transition-transform duration-300 ease-out"
      style={{ transform: navVisible ? 'translateY(0)' : 'translateY(-100%)' }}
    >
      <div className="flex justify-end items-center gap-1 h-11 px-3 pt-safe">
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

        <Popover isOpen={popoverOpen} onOpenChange={setPopoverOpen}>
          <Popover.Trigger>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost" isIconOnly
                aria-label="Tài khoản"
                className="w-9 h-9 min-w-0 p-0 rounded-full hover:bg-transparent"
              >
                {notifCount > 0 ? (
                  <Badge color="danger" size="sm" placement="top-right">
                    <Badge.Anchor>
                      <Avatar className="size-8 shadow-sm">
                        <Avatar.Fallback className="accent-gradient text-white text-[13px] font-bold">
                          {initials}
                        </Avatar.Fallback>
                      </Avatar>
                    </Badge.Anchor>
                    <Badge.Label>{notifCount > 9 ? '9+' : notifCount}</Badge.Label>
                  </Badge>
                ) : (
                  <Avatar className="size-8 shadow-sm">
                    <Avatar.Fallback className="accent-gradient text-white text-[13px] font-bold">
                      {initials}
                    </Avatar.Fallback>
                  </Avatar>
                )}
              </Button>
            </motion.div>
          </Popover.Trigger>
          <Popover.Content placement="bottom end" className="p-0 w-80 max-h-[calc(100dvh-80px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-separator/60 shadow-xl bg-surface/70 backdrop-blur-2xl">
            <Popover.Dialog aria-label="Tài khoản">
              <UserSheetContent
                onClose={() => setPopoverOpen(false)}
                onLogout={() => { setPopoverOpen(false); onLogout(); }}
                notifications={notifications}
                clearAll={clearAll}
                clearOne={clearOne}
              />
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    </header>
  );
}
