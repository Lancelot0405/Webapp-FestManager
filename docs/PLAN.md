# Kế hoạch cải tiến FestManager

> Branch: `final-gemini`  
> Ngày lập: 13-06-2026  
> Tổng: **13 tasks** (12 Fix + 1 Redesign)

---

## 🔴 Bug Fixes

### Fix 1 — Ẩn TanStack Query Devtools
- **File:** `src/main.tsx`
- **Vấn đề:** DevTools panel hiện ra trong môi trường production/staging
- **Fix:** Xóa dòng `{import.meta.env.DEV && <ReactQueryDevtools ... />}`

---

### Fix 2 — Sidebar light mode bị hòa nền
- **File:** `src/components/layout/Sidebar.tsx`
- **Vấn đề:** `bg-background` trùng màu nền trang, active item `bg-default-200/50` không đủ contrast
- **Fix:**
  - `bg-background` → `bg-content1`
  - Active item: `bg-primary/10 text-primary` thay `bg-default-200/50`

---

## 🟡 Layout & Navigation

### Fix 3 — UserSheet trên PC hiện sai vị trí
- **File:** `src/components/layout/UserSheet.tsx`, `src/components/layout/Sidebar.tsx`
- **Vấn đề:** Sheet bottom-up hiện ở góc bottom-left trên desktop (`md:bottom-3 md:left-3`)
- **Fix:** Trên `md+` dùng HeroUI `Popover` (`placement="right-start"`) gắn vào nút avatar trong Sidebar. Bottom sheet chỉ giữ cho mobile.

---

### Fix 4 — Auto-hide Sidebar trên PC
- **File:** `src/components/layout/Sidebar.tsx`, `src/components/layout/Layout.tsx`
- **Vấn đề:** Sidebar luôn hiện, không có cách thu gọn trên desktop
- **Fix:**
  - Thêm toggle button thu/mở sidebar
  - State `isCollapsed` lưu vào `localStorage`
  - Collapsed = `w-16` (icon only), Expanded = `w-64`
  - CSS transition smooth

---

### Fix 5 — Di chuyển action buttons xuống bottom
- **Files:**
  - `src/components/inventory/Inventory.tsx` — nút Import + Thêm
  - `src/components/hr/HRGlobal.tsx` — nút Thêm nhân viên
  - `src/components/schedule/Schedule.tsx` — nút Thêm sự kiện
  - `src/components/finance/Finance.tsx` + `FinanceExport.tsx` — nút Xuất Excel
- **Vấn đề:** Các nút "Thêm" hiện nằm top-right trên desktop, FAB riêng trên mobile — không nhất quán
- **Fix:** Bỏ `hidden md:flex justify-end` ở trên. Tất cả dùng pattern `fixed bottom-24 right-4 z-30` (mobile) + `md:bottom-8` (desktop). Nhiều button thì stack dọc `flex-col gap-2`

---

## 🟢 Migrate HeroUI Components

### Fix 6 — InventoryTabs → HeroUI Tabs
- **File:** `src/components/inventory/InventoryTabs.tsx`
- **Vấn đề:** Tab Nhà hàng / Festival dùng `Button` + `border-b-2` custom
- **Fix:** Thay bằng HeroUI `Tabs` component (controlled với `selectedKey`)

---

### Fix 7 — EventDetail tab bar → HeroUI Tabs
- **File:** `src/components/schedule/EventDetail.tsx`
- **Vấn đề:** Tab Info / Nhân sự / Chi phí / Kho / Hợp đồng dùng `Button` custom
- **Fix:** Thay bằng HeroUI `Tabs`. Giữ nguyên layout 2 cột desktop (panel trái + tabs phải)

---

### Fix 8 — Migrate AddEventForm
- **File:** `src/components/schedule/AddEventForm.tsx`
- **Vấn đề:** Dùng `GlassInput` wrapper custom + raw date input, không có Modal
- **Fix:**
  - `GlassInput` → HeroUI `TextField`
  - `<input type="date">` → HeroUI `DatePicker`
  - Bọc bằng HeroUI `Modal`

---

### Fix 9 — Migrate AddStaffForm
- **File:** `src/components/hr/AddStaffForm.tsx`
- **Vấn đề:** Button selector (role/department/type) tự viết, date input raw, không có Modal
- **Fix:**
  - `GlassInput` → HeroUI `TextField`
  - `<input type="date">` → HeroUI `DatePicker`
  - Button role/department/type selector → HeroUI `ToggleButtonGroup` (single-select)
  - Bọc bằng HeroUI `Modal`

