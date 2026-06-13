import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Bell, BellPlus, Smartphone, X, Check, Info } from 'lucide-react';
import { Button, Switch } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
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
  const [showNotifs, setShowNotifs] = useState(false);
  const [installMsg, setInstallMsg] = useState<string | null>(null);

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
      <div className="flex items-center gap-4 py-4 border-b border-separator">
        <div className="w-12 h-12 rounded-full accent-gradient flex items-center justify-center shadow-lg shrink-0">
          <span className="text-lg font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{currentUser.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${roleBadgeStyle[currentUser.role]}`}>
              {roleLabel[currentUser.role]}
            </span>
            <button
              onClick={() => { onClose(); navigate('/profile'); }}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              Xem hồ sơ →
            </button>
          </div>
        </div>
        <Button onPress={onClose} variant="ghost" isIconOnly size="sm" className="rounded-full text-muted shrink-0">
          <X size={16} />
        </Button>
      </div>

      {/* Actions */}
      <div className="py-2 space-y-0.5">
        <Switch
          isSelected={theme === 'dark'}
          onChange={() => toggleTheme()}
          className="w-full flex flex-row justify-between px-3 py-2.5 rounded-xl hover:bg-accent/5 gap-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              {theme === 'dark' ? <Sun size={15} className="text-accent" /> : <Moon size={15} className="text-accent" />}
            </div>
            <span className="text-sm font-medium text-foreground">
              {theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            </span>
          </div>
          <Switch.Control><Switch.Thumb /></Switch.Control>
        </Switch>

        {(isAdmin || isManager) && (
          <div>
            <Button
              variant="ghost"
              onPress={() => setShowNotifs(v => !v)}
              className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 relative">
                <Bell size={15} className="text-accent" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-danger-foreground text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </div>
              <span className="flex-1 text-sm font-medium text-foreground text-left">Thông báo</span>
              <span className="text-xs text-muted">{showNotifs ? '▲' : '▼'}</span>
            </Button>
            {showNotifs && (
              <div className="mx-1 mb-1 rounded-xl overflow-hidden bg-default/30 border border-separator">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted text-center py-3">Không có thông báo mới</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-separator">
                      <p className="text-xs font-semibold text-foreground/80">{notifications.length} thông báo</p>
                      <Button variant="ghost" onPress={clearAll} className="h-auto min-w-0 p-0 text-xs text-danger">Xóa tất cả</Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto divide-y divide-separator">
                      {notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-2 px-3 py-2">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === 'expense' ? 'bg-indigo-400' : 'bg-accent'}`} />
                          <p className="flex-1 text-xs text-foreground leading-snug">{n.message}</p>
                          <Button isIconOnly variant="ghost" onPress={() => clearOne(n.id)} aria-label="Xóa" className="h-auto min-w-0 p-0 text-muted hover:text-danger">
                            <X size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {!isAdmin && !isManager && (
          <Button
            variant="ghost"
            onPress={subscribed ? undefined : subscribe}
            isDisabled={pushLoading}
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
            variant="ghost"
            onPress={handleInstall}
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
              <Button isIconOnly variant="ghost" onPress={() => setInstallMsg(null)} aria-label="Đóng" className="ml-auto h-auto min-w-0 p-0 text-muted"><X size={11} /></Button>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-separator pt-2">
        <Button
          variant="ghost"
          onPress={onLogout}
          className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-danger/8 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
            <LogOut size={15} className="text-danger" />
          </div>
          <span className="text-sm font-semibold text-danger">Đăng xuất</span>
        </Button>
      </div>
    </div>
  );
}
