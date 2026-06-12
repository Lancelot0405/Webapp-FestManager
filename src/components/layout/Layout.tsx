import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import UserSheet from './UserSheet';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function Layout() {
  const { state, logout: contextLogout } = useApp();
  const { currentUser } = state;
  const location = useLocation();
  const navigate = useNavigate();

  const [navVisible, setNavVisible] = useState(true);
  const [showUserSheet, setShowUserSheet] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const rafId = useRef(0);



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
    return () => {
      el.removeEventListener('scroll', handler);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Luôn hiện nav khi chuyển route
  useEffect(() => {
    const handle = setTimeout(() => setNavVisible(true), 0);
    return () => clearTimeout(handle);
  }, [location.pathname]);

  const handleLogout = () => {
    contextLogout();
    navigate('/dashboard'); // reset to dashboard path
  };

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const { notifications, clearAll, clearOne } = useRealtimeNotifications(!!currentUser && isAdminOrManager);

  // BottomNav ẩn khi ở detail route: /schedule/:eventId hoặc /hr/:staffId
  const isDetail = /\/(schedule|hr)\/.+/.test(location.pathname);

  return (
    <div className="h-screen font-sans overflow-hidden">
      <SpeedInsights />

      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar
          onOpenSheet={() => setShowUserSheet(true)}
          notifCount={notifications.length}
        />

        {/* Main column */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* TopBar */}
          <TopBar
            onOpenSheet={() => setShowUserSheet(true)}
            navVisible={navVisible}
            notifCount={notifications.length}
          />

          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-5 pb-24 md:pb-8 scroll-smooth-ios animate-fade-up"
          >
            <div className="max-w-5xl mx-auto w-full">
              <Outlet /> {/* Các route con render tại đây */}
            </div>
          </main>

          {/* BottomNav */}
          {!isDetail && (
            <BottomNav navVisible={navVisible} />
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
