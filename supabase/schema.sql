-- =============================================================================
-- FESTMANAGER — SUPABASE SCHEMA
-- supabase/schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. USERS  (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text        not null,
  role        text        not null check (role in ('admin', 'manager', 'staff')),
  status      text        not null default 'active' check (status in ('active', 'pending')),
  created_at  timestamptz not null default now()
);

create index if not exists users_role_idx on public.users(role);

-- ---------------------------------------------------------------------------
-- 2. EVENTS / FESTIVALS
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id                  bigint      generated always as identity primary key,
  name                text        not null,
  date                text        not null,
  end_date            text,
  location            text        not null,
  status              text        not null
    check (status in ('Lên kế hoạch', 'Sắp tới', 'Đang diễn ra', 'Đã hoàn thành')),
  income              numeric     not null default 0,
  expenses            jsonb       not null default '{}'::jsonb,
  inventory_reported  jsonb       not null default '[]'::jsonb,
  booth               text        not null default '',
  hygiene_permit      text        not null default 'Chưa có',
  organizer_contact   text        not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists events_status_idx on public.events(status);
create index if not exists events_date_idx   on public.events(date);

-- ---------------------------------------------------------------------------
-- 3. STAFF MEMBERS
-- ---------------------------------------------------------------------------
create table if not exists public.staff_members (
  id          bigint      generated always as identity primary key,
  user_id     uuid        references public.users(id) on delete set null,
  name        text        not null,
  dob         text        not null,
  city        text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists staff_user_id_idx on public.staff_members(user_id);

-- ---------------------------------------------------------------------------
-- 4. CONTRACTS
-- ---------------------------------------------------------------------------
create table if not exists public.contracts (
  id          bigint      generated always as identity primary key,
  staff_id    bigint      not null references public.staff_members(id) on delete cascade,
  date        text        not null,
  url         text        not null,
  file_name   text,
  created_at  timestamptz not null default now()
);

create index if not exists contracts_staff_id_idx on public.contracts(staff_id);

-- ---------------------------------------------------------------------------
-- 5. EVENT_STAFF (junction)
-- ---------------------------------------------------------------------------
create table if not exists public.event_staff (
  event_id    bigint not null references public.events(id) on delete cascade,
  staff_id    bigint not null references public.staff_members(id) on delete cascade,
  primary key (event_id, staff_id)
);

create index if not exists event_staff_staff_id_idx on public.event_staff(staff_id);

-- ---------------------------------------------------------------------------
-- 6. ENUM TYPES  (dùng DO block vì PostgreSQL không có CREATE TYPE IF NOT EXISTS)
-- ---------------------------------------------------------------------------
do $$ begin
  create type inventory_unit_enum as enum (
    'kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'xiên', 'thùng', 'phần'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type inventory_log_action_enum as enum ('set', 'created');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type expense_category_enum as enum (
    'Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type expense_status_enum as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 7. INVENTORY ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_items (
  id          bigint               generated always as identity primary key,
  name        text                 not null,
  current     numeric              not null default 0,
  threshold   numeric              not null default 0,
  unit        inventory_unit_enum  not null default 'kg',
  created_at  timestamptz          not null default now(),
  updated_at  timestamptz          not null default now()
);

create index if not exists inventory_name_idx on public.inventory_items(name);

-- ---------------------------------------------------------------------------
-- 8. INVENTORY LOGS
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_logs (
  id              bigint                     generated always as identity primary key,
  item_id         bigint                     not null references public.inventory_items(id) on delete cascade,
  item_name       text                       not null,
  qty             numeric                    not null,
  unit            inventory_unit_enum        not null,
  action          inventory_log_action_enum  not null,
  festival_id     bigint                     references public.events(id) on delete set null,
  festival_name   text                       not null default '',
  timestamp       text                       not null,
  submitted_by    text                       not null,
  created_at      timestamptz                not null default now()
);

create index if not exists inv_logs_item_id_idx     on public.inventory_logs(item_id);
create index if not exists inv_logs_festival_id_idx on public.inventory_logs(festival_id);

-- ---------------------------------------------------------------------------
-- 9. EXPENSES / RECEIPTS
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id          bigint                  generated always as identity primary key,
  staff_id    bigint                  not null references public.staff_members(id) on delete cascade,
  staff_name  text                    not null,
  festival_id bigint                  not null references public.events(id) on delete cascade,
  type        expense_category_enum   not null,
  amount      numeric                 not null check (amount >= 0),
  date        text                    not null,
  image_url   text                    not null default '',
  status      expense_status_enum     not null default 'pending',
  created_at  timestamptz             not null default now(),
  updated_at  timestamptz             not null default now()
);

