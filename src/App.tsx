// =============================================================================
// src/App.tsx  —  App shell (điều phối, không chứa business logic)
// =============================================================================

import { useState } from 'react';
import { useApp } from './context/AppContext';
import type { ActiveTab } from './types';

// Layout
import LoginScreen from './components/layout/LoginScreen';
import Header      from './components/layout/Header';
import BottomNav   from './components/layout/BottomNav';

// ── Screens (sẽ tạo ở các bước tiếp theo) ────────────────────────────────────
// import Dashboard    from './components/dashboard/Dashboard';
// import Schedule     from './components/schedule/Schedule';
// import EventDetail  from './components/schedule/EventDetail';
// import Inventory    from './components/inventory/Inventory';
// import Finance      from './components/finance/Finance';
// import HRGlobal     from './components/hr/HRGlobal';
// import StaffProfile from './components/hr/StaffProfile';
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const { state, logout } = useApp();
  const { currentUser } = state;

  // ── UI state (cục bộ trong App — không cần vào Context) ───────────────────
  const [activeTab,        setActiveTab]        = useState<ActiveTab>('dashboard');
  const [selectedEventId,  setSelectedEventId]  = useState<number | null>(null);
  const [selectedStaffId,  setSelectedStaffId]  = useState<number | null>(null);

  // Reset về Dashboard + xóa mọi selection đang chọn
  const handleLogoClick = () => {
    setActiveTab('dashboard');
    setSelectedEventId(null);
    setSelectedStaffId(null);
  };

  // Đăng xuất rồi reset toàn bộ UI state
  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
    setSelectedEventId(null);
    setSelectedStaffId(null);
  };

  // ── Chưa đăng nhập → hiện màn hình Login ──────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <LoginScreen />
      </div>
    );
  }

  // ── Đã đăng nhập → hiện App shell ─────────────────────────────────────────
  const isInDetail = selectedEventId !== null || selectedStaffId !== null;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl flex flex-col">

        <Header onLogoClick={handleLogoClick} />

        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">

          {/* ── Màn hình chi tiết Event ────────────────────────────────────
              (Sẽ uncomment khi tạo EventDetail.tsx ở bước tiếp theo)

          {selectedEventId && (
            <EventDetail
              eventId={selectedEventId}
              onBack={() => setSelectedEventId(null)}
            />
          )}
          ──────────────────────────────────────────────────────────────── */}

          {/* ── Các tab chính ─────────────────────────────────────────────
              Tạm thời dùng placeholder, sẽ thay bằng component thật dần

          {!selectedEventId && (
            <>
              {activeTab === 'dashboard' && <Dashboard onSelectEvent={setSelectedEventId} />}
              {activeTab === 'schedule'  && <Schedule  onSelectEvent={setSelectedEventId} />}
              {activeTab === 'inventory' && <Inventory />}
              {activeTab === 'finance'   && currentUser.role === 'admin' && <Finance onSelectEvent={setSelectedEventId} />}
              {activeTab === 'hr'        && currentUser.role === 'admin' && <HRGlobal onSelectStaff={setSelectedStaffId} />}
              {activeTab === 'profile'   && currentUser.role === 'staff' && <StaffProfile staffId={currentUser.id} />}
            </>
          )}
          ──────────────────────────────────────────────────────────────── */}

          {/* PLACEHOLDER — xóa khi uncomment các screen bên trên */}
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <p className="text-lg font-bold">Tab: {activeTab}</p>
            <p className="text-sm">Components đang được tạo...</p>
          </div>

        </main>

        {/* BottomNav ẩn khi đang xem chi tiết */}
        {!isInDetail && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

      </div>
    </div>
  );
}