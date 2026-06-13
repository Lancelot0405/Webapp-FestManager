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
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users').select('id, name, role, status').eq('id', session.user.id).single();
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
      } else {
        dispatch({ type: 'LOGOUT' });
        queryClient.clear();
      }
    });
    return () => subscription.unsubscribe();
  // queryClient is stable — không cần trong deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Realtime → invalidate TanStack Query cache
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel('festmanager-realtime')
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
