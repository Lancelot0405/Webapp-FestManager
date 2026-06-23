import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { CurrentUser } from '../types';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import { appReducer, initialState, type AppState } from './appReducer';

// =============================================================================
// CONTEXT TYPE — chỉ còn auth sau Phase 2
// =============================================================================

interface AppContextValue {
  currentUser: CurrentUser | null;
  loading:     boolean;
  login:  (user: CurrentUser) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // Auth state listener
  //
  // ⚠️ KHÔNG await hàm Supabase khác BÊN TRONG callback onAuthStateChange —
  // callback giữ lock của thư viện auth, await call khác sẽ gây deadlock và
  // app kẹt mãi ở splash. Vì vậy phần fetch profile được defer ra ngoài.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let active = true;

    const resolveSession = async (session: import('@supabase/supabase-js').Session | null) => {
      if (!session?.user) {
        if (!active) return;
        dispatch({ type: 'LOGOUT' });
        queryClient.clear();
        return;
      }

      const { data: profile } = await supabase
        .from('users').select('id, name, role, status').eq('id', session.user.id).single();

      if (!active) return;

      if (profile) {
        if (profile.status === 'pending' || profile.status === 'rejected') {
          await supabase.auth.signOut();
          return;
        }
        dispatch({
          type: 'LOGIN',
          payload: {
            id:   profile.id,
            name: profile.name,
            role: profile.role as import('../types').UserRole,
          },
        });
      } else {
        await supabase.auth.signOut();
      }
    };

    // 1) Lấy session hiện có ngay khi mount để giải quyết `loading` ban đầu
    supabase.auth.getSession().then(({ data }) => {
      void resolveSession(data.session);
    });

    // 2) Lắng nghe thay đổi auth — defer việc fetch để tránh deadlock auth lock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { void resolveSession(session); }, 0);
    });

    // 3) Timeout an toàn: nếu sau 8s vẫn chưa xác định được, thoát splash
    const safetyTimer = setTimeout(() => {
      if (active) dispatch({ type: 'SET_LOADING', payload: false });
    }, 8000);

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  // queryClient is stable — không cần trong deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Realtime → invalidate TanStack Query cache
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const channelSuffix = Math.random().toString(36).substring(2, 10);
    const channel = supabase
      .channel(`festmanager-realtime-${channelSuffix}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_staff' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLogs });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // queryClient is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login  = (user: CurrentUser) => dispatch({ type: 'LOGIN', payload: user });
  const logout = () => {
    supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
    queryClient.clear();
  };

  return (
    <AppContext.Provider value={{ currentUser: state.currentUser, loading: state.loading, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp() phải được dùng bên trong <AppProvider>.');
  return ctx;
}

export type { AppState };
