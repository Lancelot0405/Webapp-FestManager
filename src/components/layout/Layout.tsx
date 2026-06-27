import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFAB } from '../../context/FABContext';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { animations } from '../../lib/animations';
import Sidebar   from './Sidebar';
import TopBar    from './TopBar';
import BottomNav from './BottomNav';

export default function Layout() {
  const { currentUser, logout: contextLogout } = useApp();
  const { loadAccentForUser } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) { loadAccentForUser(''); return; }
    const uid = currentUser.id;
    supabase.auth.getUser().then(({ data: { user } }) => {
      loadAccentForUser(uid, user?.user_metadata?.accent_theme ?? null);
    });
  }, [currentUser?.id, loadAccentForUser]);

  const mainRef     = useRef<HTMLElement>(null);
  const topBarRef   = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const rafId       = useRef(0);

  const [topBarH, setTopBarH] = useState(0);

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

  const isDetail = /^\/(schedule|hr)\/.+/.test(location.pathname);

  useEffect(() => {
    const header = topBarRef.current?.querySelector('header');
    if (!header) { setTopBarH(0); return; }
    const measure = () => setTopBarH(header.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, [isDetail]);

  const handleLogout = () => {
    contextLogout();
    navigate('/dashboard', { replace: true });
  };

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const { notifications, clearAll, clearOne } = useRealtimeNotifications(!!currentUser && isAdminOrManager);

  const { fab } = useFAB();

  return (
    <div className="h-dvh font-sans overflow-hidden">
      <SpeedInsights />

      <div className="flex h-full">
        <Sidebar
          onOpenSheet={() => {}}
          notifCount={notifications.length}
          notifications={notifications}
          clearAll={clearAll}
          clearOne={clearOne}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {!isDetail && (
            <div ref={topBarRef} className="md:hidden">
              <TopBar
                navVisible={navVisible}
                notifCount={notifications.length}
                notifications={notifications}
                clearAll={clearAll}
                clearOne={clearOne}
                onLogout={handleLogout}
              />
            </div>
          )}
          <main
            ref={mainRef}
            style={{ '--tbh': `${topBarH}px` } as CSSProperties}
            className={`flex-1 overflow-y-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:pl-[max(1.5rem,env(safe-area-inset-left))] md:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))] ${
              isDetail ? 'pt-safe' : 'pt-[var(--tbh)]'
            } md:pt-5 pb-24 md:pb-8 scroll-smooth-ios`}
          >
            <div className="max-w-5xl xl:max-w-7xl mx-auto w-full">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  {...animations.pageEnter}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {!isDetail && (
            <div className="md:hidden">
              <BottomNav navVisible={navVisible} />
            </div>
          )}
        </div>
      </div>

      {fab && !isDetail && (
        <Button
          isIconOnly
          aria-label={fab.label}
          onPress={fab.onPress}
          className={`fixed bottom-[calc(env(safe-area-inset-bottom)+8rem)] right-[calc(env(safe-area-inset-right)+1rem)] md:bottom-8 md:right-8 z-30 h-14 w-14 rounded-full bg-accent text-white dark:text-foreground shadow-xl active:scale-95 transition-all duration-300 ease-out ${navVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}
        >
          <Plus size={24} />
        </Button>
      )}

    </div>
  );
}
