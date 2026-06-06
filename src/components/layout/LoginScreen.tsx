// =============================================================================
// src/components/layout/LoginScreen.tsx
// =============================================================================

import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LoginScreen() {
  const { login } = useApp();

  return (
    <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col items-center justify-center p-8">
      <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
        <Lock size={48} strokeWidth={1.5} />
      </div>

      <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
        FestManager
      </h1>
      <p className="text-gray-500 mb-12 text-center text-sm font-medium">
        Hệ thống quản lý F&amp;B lưu động
      </p>

      <div className="w-full space-y-4">
        <button
          onClick={() => login({ id: 1, name: 'Lance', role: 'admin' })}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:scale-95 transition"
        >
          Vào bằng quyền Quản lý (Admin)
        </button>

        <div className="relative py-4 flex items-center justify-center">
          <div className="border-b border-gray-200 w-full" />
          <span className="absolute bg-white px-3 text-xs text-gray-400">HOẶC</span>
        </div>

        <button
          onClick={() => login({ id: 2, name: 'Linh', role: 'staff' })}
          className="w-full bg-emerald-50 text-emerald-700 font-bold py-4 rounded-2xl border border-emerald-100 hover:scale-95 transition shadow-sm"
        >
          Vào bằng Nhân viên &ldquo;Linh&rdquo;
        </button>
      </div>
    </div>
  );
}