import { useState } from 'react';
import { LogOut, Sun, Moon, Bell, BellPlus, Smartphone, X, Check, Info } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface Notification { id: string; message: string; timestamp: string; type: string }

interface UserSheetProps {
  onClose:      () => void;
  onLogout:     () => void;
  notifications: Notification[];
  clearAll:     () => void;
  clearOne:     (id: string) => void;
}

const roleBadgeStyle: Record<string, string> = {
  admin:   'bg-[var(--primary)]/10 text-[var(--primary)]',
  manager: 'bg-indigo-500/10 text-indigo-400',
  staff:   'bg-[var(--success)]/10 text-[var(--success)]',
};
const roleLabel: Record<string, string> = {
  admin: 'Admin', manager: 'Quản lý', staff: 'Nhân viên',
};

export default function UserSheet({ onClose, onLogout, notifications, clearAll, clearOne }: UserSheetProps) {
  const { state }       = useApp();
  const { currentUser } = state;
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet (mobile) / Popover cạnh Sidebar (md+) */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up md:inset-x-auto md:bottom-3 md:left-3 md:w-72">
        <div
          className="mx-auto max-w-md rounded-t-[2rem] overflow-hidden md:mx-0 md:max-w-none md:rounded-2xl md:shadow-[var(--shadow-warm)]"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {/* Drag handle — chỉ mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full bg-[var(--text-muted)]/30" />
          </div>

          <div className="px-5 pb-[calc(env(safe-area-inset-bottom,16px)+80px)] md:pb-4 md:pt-4">
            {/* User info */}
            <div className="flex items-center gap-4 py-5 border-b border-[var(--glass-border)]">
              <div className="w-14 h-14 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-[var(--shadow-float)] shrink-0">
                <span className="text-xl font-bold text-[var(--background)]">{initials}</span>
              </div>
              <div>
                <p className="font-bold text-base text-[var(--text-primary)]">{currentUser.name}</p>
                <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${roleBadgeStyle[currentUser.role]}`}>
                  {roleLabel[currentUser.role]}
                </span>
              </div>
              <Button
                onPress={onClose}
                variant="ghost"
                isIconOnly
                size="sm"
                className="ml-auto rounded-full text-[var(--text-muted)]"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Actions */}
            <div className="py-3 space-y-1">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-[var(--primary)]/5 active:bg-[var(--primary)]/10 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                  {theme === 'dark' ? <Sun size={17} className="text-[var(--primary)]" /> : <Moon size={17} className="text-[var(--primary)]" />}
                </div>
                <span className="flex-1 text-sm font-medium text-[var(--text-primary)] text-left">
                  {theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
                </span>
                <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${theme === 'dark' ? 'bg-[var(--primary)]' : 'bg-[var(--text-muted)]/25'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Notifications — admin/manager */}
              {(isAdmin || isManager) && (
                <div>
                  <button
                    onClick={() => setShowNotifs(v => !v)}
                    className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-[var(--primary)]/5 active:bg-[var(--primary)]/10 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 relative">
                      <Bell size={17} className="text-[var(--primary)]" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[var(--background)]">
                          {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-sm font-medium text-[var(--text-primary)] text-left">Thông báo</span>
                    <span className="text-xs text-[var(--text-muted)]">{showNotifs ? '▲' : '▼'}</span>
                  </button>
                  {showNotifs && (
                    <div className="mx-3 mb-2 glass-card overflow-hidden">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-3">Không có thông báo mới</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--glass-border)]">
                            <p className="text-xs font-semibold text-[var(--text-secondary)]">{notifications.length} thông báo</p>
                            <button onClick={clearAll} className="text-xs text-[var(--danger)]">Xóa tất cả</button>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-[var(--glass-border)]">
                            {notifications.map(n => (
                              <div key={n.id} className="flex items-start gap-2 px-3 py-2.5">
                                <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === 'expense' ? 'bg-indigo-400' : 'bg-[var(--primary)]'}`} />
                                <p className="flex-1 text-xs text-[var(--text-primary)] leading-snug">{n.message}</p>
                                <button onClick={() => clearOne(n.id)} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Push subscribe — staff */}
              {!isAdmin && !isManager && (
                <button
                  onClick={subscribed ? undefined : subscribe}
                  disabled={pushLoading}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-[var(--primary)]/5 active:bg-[var(--primary)]/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                    {subscribed
                      ? <Bell size={17} className="text-[var(--success)]" />
                      : <BellPlus size={17} className="text-[var(--primary)]" />
                    }
                  </div>
                  <span className="flex-1 text-sm font-medium text-[var(--text-primary)] text-left">
                    {subscribed ? 'Thông báo đã bật' : 'Bật thông báo đẩy'}
                  </span>
                  {subscribed && <Check size={15} className="text-[var(--success)]" />}
                </button>
              )}

              {/* Install PWA */}
              <div>
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-[var(--primary)]/5 active:bg-[var(--primary)]/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                    <Smartphone size={17} className="text-[var(--primary)]" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-[var(--text-primary)] text-left">
                    {isStandalone ? 'Đã cài đặt ứng dụng' : 'Cài đặt ứng dụng'}
                  </span>
                  {isStandalone && <Check size={15} className="text-[var(--success)]" />}
                </button>
                {installMsg && (
                  <div className="mx-3 mb-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--primary)]/8">
                    <Info size={13} className="text-[var(--primary)] mt-0.5 shrink-0" />
                    <p className="text-xs text-[var(--text-secondary)] leading-snug">{installMsg}</p>
                    <button onClick={() => setInstallMsg(null)} className="ml-auto text-[var(--text-muted)]"><X size={11} /></button>
                  </div>
                )}
              </div>
            </div>

            {/* Divider + Logout */}
            <div className="border-t border-[var(--glass-border)] pt-3 pb-2">
              <button
                onClick={() => { onClose(); onLogout(); }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-[var(--danger)]/8 active:bg-[var(--danger)]/12 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--danger)]/10 flex items-center justify-center shrink-0">
                  <LogOut size={17} className="text-[var(--danger)]" />
                </div>
                <span className="text-sm font-semibold text-[var(--danger)]">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
