// =============================================================================
// src/components/layout/Header.tsx
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { LogOut, Bell, X, BellPlus, Download, Smartphone, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface HeaderProps {
  onLogoClick: () => void;
  onLogout: () => void;
}

export default function Header({ onLogoClick, onLogout }: HeaderProps) {
  const { state } = useApp();
  const { currentUser } = state;
  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const { theme, toggleTheme } = useTheme();

  const { notifications, clearAll, clearOne } = useRealtimeNotifications(isAdmin || isManager);
  const { subscribed, loading: pushLoading, subscribe } = usePushNotifications();
  const { isIos, isStandalone, triggerInstall } = useInstallPrompt();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showInstallModal, setShowInstallModal]   = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const installRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ngoài
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
    // 'installed' → Chrome đã xử lý, không cần làm gì thêm
    // 'guide' hoặc 'already' → hiện popup hướng dẫn/nhắc nhở
    if (result === 'guide' || result === 'already') {
      setShowInstallModal(v => !v);
    }
  };

  return (
    <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-700 px-4 sticky top-0 z-10 pt-safe shadow-sm">
      <div className="flex justify-between items-center h-14">
        <h1
          onClick={onLogoClick}
          className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent cursor-pointer select-none"
        >
          FestManager
        </h1>

        <div className="flex items-center gap-1.5">
          <div className="flex flex-col text-right mr-1">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{currentUser.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${isAdmin ? 'text-blue-600' : isManager ? 'text-indigo-600' : 'text-emerald-600'}`}>
              {isAdmin ? 'Quản lý' : isManager ? 'Quản lý' : 'Nhân viên'}
            </span>
          </div>

          {/* Nút cài app — luôn hiện */}
          <div className="relative" ref={installRef}>
            <button
              onClick={handleInstallClick}
              className="w-9 h-9 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 text-gray-500 rounded-full flex items-center justify-center transition-colors"
              title="Cài đặt ứng dụng"
            >
              <Download size={16} />
            </button>

            {showInstallModal && (
              <div className="absolute right-0 top-11 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-indigo-600" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {isStandalone ? 'Đã cài đặt' : 'Cài đặt FestManager'}
                    </p>
                  </div>
                  <button onClick={() => setShowInstallModal(false)} className="text-gray-400 dark:text-gray-500">
                    <X size={15} />
                  </button>
                </div>

                {isStandalone ? (
                  /* Đã cài — nhắc nhở */
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      FestManager đã được cài trên thiết bị của bạn. 🎉
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Nếu muốn cài lại, hãy xóa app khỏi màn hình chính rồi làm theo hướng dẫn bên dưới.
                    </p>
                    <div className="pt-1 space-y-2">
                      <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
                      <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
                      <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
                    </div>
                  </div>
                ) : isIos ? (
                  /* iOS chưa cài */
                  <div className="space-y-2.5">
                    <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
                    <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
                    <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
                  </div>
                ) : (
                  /* Android/Desktop không có prompt (đã cài hoặc không hỗ trợ) */
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Trình duyệt của bạn không hỗ trợ cài đặt tự động. Hãy dùng menu trình duyệt → "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Yêu cầu Safari iOS 16.4+ hoặc Chrome Android</p>
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center transition-colors"
            title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Chuông thông báo — admin */}
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown(v => !v)}
                className="w-9 h-9 bg-gray-100 dark:bg-slate-700 hover:bg-yellow-50 dark:hover:bg-indigo-900/40 hover:text-yellow-600 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center transition-colors relative"
                title="Thông báo"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 top-11 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Thông báo {notifications.length > 0 && `(${notifications.length})`}
                    </p>
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Không có thông báo</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-2 px-4 py-3 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'expense' ? 'bg-orange-400' : 'bg-red-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">{n.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{n.timestamp}</p>
                          </div>
                          <button onClick={() => clearOne(n.id)} className="shrink-0 text-gray-300 hover:text-gray-500 mt-0.5">
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Push subscribe — staff */}
          {!isAdmin && (
            subscribed ? (
              <div className="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center" title="Đã bật thông báo">
                <Bell size={16} />
              </div>
            ) : (
              <button
                onClick={subscribe}
                disabled={pushLoading}
                className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-60 relative"
                title="Bật thông báo đẩy"
              >
                {pushLoading
                  ? <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  : <><BellPlus size={16} /><span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white" /></>
                }
              </button>
            )
          )}

          <button
            onClick={onLogout}
            className="w-9 h-9 bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

function InstallStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{text}</p>
    </div>
  );
}
