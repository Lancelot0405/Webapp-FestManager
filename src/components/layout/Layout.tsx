import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useApp } from '../../context/AppContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import Sidebar   from './Sidebar';
import BottomNav from './BottomNav';
import UserSheet from './UserSheet';

export default function Layout() {
  const { currentUser, logout: contextLogout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [navVisible,    setNavVisible]    = useState(true);
  const [showUserSheet, setShowUserSheet] = useState(false);

  const mainRef     = useRef<HTMLElement>(null);
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

  useEffect(() => { showNav(); }, [location.pathname, showNav]);

  const handleLogout = () => {
    contextLogout();
    navigate('/dashboard', { replace: true });
  };

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const { notifications, clearAll, clearOne } = useRealtimeNotifications(!!currentUser && isAdminOrManager);

  const isDetail = /^\/(schedule|hr)\/.+/.test(location.pathname);

  return (
    <div className="h-screen font-sans overflow-hidden">
      <SpeedInsights />

      <div className="flex h-full">
        <Sidebar
          onOpenSheet={() => setShowUserSheet(true)}
          notifCount={notifications.length}
          notifications={notifications}
          clearAll={clearAll}
          clearOne={clearOne}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pt-[calc(env(safe-area-inset-top)+1.25rem)] md:pt-5 pb-24 md:pb-8 scroll-smooth-ios animate-fade-up"
          >
            <div className="max-w-5xl xl:max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>

          {!isDetail && (
            <BottomNav
              navVisible={navVisible}
              onOpenSheet={() => setShowUserSheet(true)}
              notifCount={notifications.length}
            />
          )}
        </div>
      </div>

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
