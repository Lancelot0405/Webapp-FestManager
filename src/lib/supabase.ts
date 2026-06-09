import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !anonKey) {
  throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env');
}

// Client thông thường (anon key) — dùng cho MỌI thao tác phía client.
// Các thao tác cần quyền admin được xử lý qua Edge Function "admin"
// (xem src/lib/adminApi.ts) để KHÔNG lộ service-role key trên frontend.
export const supabase = createClient(supabaseUrl, anonKey);
