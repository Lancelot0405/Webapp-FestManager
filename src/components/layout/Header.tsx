// =============================================================================
// src/components/layout/Header.tsx
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { LogOut, Bell, X, BellPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface HeaderProps {
  onLogoClick: () => void;
  onLogout: () => void;
}

export default function Header({ onLogoClick, onLogout }: HeaderProps) {
  const { state } = useApp();
  const { currentUser } = state;
  const isAdmin = currentUser?.role === 'admin';

  const { notifications, clearAll, clearOne } = useRealtimeNotifications(isAdmin);
  const { subscribed, loading: pushLoading, subscribe } = usePushNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  if (!currentUser) return null;

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-5 sticky top-0 z-10 pt-safe shadow-sm">
      <div className="flex justify-between items-center h-14">
        <h1
          onClick={onLogoClick}
          className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent cursor-pointer select-none"
        >
          FestManager
        </h1>

        <div className="flex items-center gap-2">
          <div className="flex flex-col text-right mr-1">
            <span className="text-sm font-semibold text-gray-800 leading-tight">
              {currentUser.name}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                currentUser.role === 'admin' ? 'text-blue-600' : 'text-emerald-600'
              }`}
            >
              {currentUser.role === 'admin' ? 'Quản lý' : 'Nhân sự'}
            </span>
          </div>

          {/* Bell icon — admin only */}
          {isAdmin && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(v => !v)}
                className="w-9 h-9 bg-gray-100 hover:bg-yellow-50 hover:text-yellow-600 text-gray-500 rounded-full flex items-center justify-center transition-colors relative"
                title="Thông báo"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">
                      Thông báo {notifications.length > 0 && `(${notifications.length})`}
                    </p>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Không có thông báo</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'expense' ? 'bg-orange-400' : 'bg-red-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.timestamp}</p>
                          </div>
                          <button
                            onClick={() => clearOne(n.id)}
                            className="shrink-0 text-gray-300 hover:text-gray-500 mt-0.5"
                          >
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

          {/* Push notification subscribe button */}
          {'serviceWorker' in navigator && 'PushManager' in window && !subscribed && (
            <button
              onClick={subscribe}
              disabled={pushLoading}
              className="w-9 h-9 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 rounded-full flex items-center justify-center transition-colors disabled:opacity-60"
              title="Bật thông báo đẩy"
            >
              <BellPlus size={16} />
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-9 h-9 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-full flex items-center justify-center transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
