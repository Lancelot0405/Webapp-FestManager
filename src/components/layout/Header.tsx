import { useState, useRef, useEffect } from 'react';
import { LogOut, Bell, X, BellPlus, Download, Smartphone, UtensilsCrossed, Sun, Moon } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface HeaderProps {
  onLogoClick: () => void;
  onLogout:    () => void;
}

const roleStyle: Record<string, string> = {
  admin:   'bg-brand-100 text-brand-700',
  manager: 'bg-indigo-100 text-indigo-600',
  staff:   'bg-herb-500/10 text-herb-600',
};
const roleLabel: Record<string, string> = {
  admin: 'Admin', manager: 'Quản lý', staff: 'Nhân viên',
};

export default function Header({ onLogoClick, onLogout }: HeaderProps) {
  const { state }       = useApp();
  const { currentUser } = state;
  const isAdmin         = currentUser?.role === 'admin';
  const isManager       = currentUser?.role === 'manager';

  const { theme, toggleTheme } = useTheme();
  const { notifications, clearAll, clearOne } = useRealtimeNotifications(isAdmin || isManager);
  const { subscribed, loading: pushLoading, subscribe } = usePushNotifications();
  const { isIos, isStandalone, triggerInstall } = useInstallPrompt();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showInstallModal,  setShowInstallModal]  = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const installRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifDropdown(false);
      if (installRef.current && !installRef.current.contains(e.target as Node)) setShowInstallModal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!currentUser) return null;

  const handleInstallClick = async () => {
    const result = await triggerInstall();
    if (result === 'guide' || result === 'already') setShowInstallModal(v => !v);
  };

  const iconBtn =
    'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ' +
    'text-brand-600 bg-brand-50 hover:bg-brand-100 active:scale-95';

  return (
    <header className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-4 sticky top-0 z-10 pt-safe shadow-card">
      <div className="flex justify-between items-center h-14">

        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-[0_2px_8px_0_rgb(124_58_237/0.35)]">
            <UtensilsCrossed size={16} className="text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-brand-gradient select-none">
            FestManager
          </span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* User info */}
          <div className="flex flex-col text-right mr-1">
            <span className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
              {currentUser.name}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full self-end ${roleStyle[currentUser.role]}`}>
              {roleLabel[currentUser.role]}
            </span>
          </div>

          {/* Dark mode toggle */}
          <Button
            onPress={toggleTheme}
            variant="ghost"
            isIconOnly
            size="sm"
            className="rounded-full"
            aria-label={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {/* Install */}
          <div className="relative" ref={installRef}>
            <Button onPress={handleInstallClick} variant="ghost" isIconOnly size="sm" className="rounded-full" aria-label="Cài đặt ứng dụng">
              <Download size={16} />
            </Button>
            {showInstallModal && (
              <InstallDropdown isStandalone={isStandalone} isIos={isIos} onClose={() => setShowInstallModal(false)} />
            )}
          </div>

          {/* Notifications — admin/manager */}
          {(isAdmin || isManager) && (
            <div className="relative" ref={notifRef}>
              <Button
                onPress={() => setShowNotifDropdown(v => !v)}
                variant="ghost"
                isIconOnly
                size="sm"
                className="rounded-full relative"
                aria-label="Thông báo"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </Button>
              {showNotifDropdown && (
                <NotifDropdown
                  notifications={notifications}
                  onClearAll={clearAll}
                  onClearOne={clearOne}
                />
              )}
            </div>
          )}

          {/* Push subscribe — staff */}
          {!isAdmin && !isManager && (
            subscribed ? (
              <div className={`${iconBtn} cursor-default`} aria-label="Đã bật thông báo">
                <Bell size={16} className="text-herb-500" />
              </div>
            ) : (
              <Button onPress={subscribe} isDisabled={pushLoading} variant="ghost" isIconOnly size="sm" className="rounded-full relative" aria-label="Bật thông báo đẩy">
                {pushLoading
                  ? <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  : <><BellPlus size={16} /><span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white" /></>
                }
              </Button>
            )
          )}

          {/* Logout */}
          <Button
            onPress={onLogout}
            variant="ghost"
            isIconOnly
            size="sm"
            className="rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            aria-label="Đăng xuất"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InstallDropdown({ isStandalone, isIos, onClose }: { isStandalone: boolean; isIos: boolean; onClose: () => void }) {
  return (
    <div className="absolute right-0 top-11 w-72 bg-[var(--card-bg)] rounded-2xl shadow-warm border border-[var(--border-color)] z-50 p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-brand-500" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {isStandalone ? 'Đã cài đặt' : 'Cài FestManager'}
          </p>
        </div>
        <Button onPress={onClose} variant="ghost" isIconOnly size="sm"><X size={15} /></Button>
      </div>
      {isStandalone ? (
        <p className="text-sm text-brand-600">FestManager đã được cài trên thiết bị của bạn 🎉</p>
      ) : isIos ? (
        <div className="space-y-2.5">
          <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
          <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
          <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
        </div>
      ) : (
        <p className="text-sm text-brand-500">
          Dùng menu trình duyệt → "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".
        </p>
      )}
      <p className="text-xs text-slate-400 mt-3">Yêu cầu Safari iOS 16.4+ hoặc Chrome Android</p>
    </div>
  );
}

function NotifDropdown({
  notifications,
  onClearAll,
  onClearOne,
}: {
  notifications: { id: string; message: string; timestamp: string; type: string }[];
  onClearAll: () => void;
  onClearOne: (id: string) => void;
}) {
  return (
    <div className="absolute right-0 top-11 w-80 bg-[var(--card-bg)] rounded-2xl shadow-warm border border-[var(--border-color)] z-50 overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Thông báo {notifications.length > 0 && `(${notifications.length})`}
        </p>
        {notifications.length > 0 && (
          <Button onPress={onClearAll} variant="ghost" size="sm" className="text-xs text-red-500">
            Xóa tất cả
          </Button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Không có thông báo</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="flex items-start gap-2 px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--accent)]">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'expense' ? 'bg-indigo-500' : 'bg-brand-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] leading-snug">{n.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.timestamp}</p>
              </div>
              <Button onPress={() => onClearOne(n.id)} variant="ghost" isIconOnly size="sm" className="shrink-0 mt-0.5">
                <X size={14} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InstallStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="w-5 h-5 rounded-full bg-brand-gradient text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-xs text-slate-700 leading-snug">{text}</p>
    </div>
  );
}
