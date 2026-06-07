// =============================================================================
// src/hooks/useRealtimeNotifications.ts
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  type: 'expense' | 'stock';
  message: string;
  timestamp: string;
}

export function useRealtimeNotifications(isAdmin: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((n: Omit<AppNotification, 'id'>) => {
    setNotifications(prev => [
      { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ...prev,
    ]);
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const clearOne = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const expensesChannel = supabase
      .channel('realtime-expenses')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const row = payload.new as { status?: string; staff_name?: string; amount?: number };
          if (row.status === 'pending') {
            addNotification({
              type: 'expense',
              message: `Chi phí mới chờ duyệt từ ${row.staff_name ?? 'nhân viên'}${row.amount != null ? ` — ${row.amount.toLocaleString('fr-FR')}€` : ''}`,
              timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
            });
          }
        }
      )
      .subscribe();

    const inventoryChannel = supabase
      .channel('realtime-inventory')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory_items' },
        (payload) => {
          const row = payload.new as { name?: string; current?: number; threshold?: number };
          const { name, current, threshold } = row;
          if (
            threshold != null &&
            threshold > 0 &&
            current != null &&
            current < threshold
          ) {
            addNotification({
              type: 'stock',
              message: `Kho hàng sắp hết: "${name ?? 'mặt hàng'}" còn ${current}`,
              timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, [isAdmin, addNotification]);

  return { notifications, clearAll, clearOne };
}
