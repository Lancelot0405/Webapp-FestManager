// =============================================================================
// FESTMANAGER — EDGE FUNCTION "admin"
// supabase/functions/admin/index.ts
//
// Giữ SERVICE_ROLE_KEY ở phía server (KHÔNG còn lộ trên frontend).
// Xử lý các thao tác bắt buộc cần quyền admin của Supabase Auth:
//   - register      (CÔNG KHAI) tạo tài khoản tự đăng ký
//   - create-staff  (ADMIN)     admin tạo tài khoản nhân viên
//   - set-password  (ADMIN)     admin đặt lại mật khẩu
//   - delete-user   (ADMIN)     xóa tài khoản auth
//   - get-user-email(ADMIN)     đọc email (để hiển thị tên đăng nhập)
//
// Supabase tự inject SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY vào function,
// nên KHÔNG cần set secret thủ công.
//
// Deploy:  supabase functions deploy admin --no-verify-jwt
//   (Tự kiểm tra quyền bên trong; cần --no-verify-jwt vì "register" là công khai.)
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Client service-role: bỏ qua RLS, chỉ tồn tại phía server.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Xác thực người gọi là admin (đang đăng nhập + role='admin').
async function getCallerIfAdmin(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? { id: user.id } : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { action, ...payload } = await req.json();

    switch (action) {
      // ---------------------------------------------------------------------
      // CÔNG KHAI: tự đăng ký (role chỉ được phép staff/manager, không bao giờ admin)
      // ---------------------------------------------------------------------
      case 'register': {
        const { email, password, name } = payload;
        const role = payload.role === 'manager' ? 'manager' : 'staff';
        if (!email || !password || !name) return json({ error: 'Thiếu thông tin đăng ký.' }, 400);

        const { data, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { name },
        });
        if (error) return json({ error: error.message }, 400);
        const userId = data.user?.id;
        if (!userId) return json({ error: 'Không tạo được tài khoản.' }, 400);

        await admin.from('users').upsert(
          { id: userId, name, role, status: role === 'manager' ? 'pending' : 'active' },
          { onConflict: 'id' },
        );
        await admin.from('staff_members').insert({
          name, user_id: userId, dob: '', city: '', staff_type: 'permanent',
        });
        return json({ ok: true, userId });
      }

      // ---------------------------------------------------------------------
      // ADMIN: tạo tài khoản nhân viên
      // ---------------------------------------------------------------------
      case 'create-staff': {
        if (!(await getCallerIfAdmin(req))) return json({ error: 'Chỉ admin được phép.' }, 403);
        const { email, password, name, role, department } = payload;
        if (!email || !password || !name) return json({ error: 'Thiếu thông tin.' }, 400);

        const { data, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { name },
        });
        if (error) return json({ error: error.message }, 400);
        const userId = data.user?.id;
        if (!userId) return json({ error: 'Không tạo được tài khoản.' }, 400);

        await admin.from('users').upsert(
          { id: userId, name, role: role === 'admin' || role === 'manager' ? role : 'staff', department },
          { onConflict: 'id' },
        );
        return json({ ok: true, userId });
      }

      // ---------------------------------------------------------------------
      // ADMIN: đặt lại mật khẩu
      // ---------------------------------------------------------------------
      case 'set-password': {
        if (!(await getCallerIfAdmin(req))) return json({ error: 'Chỉ admin được phép.' }, 403);
        const { userId, password } = payload;
        if (!userId || !password) return json({ error: 'Thiếu thông tin.' }, 400);
        const { error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      // ---------------------------------------------------------------------
      // ADMIN: xóa tài khoản auth
      // ---------------------------------------------------------------------
      case 'delete-user': {
        if (!(await getCallerIfAdmin(req))) return json({ error: 'Chỉ admin được phép.' }, 403);
        const { userId } = payload;
        if (!userId) return json({ error: 'Thiếu userId.' }, 400);
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      // ---------------------------------------------------------------------
      // ADMIN: đọc email (hiển thị tên đăng nhập)
      // ---------------------------------------------------------------------
      case 'get-user-email': {
        if (!(await getCallerIfAdmin(req))) return json({ error: 'Chỉ admin được phép.' }, 403);
        const { userId } = payload;
        if (!userId) return json({ error: 'Thiếu userId.' }, 400);
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, email: data.user?.email ?? '' });
      }

      default:
        return json({ error: `Hành động không hợp lệ: ${action}` }, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Lỗi không xác định.' }, 500);
  }
});
