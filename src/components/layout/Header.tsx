// =============================================================================
// src/components/layout/Header.tsx
// =============================================================================

import { LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  /** Gọi khi bấm logo — về Dashboard và xóa selection */
  onLogoClick: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const { state, logout } = useApp();
  const { currentUser } = state;

  if (!currentUser) return null;

  return (
    <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
      <h1
        onClick={onLogoClick}
        className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
      >
        FestManager
      </h1>

      <div className="flex items-center gap-4">
        <div className="flex flex-col text-right">
          <span className="text-sm font-bold text-gray-800">
            {currentUser.name}
          </span>
          <span
            className={`text-[10px] font-bold uppercase ${
              currentUser.role === 'admin' ? 'text-blue-600' : 'text-emerald-600'
            }`}
          >
            {currentUser.role === 'admin' ? 'Quản lý' : 'Nhân sự'}
          </span>
        </div>

        <button
          onClick={logout}
          className="w-10 h-10 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-full flex items-center justify-center transition"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}