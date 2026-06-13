-- =============================================================================
-- MIGRATION 003: food_templates table (+ RLS)
-- Run this in the Supabase SQL editor.
--
-- Lý do: FoodNameSelect.tsx và FoodTemplateManager.tsx đọc/ghi bảng
-- `food_templates` để lưu mẫu tên sản phẩm / thiết bị, nhưng bảng này
-- chưa được định nghĩa trong schema.sql → tất cả query đều fail silently.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- food_templates — mẫu tên sản phẩm / thiết bị theo nhóm
-- ---------------------------------------------------------------------------
create table if not exists public.food_templates (
  id          bigint      generated always as identity primary key,
  name        text        not null,
  group_name  text        not null,
  item_type   text        not null check (item_type in ('food', 'equipment')),
  sort_order  integer     not null default 10,
  created_at  timestamptz not null default now()
);

create index if not exists food_templates_item_type_idx  on public.food_templates(item_type);
create index if not exists food_templates_group_name_idx on public.food_templates(group_name);
create index if not exists food_templates_sort_order_idx on public.food_templates(sort_order);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.food_templates enable row level security;

-- Ai cũng có thể xem template (để chọn khi thêm vào kho)
create policy "food_templates: all read"
  on public.food_templates for select
  using (true);

-- Chỉ admin và manager mới được thêm/sửa/xóa
create policy "food_templates: admin and manager write"
  on public.food_templates for insert
  with check (public.is_admin() or public.is_manager());

create policy "food_templates: admin and manager delete"
  on public.food_templates for delete
  using (public.is_admin() or public.is_manager());

create policy "food_templates: admin and manager update"
  on public.food_templates for update
  using (public.is_admin() or public.is_manager());

-- ---------------------------------------------------------------------------
-- Seed data — một số nhóm và sản phẩm mẫu cho food
-- ---------------------------------------------------------------------------
insert into public.food_templates (name, group_name, item_type, sort_order) values
  -- Thực phẩm đông lạnh
  ('Gyoza',           'Đông lạnh',  'food', 10),
  ('Takoyaki',        'Đông lạnh',  'food', 20),
  ('Edamame',         'Đông lạnh',  'food', 30),

  -- Gia vị & nước chấm
  ('Tương cà',        'Gia vị',     'food', 10),
  ('Tương ớt',        'Gia vị',     'food', 20),
  ('Mayonnaise',      'Gia vị',     'food', 30),
  ('Xì dầu',          'Gia vị',     'food', 40),
  ('Dầu mè',          'Gia vị',     'food', 50),

  -- Đồ uống
  ('Nước suối',       'Đồ uống',    'food', 10),
  ('Trà xanh',        'Đồ uống',    'food', 20),
  ('Nước ngọt',       'Đồ uống',    'food', 30),

  -- Nguyên liệu khô
  ('Bột mì',          'Nguyên liệu','food', 10),
  ('Dầu ăn',          'Nguyên liệu','food', 20),
  ('Muối',            'Nguyên liệu','food', 30),
  ('Đường',           'Nguyên liệu','food', 40),

  -- Thiết bị
  ('Găng tay',        'Bảo hộ',     'equipment', 10),
  ('Khẩu trang',      'Bảo hộ',     'equipment', 20),
  ('Tạp dề',          'Bảo hộ',     'equipment', 30),

  ('Hộp đựng thức ăn','Bao bì',     'equipment', 10),
  ('Túi giấy',        'Bao bì',     'equipment', 20),
  ('Nĩa / Dĩa nhựa', 'Bao bì',     'equipment', 30),
  ('Cốc giấy',        'Bao bì',     'equipment', 40),

  ('Bếp điện',        'Thiết bị nấu','equipment', 10),
  ('Nồi chiên',       'Thiết bị nấu','equipment', 20),
  ('Chảo',            'Thiết bị nấu','equipment', 30)
on conflict do nothing;
