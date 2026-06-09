import { useState, useRef, useEffect } from 'react';
import { LogOut, Bell, X, BellPlus, Download, Smartphone, Moon, Sun, UtensilsCrossed } from 'lucide-react';
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
  admin:   'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  manager: 'bg-saffron-100 text-saffron-600 dark:bg-saffron-500/20 dark:text-saffron-300',
  staff:   'bg-herb-500/10 text-herb-600 dark:bg-herb-500/20 dark:text-herb-400',
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
    'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 ' +
    'hover:bg-brand-100 dark:hover:bg-brand-900/50 active:scale-95';

  return (
    <header className="bg-white/95 dark:bg-espresso-700/95 backdrop-blur-sm border-b border-brand-100 dark:border-espresso-700 px-4 sticky top-0 z-10 pt-safe shadow-card">
      <div className="flex justify-between items-center h-14">

        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-[0_2px_8px_0_rgb(249_115_22/0.35)]">
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
            <span className="text-sm font-semibold text-espresso-800 dark:text-espresso-50 leading-tight">
              {currentUser.name}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full self-end ${roleStyle[currentUser.role]}`}>
              {roleLabel[currentUser.role]}
            </span>
          </div>

          {/* Install */}
          <div className="relative" ref={installRef}>
            <button onClick={handleInstallClick} className={iconBtn} aria-label="Cài đặt ứng dụng">
              <Download size={16} />
            </button>
            {showInstallModal && (
              <InstallDropdown isStandalone={isStandalone} isIos={isIos} onClose={() => setShowInstallModal(false)} />
            )}
          </div>

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            className={iconBtn}
            aria-label={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications — admin/manager */}
          {(isAdmin || isManager) && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown(v => !v)}
                className={`${iconBtn} relative`}
                aria-label="Thông báo"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-espresso-700">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
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
              <button onClick={subscribe} disabled={pushLoading} className={`${iconBtn} relative`} aria-label="Bật thông báo đẩy">
                {pushLoading
                  ? <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  : <><BellPlus size={16} /><span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-saffron-500 rounded-full border-2 border-white dark:border-espresso-700" /></>
                }
              </button>
            )
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95"
            aria-label="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InstallDropdown({ isStandalone, isIos, onClose }: { isStandalone: boolean; isIos: boolean; onClose: () => void }) {
  return (
    <div className="absolute right-0 top-11 w-72 bg-white dark:bg-espresso-700 rounded-2xl shadow-warm border border-brand-100 dark:border-espresso-700 z-50 p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-brand-500" />
          <p className="text-sm font-semibold text-espresso-800 dark:text-espresso-50">
            {isStandalone ? 'Đã cài đặt' : 'Cài FestManager'}
          </p>
        </div>
        <button onClick={onClose} className="text-brand-300 hover:text-brand-500"><X size={15} /></button>
      </div>
      {isStandalone ? (
        <p className="text-sm text-brand-600 dark:text-brand-300">FestManager đã được cài trên thiết bị của bạn 🎉</p>
      ) : isIos ? (
        <div className="space-y-2.5">
          <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
          <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
          <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
        </div>
      ) : (
        <p className="text-sm text-brand-500 dark:text-brand-400">
          Dùng menu trình duyệt → "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".
        </p>
      )}
      <p className="text-xs text-brand-300 dark:text-brand-600 mt-3">Yêu cầu Safari iOS 16.4+ hoặc Chrome Android</p>
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
    <div className="absolute right-0 top-11 w-80 bg-white dark:bg-espresso-700 rounded-2xl shadow-warm border border-brand-100 dark:border-espresso-700 z-50 overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-50 dark:border-espresso-700">
        <p className="text-sm font-semibold text-espresso-800 dark:text-espresso-50">
          Thông báo {notifications.length > 0 && `(${notifications.length})`}
        </p>
        {notifications.length > 0 && (
          <button onClick={onClearAll} className="text-xs text-red-500 hover:text-red-600 font-medium">
            Xóa tất cả
          </button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-brand-300 dark:text-brand-600 text-center py-6">Không có thông báo</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="flex items-start gap-2 px-4 py-3 border-b border-brand-50 dark:border-espresso-700 hover:bg-brand-50 dark:hover:bg-espresso-700/80">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'expense' ? 'bg-saffron-500' : 'bg-brand-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-espresso-800 dark:text-espresso-50 leading-snug">{n.message}</p>
                <p className="text-xs text-brand-400 mt-0.5">{n.timestamp}</p>
              </div>
              <button onClick={() => onClearOne(n.id)} className="shrink-0 text-brand-200 hover:text-brand-400 mt-0.5">
                <X size={14} />
              </button>
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
      <p className="text-xs text-espresso-800 dark:text-espresso-50 leading-snug">{text}</p>
    </div>
  );
}
