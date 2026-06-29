import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Bell, BellPlus, Smartphone, X, Check, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import AccentPicker from './AccentPicker';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface Notification { id: string; message: string; timestamp: string; type: string }

interface Props {
  onClose: () => void;
  onLogout: () => void;
  notifications: Notification[];
  clearAll: () => void;
  clearOne: (id: string) => void;
}

const roleBadgeStyle: Record<string, string> = {
  admin:   'bg-accent/10 text-accent',
  manager: 'bg-indigo-500/10 text-indigo-400',
  staff:   'bg-success/10 text-success',
};
const roleLabel: Record<string, string> = {
  admin: 'Admin', manager: 'Quản lý', staff: 'Nhân viên',
};

export default function UserSheetContent({ onClose, onLogout, notifications, clearAll, clearOne }: Props) {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const { subscribed, loading: pushLoading, subscribe } = usePushNotifications();
  const { isIos, isStandalone, triggerInstall } = useInstallPrompt();
  const [installMsg, setInstallMsg] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!currentUser) return null;

  const initials = currentUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleInstall = async () => {
    const result = await triggerInstall();
    if (result === 'already') {
      setInstallMsg('FestManager đã được cài trên thiết bị này.');
    } else if (result === 'guide') {
      if (isIos) {
        setInstallMsg('Safari: bấm nút Chia sẻ ↑ → "Thêm vào màn hình chính"');
      } else {
        setInstallMsg('Dùng menu trình duyệt → "Cài đặt ứng dụng"');
      }
    }
  };

  return (
    <div className="px-5 py-4">
      {/* User info */}
      <div className="flex items-center gap-4 py-4 border-b border-border">
        <Avatar className="size-12 shadow-lg shrink-0">
          <AvatarFallback className="accent-gradient text-white text-lg font-bold flex items-center justify-center">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{currentUser.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border-none hover:bg-transparent ${roleBadgeStyle[currentUser.role]}`}>
              {roleLabel[currentUser.role]}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { onClose(); navigate('/profile'); }}
              className="h-auto min-w-0 p-0 text-xs font-semibold text-accent hover:underline hover:bg-transparent"
            >
              Xem hồ sơ →
            </Button>
          </div>
        </div>
        <Button
          type="button"
          onClick={onClose}
          variant="ghost"
          className="rounded-full text-muted shrink-0 h-8 w-8 p-0"
          aria-label="Đóng"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Actions */}
      <div className="py-2 space-y-0.5">
        <div className="w-full flex flex-row items-center justify-between px-3 py-2.5 rounded-xl hover:bg-accent/5 gap-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              {theme === 'dark' ? <Sun size={15} className="text-accent" /> : <Moon size={15} className="text-accent" />}
            </div>
            <span className="text-sm font-medium text-foreground">
              {theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            </span>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            id="theme-switch"
          />
        </div>

        <AccentPicker />

        {(isAdmin || isManager) && (
          <Collapsible open={notifOpen} onOpenChange={setNotifOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/5 transition-colors outline-none"
              >
                {notifications.length > 0 ? (
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Bell size={15} className="text-accent" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-destructive rounded-full border border-background">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Bell size={15} className="text-accent" />
                  </div>
                )}
                <span className="flex-1 text-sm font-medium text-foreground text-left">Thông báo</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${notifOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mx-1 mt-1 mb-1 rounded-xl overflow-hidden bg-default/30 border border-border">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted text-center py-3">Không có thông báo mới</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground/80">{notifications.length} thông báo</p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={clearAll}
                        className="h-auto min-w-0 p-0 text-xs text-destructive hover:bg-transparent"
                      >
                        Xóa tất cả
                      </Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto divide-y divide-border">
                      {notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-2 px-3 py-2">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === 'expense' ? 'bg-indigo-400' : 'bg-accent'}`} />
                          <p className="flex-1 text-xs text-foreground leading-snug">{n.message}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => clearOne(n.id)}
                            aria-label="Xóa"
                            className="h-auto min-w-0 p-0 text-muted hover:text-destructive hover:bg-transparent"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {!isAdmin && !isManager && (
          <Button
            type="button"
            variant="ghost"
            onClick={subscribed ? undefined : subscribe}
            disabled={pushLoading}
            className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              {subscribed ? <Bell size={15} className="text-success" /> : <BellPlus size={15} className="text-accent" />}
            </div>
            <span className="flex-1 text-sm font-medium text-foreground text-left">
              {subscribed ? 'Thông báo đã bật' : 'Bật thông báo đẩy'}
            </span>
            {subscribed && <Check size={14} className="text-success" />}
          </Button>
        )}

        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleInstall}
            className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Smartphone size={15} className="text-accent" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground text-left">
              {isStandalone ? 'Đã cài đặt ứng dụng' : 'Cài đặt ứng dụng'}
            </span>
            {isStandalone && <Check size={14} className="text-success" />}
          </Button>
          {installMsg && (
            <div className="mx-1 mb-1 flex items-start gap-2 px-3 py-2 rounded-xl bg-accent/8">
              <Info size={12} className="text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/80 leading-snug">{installMsg}</p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInstallMsg(null)}
                aria-label="Đóng"
                className="ml-auto h-auto min-w-0 p-0 text-muted hover:bg-transparent"
              >
                <X size={11} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-border pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onLogout}
          className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <LogOut size={15} className="text-destructive" />
          </div>
          <span className="text-sm font-semibold text-destructive">Đăng xuất</span>
        </Button>
      </div>
    </div>
  );
}
