// =============================================================================
// src/App.tsx  —  App shell (điều phối, không chứa business logic)
// =============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './context/AppContext';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';
import type { ActiveTab } from './types';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Layout
import LoginScreen from './components/layout/LoginScreen';
import TopBar      from './components/layout/TopBar';
import UserSheet   from './components/layout/UserSheet';
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
  const [navVisible,       setNavVisible]        = useState(true);
  const [showUserSheet,    setShowUserSheet]     = useState(false);

  const mainRef    = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const rafId       = useRef(0);

  const showNav = useCallback(() => setNavVisible(true), []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handler = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const y = el.scrollTop;
        const delta = y - lastScrollY.current;
        if (Math.abs(delta) < 4) return;
        setNavVisible(delta < 0 || y < 60);
        lastScrollY.current = y;
      });
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => { el.removeEventListener('scroll', handler); cancelAnimationFrame(rafId.current); };
  }, []);

  // Luôn hiện nav khi chuyển tab hoặc vào/ra detail
  useEffect(() => { showNav(); }, [activeTab, selectedEventId, selectedStaffId, showNav]);

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

  // ── Realtime notifications — phải gọi trước mọi early return (Rules of Hooks) ──
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const { notifications, clearAll, clearOne } = useRealtimeNotifications(!!currentUser && isAdminOrManager);

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
    <div className="h-screen font-sans overflow-hidden">
      <SpeedInsights />

      {/* ── Desktop/Tablet: sidebar + content side-by-side ─────────────────── */}
      <div className="flex h-full">

        {/* Sidebar — always mounted, CSS handles hidden on mobile */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />

        {/* Main column */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

          {/* TopBar — mobile only */}
          <TopBar
            onLogoClick={handleLogoClick}
            onOpenSheet={() => setShowUserSheet(true)}
            navVisible={navVisible}
            notifCount={notifications.length}
          />

          <main ref={mainRef} className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-5 pb-24 md:pb-8 scroll-smooth-ios animate-fade-up">
            <div className="max-w-5xl mx-auto w-full">

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

            </div>
          </main>

          {/* BottomNav — mobile only */}
          {!isInDetail && (
            <BottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              navVisible={navVisible}
            />
          )}

        </div>
      </div>

      {/* UserSheet */}
      {showUserSheet && (
        <UserSheet
          onClose={() => setShowUserSheet(false)}
          onLogout={handleLogout}
          notifications={notifications}
          clearAll={clearAll}
          clearOne={clearOne}
        />
      )}
    </div>
  );
}
