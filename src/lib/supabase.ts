import { createClient } from '@supabase/supabase-js';

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey        = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const serviceRoleKey = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string) ?? '';

if (!supabaseUrl || !anonKey) {
  throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env');
}

// Client thông thường — dùng cho mọi thao tác
export const supabase = createClient(supabaseUrl, anonKey);

// Admin client — chỉ dùng cho tạo user, đổi mật khẩu (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
