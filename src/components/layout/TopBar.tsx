import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Bell } from 'lucide-react';
import { Avatar, Badge, Button } from '@heroui/react';
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
      className="md:hidden fixed top-0 left-0 right-0 z-20 border-b border-separator transition-transform duration-300 ease-out"
      style={{
        transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
        WebkitBackdropFilter: 'blur(25px)',
        backdropFilter: 'blur(25px)',
        backgroundColor: 'color-mix(in oklch, var(--surface) 85%, transparent)',
      }}
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

        <div className="flex items-center gap-1.5">
          {notifCount > 0 ? (
            <Badge color="danger" size="sm" placement="top-right">
              <Badge.Anchor>
                <Button
                  variant="ghost"
                  isIconOnly
                  size="sm"
                  onPress={onOpenSheet}
                  aria-label={`${notifCount} thông báo`}
                  className="rounded-full w-9 h-9"
                >
                  <Bell size={18} className="text-muted" />
                </Button>
              </Badge.Anchor>
              <Badge.Label>{notifCount > 9 ? '9+' : notifCount}</Badge.Label>
            </Badge>
          ) : (
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              onPress={onOpenSheet}
              aria-label="Thông báo"
              className="rounded-full w-9 h-9"
            >
              <Bell size={18} className="text-muted" />
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