create index if not exists expenses_staff_id_idx    on public.expenses(staff_id);
create index if not exists expenses_festival_id_idx on public.expenses(festival_id);
create index if not exists expenses_status_idx      on public.expenses(status);

-- ---------------------------------------------------------------------------
-- 10. AUTO-UPDATE updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create or replace trigger inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

create or replace trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.events            enable row level security;
alter table public.staff_members     enable row level security;
alter table public.contracts         enable row level security;
alter table public.event_staff       enable row level security;
alter table public.inventory_items   enable row level security;
alter table public.inventory_logs    enable row level security;
alter table public.expenses          enable row level security;

-- Helper: kiểm tra user hiện tại có role admin không
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: kiểm tra user hiện tại có role manager (đã duyệt) không
create or replace function public.is_manager()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'manager' and status = 'active'
  );
$$;

-- Helper: lấy staff_member id của user hiện tại
create or replace function public.my_staff_id()
returns bigint language sql security definer stable as $$
  select id from public.staff_members
  where user_id = auth.uid()
  limit 1;
$$;

-- ── users ───────────────────────────────────────────────────────────────────
create policy "users: admin full access"
  on public.users for all
  using (public.is_admin());

create policy "users: manager read all"
  on public.users for select
  using (public.is_manager());

create policy "users: read own"
  on public.users for select
  using (id = auth.uid());

create policy "users: update own"
  on public.users for update
  using (id = auth.uid());

-- ── events ──────────────────────────────────────────────────────────────────
create policy "events: admin full access"
  on public.events for all
  using (public.is_admin());

create policy "events: manager read all"
  on public.events for select
  using (public.is_manager());

create policy "events: staff read assigned"
  on public.events for select
  using (
    public.is_admin()
    or public.is_manager()
    or exists (
      select 1 from public.event_staff
      where event_id = events.id and staff_id = public.my_staff_id()
    )
  );

-- ── staff_members ────────────────────────────────────────────────────────────
create policy "staff_members: admin full access"
  on public.staff_members for all
  using (public.is_admin());

create policy "staff_members: manager read all"
  on public.staff_members for select
  using (public.is_manager());

create policy "staff_members: read own"
  on public.staff_members for select
  using (user_id = auth.uid());

-- ── contracts ────────────────────────────────────────────────────────────────
create policy "contracts: admin full access"
  on public.contracts for all
  using (public.is_admin());

create policy "contracts: manager read all"
  on public.contracts for select
  using (public.is_manager());

create policy "contracts: staff read own"
  on public.contracts for select
  using (staff_id = public.my_staff_id());

-- ── event_staff ──────────────────────────────────────────────────────────────
create policy "event_staff: admin full access"
  on public.event_staff for all
  using (public.is_admin());

create policy "event_staff: manager read all"
  on public.event_staff for select
  using (public.is_manager());

create policy "event_staff: staff read own"
  on public.event_staff for select
  using (staff_id = public.my_staff_id());

-- ── inventory_items ──────────────────────────────────────────────────────────
create policy "inventory_items: admin full access"
  on public.inventory_items for all
  using (public.is_admin());

create policy "inventory_items: staff read"
  on public.inventory_items for select
  using (true);

-- ── inventory_logs ───────────────────────────────────────────────────────────
create policy "inventory_logs: admin full access"
  on public.inventory_logs for all
  using (public.is_admin());

create policy "inventory_logs: staff read"
  on public.inventory_logs for select
  using (true);

create policy "inventory_logs: staff insert own"
  on public.inventory_logs for insert
  with check (submitted_by = (
    select name from public.staff_members where id = public.my_staff_id()
  ));

-- ── expenses ─────────────────────────────────────────────────────────────────
create policy "expenses: admin full access"
  on public.expenses for all
  using (public.is_admin());

create policy "expenses: manager read all"
  on public.expenses for select
  using (public.is_manager());

create policy "expenses: staff read own"
  on public.expenses for select
  using (staff_id = public.my_staff_id());

create policy "expenses: staff insert own"
  on public.expenses for insert
  with check (staff_id = public.my_staff_id());

create policy "expenses: staff update own pending"
  on public.expenses for update
  using (staff_id = public.my_staff_id() and status = 'pending');
