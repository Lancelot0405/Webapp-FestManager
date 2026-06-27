# Kế hoạch Redesign Tab Nhân sự (HR)

> Đồng bộ thiết kế với Inventory redesign đã hoàn thành. Mobile-first, build sạch trước mỗi commit.

## Bối cảnh
Tab Nhân sự hiện tại: danh sách dùng `grid-cols-2` cố định (xấu trên cả mobile lẫn desktop), trang
profile dùng 1 nút "Chỉnh sửa" mở khóa toàn bộ form. Mục tiêu: adaptive table/list, tabbed profile,
edit theo từng khối — chất lượng tương đương SaaS lớn (Gusto/Rippling/Deel).

## Quyết định đã chốt
- **Breakpoint:** `useIsDesktop(1024)` (đồng bộ Inventory).
- **Nút Thêm NV:** mobile = FAB toàn cục (`useFABRegister`); desktop = nút ở header, **không** FAB.
- **Window Thêm NV:** mobile = bottom-sheet Modal (giữ nguyên); desktop = **Drawer trượt phải**.
- **Bỏ khỏi phạm vi:** chỉ số "hợp đồng sắp hết hạn" (schema `Contract` không có ngày hết hạn).

---

## Phase 1 — HRGlobal (danh sách nhân viên) ✅
File: `src/components/hr/HRGlobal.tsx`

- Thêm `useIsDesktop(1024)` → render 2 nhánh.
- **Mobile:** list 1 cột, mỗi dòng bọc `SwipeableRow` (`src/components/shared/SwipeableRow.tsx`) → [Sửa]/[Xoá]. Thay `grid grid-cols-2` (HRGlobal.tsx:80). Tăng cỡ chữ, chống tràn chữ.
- **Desktop:** HeroUI `<Table>` + `Table.SortableColumnHeader` (tham khảo `src/components/inventory/InventoryTable.tsx`). Cột: Avatar+Tên, Bộ phận, Thành phố, Loại HĐ, Số sự kiện, Hành động.
- **Stats cards:** tái dùng pattern `src/components/inventory/InventorySummary.tsx` — Tổng / Nhân viên cứng / Part-time (data từ `useStaffQuery`).
- **Filter:** giữ SearchField + ToggleButtonGroup loại HĐ; thêm Select Bộ phận (restaurant/festival/both).
- Giữ section **Pending registrations** (HRGlobal.tsx:132) cho admin.
- Nút Thêm: FAB (mobile) + nút header (desktop), không trùng nhau.

## Phase 2 — Window Thêm NV
File: `src/components/hr/AddStaffForm.tsx`

- Tách thân form thành component dùng chung.
- Chọn container theo `useIsDesktop(1024)`: Modal bottom-sheet (mobile) / Drawer placement `right` (desktop, HeroUI `Drawer`).
- Giữ nguyên logic react-hook-form + zod + submit hiện tại.

## Phase 3 — StaffProfile → Tabs
File: `src/components/hr/StaffProfile.tsx`

- HeroUI `<Tabs>`: **Tổng quan / Cá nhân / Tài liệu / Chi phí**.
- **Edit-per-block:** state edit riêng cho Basic Info, Contact, Account Security (thay 1 nút lớn ở StaffProfile.tsx:259).
- **Giữ phân quyền:** field admin-only (role, department, staffType) + Account Security giữ guard hiện có.
- Tài liệu tab: gom Carte Vitale / Titre de Séjour + contracts (logic upload giữ nguyên).
- Chi phí tab: di chuyển nguyên khối filter expenses hiện có (StaffProfile.tsx:538).

## Phase 4 — Visual polish
- Badge trạng thái HeroUI (success/warning/danger), hover nhẹ trên row/card.

---

## Tái dùng (không viết mới)
- `useIsDesktop(1024)` — `src/hooks/useIsDesktop.ts`
- `SwipeableRow` — `src/components/shared/SwipeableRow.tsx`
- Pattern `InventorySummary`, `InventoryTable` (SortableColumnHeader)

## Kiểm thử
- `npm run build` sạch trước mỗi commit (bắt buộc).
- Test thủ công: mobile (PWA) trước → desktop; kiểm phân quyền admin / manager / staff.
- Đánh dấu ✅ + commit từng phase trong file này khi hoàn thành (theo convention Inventory).
