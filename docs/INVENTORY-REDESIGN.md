# Kế hoạch: Thiết kế lại Tab Kho hàng (Inventory Redesign)

## Context

Giao diện kho hàng hiện tại có 4 vấn đề chính:
1. **Nested tabs 2 cấp** (main tab Restaurant/Festival × sub tab Thực phẩm/Thiết bị/Lịch sử) — khó điều hướng, dễ bị lạc
2. **Card grid 2 cột** trên mobile — tên bị truncate, thiếu thông tin quan trọng
3. **Lọc yếu** — chỉ có search text + sort, không có filter theo trạng thái/đơn vị
4. **Chỉnh số lượng phải qua modal** — quá nhiều bước cho tác vụ thường xuyên nhất

Target: tối ưu cả **mobile lẫn tablet/desktop ngang nhau**.

---

## Phân tích 3 phương án từ industry

### Phương án A — "Shopify Inventory" (Filter chips + List view)
> Dùng bởi: Shopify Admin, Square POS, Toast POS

- Xoá nested tabs, thay bằng **Segment control** (Restaurant | Festival) ở trên cùng
- Bên dưới: **Filter chips horizontal scroll** → [Tất cả] [🔴 Thiếu hàng] [🟡 Cảnh báo] [🟢 Đủ hàng] + [Thực phẩm] [Thiết bị]
- Layout: **Single-column list** trên mobile (dense rows), **table** trên desktop
- Inline +/− controls trực tiếp trên mỗi row
- **Pros:** Học nhanh, search + filter mạnh, ít click
- **Cons:** Mất cảm giác "category rõ ràng" cho user quen với tabs

### Phương án B — "Linear/Notion" (Sidebar category + Dense table)
> Dùng bởi: Linear, Notion, Airtable, Retool

- Desktop: **Left sidebar cố định** (120px) chứa category tree → click để filter
- Mobile: Sidebar thu vào → **Drawer từ trái** pull ra
- Main area: **Table view** với cột sortable (click header)
- Inline edit trực tiếp trên cell
- **Pros:** Rất mạnh trên desktop, scalable khi data lớn
- **Cons:** Phức tạp hơn để implement, mobile sidebar kém tự nhiên

### Phương án C — Hybrid "Square/Shopify Mobile + Linear Desktop" ✅ KHUYẾN NGHỊ
> Dùng bởi: Square for Restaurants, Clover POS, Shopify (mobile app)

Kết hợp ưu điểm của cả hai: **adaptive layout** theo breakpoint.

**Mobile (< 768px):**
```
┌─────────────────────────────────────┐
│ [🍽 Nhà hàng]  [🎪 Festival]       │ ← Segment/ToggleButtonGroup
├─────────────────────────────────────┤
│ 🔴 3  🟡 2  🟢 18  │ + Thêm       │ ← Summary mini + FAB
├─────────────────────────────────────┤
│ [Tất cả][Thiếu hàng][Thực phẩm]... │ ← Filter chips (scroll ngang)
├─────────────────────────────────────┤
│ 🔍 Tìm kiếm...          [⊞ Lọc]   │ ← SearchField + Filter button
├─────────────────────────────────────┤
│ 🔴  Thịt heo          12 kg   [↑↓] │ ← List row với inline stepper
│ 🟡  Rau cải            3 kg   [↑↓] │
│ 🟢  Nước suối         50 chai [↑↓] │
│     ← swipe left: ✏️ 🗑️           │ ← Swipe actions
└─────────────────────────────────────┘
```

**Tablet/Desktop (≥ 768px):**
```
┌──────────────┬─────────────────────────────────────────┐
│ Nhà hàng     │  🔍 Tìm...  [Trạng thái ▾] [Loại ▾]  │
│  > Thực phẩm │ ─────────────────────────────────────── │
│  > Thiết bị  │  Tên ↑    │ Số lượng │ Đơn vị │ Status │
│ Festival     │ ────────── │ ──────── │ ─────── │ ────── │
│  > Thực phẩm │  Thịt heo  │  [12] ↑↓│  kg     │  🔴   │
│  > Thiết bị  │  Rau cải   │   [3] ↑↓│  kg     │  🟡   │
│ ─────────── │  Nước suối │  [50] ↑↓│  chai   │  🟢   │
│ 📋 Lịch sử  │                                          │
└──────────────┴─────────────────────────────────────────┘
```

---

## Implementation Plan (Phương án C)

### Bước 1: Cấu trúc layout mới

**File cần tạo/sửa:**
- `src/components/inventory/Inventory.tsx` — đổi root layout, inject `useIsDesktop`
- `src/components/inventory/InventoryLayout.tsx` *(mới)* — responsive shell (sidebar vs. top-nav)
- `src/components/inventory/InventorySidebar.tsx` *(mới)* — desktop left nav
- `src/components/inventory/InventoryFilterBar.tsx` *(mới)* — mobile filter chips + search