---

### Fix 10 — Migrate InventoryAddModal
- **File:** `src/components/inventory/InventoryAddModal.tsx`
- **Vấn đề:** Dùng low-level `ModalRoot/ModalBackdrop/ModalContainer` tự lắp ráp, `NumberPicker` và `FoodNameSelect` là custom components
- **Fix:**
  - Modal wrapper → HeroUI `Modal` chuẩn
  - `FoodNameSelect` → HeroUI `Accordion` + `RadioGroup` bên trong
  - `NumberPicker` → HeroUI `NumberField` + `TagGroup` cho preset chips
  - `GlassSelect` → HeroUI `Select`

---

### Fix 11 — Migrate FoodTemplateManager
- **File:** `src/components/inventory/FoodTemplateManager.tsx`
- **Vấn đề:** Modal tự viết bằng raw div fixed overlay, accordion nhóm dùng Button toggle custom, chips item dùng raw div
- **Fix:**
  - Modal wrapper → HeroUI `Modal`
  - Accordion nhóm → HeroUI `Accordion` (controlled `expandedKeys`)
  - Item chips có nút xóa → HeroUI `TagGroup` với `onRemove`
  - Input → HeroUI `TextField`
  - Spinner loading → HeroUI `Spinner`

---

### Fix 12 — Migrate Dashboard tables → HeroUI Table
- **File:** `src/components/dashboard/Dashboard.tsx`
- **Vấn đề:** 3 bảng dữ liệu dùng raw div + CSS grid giả table:
  - `EventsTable` (tab Tổng quan + StaffDashboard) — Sự kiện / Ngày / Địa điểm / Nhân viên / Trạng thái
  - `HRTab` table — Nhân viên / Thành phố / Loại hợp đồng / Sự kiện
  - `InventoryTab` table — Tên hàng / Hiện tại / Ngưỡng / Trạng thái
- **Fix:**
  - `TableHeader` + `TableColumn` thay header row div
  - `TableBody` + `TableRow` + `TableCell` thay row divs
  - `SearchField` thay raw `<input>` search
  - `emptyContent` prop cho empty state
  - Giữ nguyên `StaffAvatarGroup` và `StatusBadge` nhét vào `TableCell`

---

## 🔵 Redesign

### Redesign 1 — Schedule trang danh sách
- **File:** `src/components/schedule/Schedule.tsx`
- **Vấn đề:** Hiện là grid card đơn giản, không có calendar view
- **Layout mới:**
  - **Desktop 2 cột:** Trái = HeroUI `Calendar` (controlled) + `ToggleButtonGroup` Tuần/Tháng | Phải = danh sách `Card` events theo ngày được chọn
  - **Mobile 1 cột:** Calendar thu gọn + list bên dưới
  - Event cards: màu theo status, có giờ, địa điểm, avatar staff (`AvatarGroup`)
  - Filter status dùng `Chip` group
  - Bỏ hoàn toàn: time grid dọc, đường kẻ giờ hiện tại, event overlap layout

---

## Thứ tự triển khai

| # | Task | File(s) | Độ phức tạp |
|---|---|---|---|
| 1 | Fix 1 — Devtools | `main.tsx` | Thấp |
| 2 | Fix 2 — Sidebar light mode | `Sidebar.tsx` | Thấp |
| 3 | Fix 5 — Buttons xuống bottom | 4 files | Thấp |
| 4 | Fix 6 — InventoryTabs | `InventoryTabs.tsx` | Thấp |
| 5 | Fix 7 — EventDetail Tabs | `EventDetail.tsx` | Thấp |
| 6 | Fix 3 — UserSheet Popover | `UserSheet.tsx`, `Sidebar.tsx` | Trung bình |
| 7 | Fix 4 — Sidebar collapse | `Sidebar.tsx`, `Layout.tsx` | Trung bình |
| 8 | Fix 8 — AddEventForm | `AddEventForm.tsx` | Trung bình |
| 9 | Fix 9 — AddStaffForm | `AddStaffForm.tsx` | Trung bình |
| 10 | Fix 10 — InventoryAddModal | `InventoryAddModal.tsx` | Trung bình |
| 11 | Fix 11 — FoodTemplateManager | `FoodTemplateManager.tsx` | Trung bình |
| 12 | Fix 12 — Dashboard Tables | `Dashboard.tsx` | Trung bình |
| 13 | Redesign 1 — Schedule | `Schedule.tsx` | Cao |

> **Quy tắc:** `npm run build` phải pass trước mỗi commit.
