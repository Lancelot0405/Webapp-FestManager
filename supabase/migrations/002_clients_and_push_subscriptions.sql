-- =============================================================================
-- MIGRATION 002: clients & push_subscriptions tables (+ RLS)
-- Run this in the Supabase SQL editor.
--
-- Lý do: code (src/lib/db.ts, src/context/AppContext.tsx, src/hooks/
-- usePushNotifications.ts) đọc/ghi 2 bảng `clients` và `push_subscriptions`
-- nhưng schema.sql chưa định nghĩa chúng → query có thể fail và không có RLS
-- bảo vệ dữ liệu. Migration này bổ sung 2 bảng kèm chính sách RLS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CLIENTS  (đối tác / đơn vị tổ chức)
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id            bigint      generated always as identity primary key,
  name          text        not null,
  contact_name  text        not null default '',
  phone         text        not null default '',
  email         text        not null default '',
  city          text        not null default '',
  notes         text        not null default '',
  event_ids     bigint[]    not null default '{}',
  created_at    timestamptz not null default now()
);

alter table public.clients enable row level security;

-- Admin toàn quyền; manager xem; chỉ admin được tạo/sửa/xóa.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'clients' and policyname = 'clients: admin full access') then
    create policy "clients: admin full access"
      on public.clients for all
      using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'clients' and policyname = 'clients: manager read all') then
    create policy "clients: manager read all"
      on public.clients for select
      using (public.is_manager());
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. PUSH_SUBSCRIPTIONS  (Web Push endpoints theo từng user)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id          bigint      generated always as identity primary key,
  user_id     uuid        references auth.users(id) on delete cascade,
  endpoint    text        not null unique,
  keys        jsonb       not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Mỗi user chỉ quản lý subscription của chính mình; admin xem được tất cả
-- (để Edge Function/server gửi push có thể truy vấn — nếu dùng service role
-- thì RLS được bypass, nhưng vẫn nên có policy admin cho an toàn).
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'push: insert own') then
    create policy "push: insert own"
      on public.push_subscriptions for insert
      with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'push: update own') then
    create policy "push: update own"
      on public.push_subscriptions for update
      using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'push: read own') then
    create policy "push: read own"
      on public.push_subscriptions for select
      using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'push: delete own') then
    create policy "push: delete own"
      on public.push_subscriptions for delete
      using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'push: admin read all') then
    create policy "push: admin read all"
      on public.push_subscriptions for select
      using (public.is_admin());
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Đồng bộ ràng buộc status của users với migration 001
--    (schema.sql gốc thiếu 'rejected' — thêm cho nhất quán nếu chưa có)
-- ---------------------------------------------------------------------------
alter table public.users
  drop constraint if exists users_status_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_status_check'
  ) then
    alter table public.users
      add constraint users_status_check check (status in ('active', 'pending', 'rejected'));
  end if;
end $$;
