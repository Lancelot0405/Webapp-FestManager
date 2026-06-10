// =============================================================================
// src/App.tsx  —  App shell (điều phối, không chứa business logic)
// =============================================================================

import { useState } from 'react';
import { useApp } from './context/AppContext';
import type { ActiveTab } from './types';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Layout
import LoginScreen from './components/layout/LoginScreen';
import Header      from './components/layout/Header';
import BottomNav   from './components/layout/BottomNav';
import Sidebar     from './components/layout/Sidebar';

// Screens
import Dashboard    from './components/dashboard/Dashboard';
import Schedule     from './components/schedule/Schedule';
import EventDetail  from './components/schedule/EventDetail';
import Inventory    from './components/inventory/Inventory';
import Finance      from './components/finance/Finance';
import HRGlobal     from './components/hr/HRGlobal';
import StaffProfile from './components/hr/StaffProfile';
import Clients      from './components/clients/Clients';

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

  // ── Đang khởi tạo (chờ onAuthStateChange) → hiện splash screen ──────────
  const { loading } = state;
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-warm">
            <span className="text-white font-black text-xl tracking-tight">FM</span>
          </div>
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        </div>
      </div>
    );
  }

  // ── Chưa đăng nhập → hiện màn hình Login ──────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-brand-gradient flex justify-center">
        <LoginScreen />
      </div>
    );
  }

  // ── Đã đăng nhập → hiện App shell ─────────────────────────────────────────
  const isAdmin    = currentUser.role === 'admin';
  const isManager  = currentUser.role === 'manager';
  const canViewAll = isAdmin || isManager;
  const isInDetail = selectedEventId !== null || selectedStaffId !== null;

  return (
    <div className="min-h-screen font-sans">
      <SpeedInsights />

      {/* ── Desktop/Tablet: sidebar + content side-by-side ─────────────────── */}
      <div className="flex min-h-screen">

        {/* Sidebar — visible md+ */}
        {!isInDetail && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogoClick={handleLogoClick}
          />
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col min-h-screen md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">

          {/* Header — full-width on mobile, hidden logo on md+ (sidebar has it) */}
          <Header onLogoClick={handleLogoClick} onLogout={handleLogout} />

          <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-5 pb-24 md:pb-8 scroll-smooth-ios animate-fade-up">

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
                  <Dashboard onSelectEvent={setSelectedEventId} onNavigate={setActiveTab} />
                )}
                {activeTab === 'schedule' && (
                  <Schedule onSelectEvent={setSelectedEventId} />
                )}
                {activeTab === 'inventory' && (
                  <Inventory />
                )}
                {activeTab === 'finance' && canViewAll && (
                  <Finance onSelectEvent={setSelectedEventId} />
                )}
                {activeTab === 'hr' && canViewAll && (
                  <HRGlobal onSelectStaff={setSelectedStaffId} />
                )}
                {activeTab === 'profile' && (currentUser.role === 'staff' || isManager) && myStaffId && (
                  <StaffProfile staffId={myStaffId} />
                )}
                {activeTab === 'profile' && (currentUser.role === 'staff' || isManager) && !myStaffId && (
                  <p className="text-center text-[var(--text-muted)] py-20 text-sm">Đang tải hồ sơ...</p>
                )}
                {activeTab === 'clients' && canViewAll && (
                  <Clients />
                )}
              </>
            )}

          </main>

          {/* BottomNav — mobile only, ẩn khi đang xem chi tiết */}
          {!isInDetail && (
            <BottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

        </div>
      </div>
    </div>
  );
}
