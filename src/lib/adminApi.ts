// =============================================================================
// FESTMANAGER — ADMIN API CLIENT
// src/lib/adminApi.ts
//
// Gọi Edge Function "admin" thay cho việc dùng service-role key trên frontend.
// Token đăng nhập của người gọi được supabase-js tự đính kèm; Edge Function
// tự kiểm tra quyền admin phía server.
// =============================================================================

import { supabase } from './supabase';

interface AdminResult<T> {
  data: T | null;
  error: string | null;
}

async function invokeAdmin<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<AdminResult<T>> {
  const { data, error } = await supabase.functions.invoke('admin', {
    body: { action, ...payload },
  });

  // Lỗi mạng / HTTP — cố đọc message chi tiết từ response của function.
  if (error) {
    let message = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      } catch { /* giữ message gốc */ }
    }
    return { data: null, error: message };
  }

  // Lỗi nghiệp vụ do function trả về trong body.
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    return { data: null, error: (data as { error: string }).error };
  }

  return { data: data as T, error: null };
}

export const adminApi = {
  register: (p: { email: string; password: string; name: string; role: 'staff' | 'manager'; department?: 'restaurant' | 'festival' }) =>
    invokeAdmin<{ userId: string }>('register', p),

  createStaff: (p: { email: string; password: string; name: string; role: string; department: string }) =>
    invokeAdmin<{ userId: string }>('create-staff', p),

  setPassword: (p: { userId: string; password: string }) =>
    invokeAdmin<{ ok: true }>('set-password', p),

  deleteUser: (p: { userId: string }) =>
    invokeAdmin<{ ok: true }>('delete-user', p),

  getUserEmail: (p: { userId: string }) =>
    invokeAdmin<{ email: string }>('get-user-email', p),
};
