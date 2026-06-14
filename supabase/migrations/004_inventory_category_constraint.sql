-- 004_inventory_category_constraint.sql
-- Tách kho Nhà hàng / Festival ở mức dữ liệu:
-- chuẩn hoá category cũ và ràng buộc chỉ nhận các giá trị hợp lệ.

-- 1. Chuẩn hoá category legacy: food/equipment (và null) thuộc kho Nhà hàng
update public.inventory_items set category = 'restaurant-food'      where category = 'food'      or category is null;
update public.inventory_items set category = 'restaurant-equipment' where category = 'equipment';

-- 2. Siết cột category: bỏ default ngầm, bắt buộc có giá trị, chỉ nhận giá trị hợp lệ
alter table public.inventory_items alter column category drop default;
alter table public.inventory_items alter column category set not null;

alter table public.inventory_items
  add constraint inventory_items_category_check
  check (category in (
    'restaurant-food', 'restaurant-equipment',
    'festival-food',   'festival-equipment'
  ));
