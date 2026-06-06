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

// Screens
import Dashboard    from './components/dashboard/Dashboard';
import Schedule     from './components/schedule/Schedule';
import EventDetail  from './components/schedule/EventDetail';
import Inventory    from './components/inventory/Inventory';
import Finance      from './components/finance/Finance';
import HRGlobal     from './components/hr/HRGlobal';
import StaffProfile from './components/hr/StaffProfile';

export default function App() {
  const { state, logout: contextLogout } = useApp();
  const { currentUser, staff } = state;

  // Tìm numeric staff id cho user đang đăng nhập (dùng cho tab profile của staff)
  const myStaffMember = currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;
  const myStaffId = myStaffMember ? String(myStaffMember.id) : '';

  // ── UI state (cục bộ trong App — không cần vào Context) ───────────────────
  const [activeTab,        setActiveTab]        = useState<ActiveTab>('dashboard');
  const [selectedEventId,  setSelectedEventId]  = useState<number | null>(null);
  const [selectedStaffId,  setSelectedStaffId]  = useState<string | null>(null);

  // Reset về Dashboard + xóa mọi selection đang chọn
  const handleLogoClick = () => {
    setActiveTab('dashboard');
    setSelectedEventId(null);
    setSelectedStaffId(null);
  };

  // Đăng xuất rồi reset toàn bộ UI state
  const handleLogout = () => {
    contextLogout();
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

        <Header onLogoClick={handleLogoClick} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">

          {/* ── Màn hình chi tiết Event ──────────────────────────────────── */}
          {selectedEventId && (
            <EventDetail
              eventId={selectedEventId}
              onBack={() => setSelectedEventId(null)}
            />
          )}

          {/* ── Màn hình chi tiết Staff (admin xem profile nhân viên) ─────── */}
          {!selectedEventId && selectedStaffId && (
            <StaffProfile
              staffId={selectedStaffId}
              onBack={() => setSelectedStaffId(null)}
            />
          )}

          {/* ── Các tab chính ─────────────────────────────────────────────── */}
          {!selectedEventId && !selectedStaffId && (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard onSelectEvent={setSelectedEventId} />
              )}
              {activeTab === 'schedule' && (
                <Schedule onSelectEvent={setSelectedEventId} />
              )}
              {activeTab === 'inventory' && (
                <Inventory />
              )}
              {activeTab === 'finance' && currentUser.role === 'admin' && (
                <Finance onSelectEvent={setSelectedEventId} />
              )}
              {activeTab === 'hr' && currentUser.role === 'admin' && (
                <HRGlobal onSelectStaff={setSelectedStaffId} />
              )}
              {activeTab === 'profile' && currentUser.role === 'staff' && myStaffId && (
                <StaffProfile staffId={myStaffId} />
              )}
              {activeTab === 'profile' && currentUser.role === 'staff' && !myStaffId && (
                <p className="text-center text-gray-400 py-20 text-sm">Đang tải hồ sơ...</p>
              )}
            </>
          )}

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
