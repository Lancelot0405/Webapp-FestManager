import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';
const STORAGE_KEY = 'fm_push_subscribed';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i);
  }
  return array.buffer;
}

export function usePushNotifications() {
  // Khởi tạo từ localStorage để giữ trạng thái sau reload
  const [subscribed, setSubscribed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [loading, setLoading] = useState(false);
  // Derive ở initializer (API có sẵn lúc mount) — tránh setState trong effect.
  const [supported] = useState(() =>
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  );

  const subscribe = useCallback(async () => {
    if (!supported) return;
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push] VITE_VAPID_PUBLIC_KEY not set');
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setLoading(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await supabase.from('push_subscriptions').upsert({
        endpoint: sub.endpoint,
        keys: sub.toJSON().keys,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      localStorage.setItem(STORAGE_KEY, '1');
      setSubscribed(true);
    } catch (err) {
      console.error('[Push] Subscribe error:', err);
    }
    setLoading(false);
  }, [supported]);

  return { subscribed, loading, subscribe, supported };
}
