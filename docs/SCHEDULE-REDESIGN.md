# Kế hoạch Redesign Tab Sự kiện (Schedule)

> Đồng bộ thiết kế với Inventory & HR redesign. Mobile-first, build sạch trước mỗi commit.

## Bối cảnh
Tab Sự kiện hiện tại: desktop = calendar sidebar + Table; mobile = calendar trên + danh sách dưới;
chi tiết = 5 tab con (Thông tin/Nhân sự/Chi phí/Kho/Hợp đồng); thêm = Modal + FAB. Lọc theo status +
range (ngày/tuần/tháng), **chưa có search**. Mục tiêu: nhiều view mode, chi tiết dạng drawer, thêm
sự kiện đồng bộ toàn app — chất lượng tương đương Google Calendar / Linear / Luma.

## Quyết định đã chốt
- **Breakpoint:** `useIsDesktop(1024)` (đồng bộ Inventory/HR).
- **View modes:** Agenda nhóm theo tháng (mobile chính) · Calendar tháng/tuần · Table desktop nâng cấp. **Không** Kanban.
- **Mở chi tiết:** desktop = **Drawer phải** chứa 5 tab; mobile giữ route/full-screen hiện có.
- **Thêm sự kiện:** mobile = bottom-sheet Modal; desktop = **Drawer phải** (đồng bộ HR).

---

## Phase 1 — View switcher + Agenda (mobile) ✅ a54f5a8
File: `src/components/schedule/Schedule.tsx`

- Thêm view switcher (`ToggleButtonGroup`): **Lịch** / **Danh sách (Agenda)**.
- **Agenda:** nhóm sự kiện theo Tháng (kiểu Luma/iOS Calendar), mỗi sự kiện 1 dòng: tên, ngày, địa điểm, badge status, mini avatar nhân sự. Thay danh sách/grid hiện tại trên mobile.
- Giữ filter status (Chip) + range; thêm `useIsDesktop(1024)` để tách nhánh render.

## Phase 2 — Calendar view tháng/tuần ✅ fa00c7c
File: `src/components/schedule/Schedule.tsx` (+ component con `EventCalendarView.tsx`)

- Dùng HeroUI `Calendar` (`.heroui-docs` → calendar.mdx) — đọc docs trước khi dùng.
- Hiển thị event chip/dot trong ô ngày; click ngày → lọc/scroll tới sự kiện ngày đó.
- Toggle tháng/tuần (tái dùng `rangeMode` hiện có).

## Phase 3 — Table desktop nâng cấp ✅
File: `src/components/schedule/Schedule.tsx`

- Thêm **SearchField** (tên/địa điểm) — áp dụng cho cả Agenda + Table.
- Thêm sort cột bằng `Table.SortableColumnHeader` (tham khảo `InventoryTable.tsx`): Tên, Ngày, Trạng thái.
- Adaptive: mobile = Agenda (date-sorted), desktop (`useIsDesktop(1024)`) = Table sortable; giữ filter status.

## Phase 4 — Chi tiết sự kiện → Drawer (desktop) ✅
File: `src/components/schedule/EventDetail.tsx` + `EventDetailContent.tsx` (mới)

- Tách thân detail → `EventDetailContent` (prop `variant: 'page' | 'drawer'`); `EventDetail` route chỉ lookup + render `variant="page"`.
- Desktop: click row/agenda/calendar mở **Drawer phải** (`DrawerRoot`, placement `right`, `w-[min(44rem,100vw)]`) chứa 5 tab; giữ context list (không đổi route).
- Mobile: `openEvent` vẫn `navigate('/schedule/:id')` full-screen.
- Drawer header dùng nút X (đóng) thay back; giữ nguyên logic export/clone/delete + phân quyền.

## Phase 5 — Thêm sự kiện (Modal / Drawer) ✅
File: `src/components/schedule/AddEventForm.tsx`

- Tách thân form (`formFields` + `footer`) dùng chung; chọn container theo `useIsDesktop()`: Modal bottom-sheet (mobile) / Drawer phải `w-[min(28rem,100vw)]` (desktop).
- Giữ react-hook-form + zod + `computeEventStatus()`; keyboardOffset chỉ áp dụng mobile.

## Phase 6 — Visual polish ✅
- Tách `MiniAvatarGroup` → component dùng chung (Schedule + Calendar).
- Calendar: dot ngày tô màu theo status (success/accent/warning/neutral, ưu tiên status khẩn nhất); thêm avatar group vào dòng sự kiện trong ngày.
- StatusBadge đã đồng bộ toàn bộ view; hover row/card nhất quán.

---

## Tái dùng (không viết mới)
- `useIsDesktop(1024)` — `src/hooks/useIsDesktop.ts`
- `Table.SortableColumnHeader` pattern — `src/components/inventory/InventoryTable.tsx`
- `computeEventStatus()` — `src/lib/eventStatus.ts`
- `StatusBadge` — `src/components/shared/StatusBadge.tsx`
- HeroUI `Calendar`, `Drawer` — đọc `.heroui-docs/react/components/{calendar,drawer}.mdx` trước khi code

## Kiểm thử
- `npm run build` sạch trước mỗi commit (bắt buộc).
- Test thủ công: mobile (PWA) Agenda + Calendar trước → desktop Table + Drawer; kiểm phân quyền admin/manager/staff (staff chỉ thấy sự kiện được phân công).
- Đánh dấu ✅ + commit từng phase trong file này khi hoàn thành (theo convention Inventory).