Thay thế:
- `InventoryTabs.tsx` (2-cấp tabs) → **`InventoryNavigation.tsx`**: mobile dùng `ToggleButtonGroup` (HeroUI), desktop render vào sidebar

### Bước 2: Chuyển ItemList sang List view

**File cần sửa:**
- `src/components/inventory/InventoryItemList.tsx` — bỏ grid, dùng `<ul>` với `divide-y`
- `src/components/inventory/InventoryItemRow.tsx` — redesign thành horizontal row:
  - Status dot (color) | Tên (flex-1, không truncate) | Số lượng [−][value][+] | Đơn vị | Action menu
  - Desktop: thêm cột Threshold, Category

**Inline quantity edit:**
- Thêm `[−]` / `[+]` buttons trực tiếp trên row → gọi `useUpdateInventoryItem` mutation
- Debounce 600ms để tránh spam API
- Optimistic update qua TanStack Query

### Bước 3: Swipe actions (mobile)

**File cần tạo:**
- `src/components/shared/SwipeableRow.tsx` — wrapper dùng Framer Motion `drag="x"` với `dragConstraints`
- Swipe left: reveal [✏️ Sửa] [🗑️ Xoá] buttons
- Kết hợp `AnimatePresence` cho smooth reveal

### Bước 4: Filter chips nâng cao

**File cần sửa/tạo:**
- `src/components/inventory/InventoryFilterBar.tsx`:
  - `TagGroup` (HeroUI) horizontal scroll với `selectionMode="multiple"`
  - Chips trạng thái: [🔴 Thiếu hàng] [🟡 Cảnh báo] [🟢 Đủ hàng]
  - Chips loại: [Thực phẩm] [Thiết bị] — thay thế sub-tab
- `src/components/inventory/useInventoryFilters.ts` — mở rộng thêm `statusFilter`, `categoryFilter`

### Bước 5: Desktop table view

**File cần tạo:**
- `src/components/inventory/InventoryTable.tsx` — HeroUI `<Table>` với:
  - Columns: Tên | Số lượng (inline edit) | Đơn vị | Ngưỡng | Trạng thái | Actions
  - Sort bằng click header (tái dùng sort logic trong `useInventoryFilters`)
  - Row click → mở drawer chi tiết

### Bước 6: Adaptive rendering

Trong `Inventory.tsx`:
```tsx
const isDesktop = useIsDesktop(768); // md breakpoint

return isDesktop
  ? <InventoryDesktopLayout />   // sidebar + table
  : <InventoryMobileLayout />;   // top nav + list + swipe
```

---

## Files bị ảnh hưởng

| File | Hành động |
|------|-----------|
| `inventory/Inventory.tsx` | Refactor root layout, thêm adaptive rendering |
| `inventory/InventoryTabs.tsx` | Thay bằng `InventoryNavigation.tsx` |
| `inventory/InventoryToolbar.tsx` | Merge vào `InventoryFilterBar.tsx` |
| `inventory/InventoryItemList.tsx` | Chuyển grid → list |
| `inventory/InventoryItemRow.tsx` | Redesign thành dense row + inline stepper |
| `inventory/useInventoryFilters.ts` | Thêm statusFilter, categoryFilter |
| `shared/SwipeableRow.tsx` | Tạo mới |
| `inventory/InventoryTable.tsx` | Tạo mới (desktop) |
| `inventory/InventorySidebar.tsx` | Tạo mới (desktop) |
| `inventory/InventoryFilterBar.tsx` | Tạo mới (mobile) |

---

## HeroUI components sẽ dùng

- `ToggleButtonGroup` — segment control (Restaurant/Festival)
- `TagGroup` — filter chips có `selectionMode="multiple"`
- `Table` — desktop table view
- `NumberField` — inline quantity stepper
- Giữ nguyên: `Drawer`, `Modal`, `Card`, `SearchField`

---

## Phân kỳ thực hiện

| Phase | Nội dung | Ưu tiên | Trạng thái |
|-------|----------|---------|------------|
| 1 | Xoá nested tabs → Filter chips + Segment control | Cao | ✅ Xong (`f309e91`) |
| 2 | Chuyển grid card → List view + inline +/− | Cao | ⬜ Chưa làm |
| 3 | Desktop: Sidebar + Table view | Trung bình | ⬜ Chưa làm |
| 4 | Swipe actions mobile | Thấp (nice-to-have) | ⬜ Chưa làm |

Phase 1 + 2 ship trước → mobile đã tốt hơn rõ rệt. Phase 3 + 4 làm sau.

---

## Verification

1. `npm run build` — pass không lỗi TypeScript
2. Mobile (Chrome DevTools iPhone 14):
   - Filter chips scroll ngang
   - Inline +/− update không reload page
   - Swipe actions hoạt động
3. Desktop (≥768px):
   - Sidebar visible, click category filter đúng
   - Table sort by column header
4. Cả light + dark mode
5. `npm run test` — không regression
