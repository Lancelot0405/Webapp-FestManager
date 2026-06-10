# HeroUI Update — Tiến độ Migration

**Branch:** `claude/nifty-mccarthy-q5r9gz`  
**Mục tiêu:** Nâng cấp toàn bộ UI sang HeroUI v3 + Tailwind CSS v4, design mới hoàn toàn.

**Chiến lược triển khai:** PWA (mobile-first) trước → PC/tablet sau.  
Mỗi phase ưu tiên hoàn thiện trải nghiệm mobile (bottom nav, safe-area, touch target) trước khi bổ sung responsive cho màn lớn.

---

## ✅ Phase 0 — Cài đặt & Cấu hình
**Trạng thái:** HOÀN THÀNH  
**Commit:** `74a85f5`

### Đã làm:
- Upgrade `tailwindcss` v3 → **v4.3.0** với `@tailwindcss/vite` plugin
- Cài `@heroui/react` **v3.1.0** + `framer-motion`
- Xóa `tailwind.config.js` — TW v4 dùng CSS-first config
- Cập nhật `vite.config.ts`: thêm `@tailwindcss/vite` plugin (không cần postcss cho TW nữa)
- Cập nhật `postcss.config.js`: xóa tailwind/autoprefixer plugins

### Thay đổi file:
- `vite.config.ts` — thêm `@tailwindcss/vite`
- `postcss.config.js` — làm trống
- `tailwind.config.js` — **đã xóa**

---

## ✅ Phase 1 — UI Primitives (`src/components/ui/`)
**Trạng thái:** HOÀN THÀNH  
**Commit:** `74a85f5`

### Đã làm:
- Migrate `src/index.css`:
  - `@tailwind base/components/utilities` → `@import "tailwindcss"` + `@import "@heroui/styles"`
  - Chuyển toàn bộ design tokens sang `@theme {}` block (màu brand/indigo/herb/slate, shadows, animations, gradients)
  - Giữ CSS variables (`:root` / `.dark`) cho backward-compat với code cũ chưa migrate
- Rewrite `src/components/ui/button.tsx`:
  - Dùng HeroUI v3 `Button` với adapter backward-compat
  - Map variants: `default→primary`, `destructive→danger`, `outline→outline`, `ghost→ghost`
  - Hỗ trợ `loading`, `isIconOnly`, `asChild` cũ
- Rewrite `src/components/ui/input.tsx`:
  - Dùng HeroUI v3 `TextField` + `Label` + `Input` + `FieldError` + `Description`
  - Giữ props API cũ: `label`, `error`, `hint`, `icon`
- Rewrite `src/components/ui/dialog.tsx`:
  - Dùng HeroUI v3 `Modal.Root` + `Modal.Backdrop` + `Modal.Container` + `Modal.Dialog`
  - Backward-compat: nhận prop `open` (Radix style) hoặc `isOpen` (HeroUI style)
  - `position="bottom"` → `placement="bottom"` trên container
- Rewrite `src/components/ui/skeleton.tsx`:
  - Dùng HeroUI v3 `Skeleton`, giữ wrappers `CardSkeleton`, `RowSkeleton`, `SkeletonList`

### Test kết quả:
- ✅ Build thành công (`npm run build`)
- ✅ 33/33 tests pass (`npm test`)

---

## ✅ Phase 2 — Shared + Layout
**Trạng thái:** HOÀN THÀNH  
**Commit:** `2907015`

### Đã làm:
- `StatusBadge.tsx`: `<span>` → HeroUI `Chip` (variant=soft, color map EventStatus/ExpenseStatus → accent/success/danger/default/warning)
- `DocThumbnail.tsx`: link file → HeroUI `Card` (variant=secondary) bên trong `<a>`, bỏ border CSS thủ công
- `BottomNav.tsx`: native `<button>` → HeroUI `Button` (variant=ghost, aria-label, onPress), giữ layout icon+label dọc
- `Sidebar.tsx`: native `<button>` → HeroUI `Button` (variant=primary khi active / ghost khi không, fullWidth, justify-start)

---

## ✅ Phase 3 — Dashboard, Finance, Clients
**Trạng thái:** HOÀN THÀNH  
**Commit:** `e93c9bf`

### Đã làm:
- `Dashboard.tsx`: StatCard + event list → `Card` (render=button), hero active-event button + SectionHeader "Xem thêm" → `Button`, các container chart/topstaff/pending-expenses → `Card`
- `Finance.tsx`: "Xuất Excel" + filter pills + approve/reject + edit/save/cancel → `Button`, SummaryCard + breakdown + pending-receipts + per-event cards → `Card`
- `Clients.tsx`: add/close/submit/edit/delete → `Button`, form container + client cards → `Card`

---

## 🔜 Phase 4 — Schedule + Inventory + Header
**Trạng thái:** CHƯA BẮT ĐẦU

---

## 🔜 Phase 5 — HR + LoginScreen
**Trạng thái:** CHƯA BẮT ĐẦU (Cao rủi ro nhất — StaffProfile 720 LOC)

---

## Ghi chú kỹ thuật

| Vấn đề | Giải pháp |
|--------|-----------|
| HeroUI v3 yêu cầu TW v4 | Đã upgrade TW v4, import `@heroui/styles` prebuilt trong CSS |
| HeroUI v3 không có `HeroUIProvider` | Không cần provider — styles qua CSS, dark mode qua `.dark` class như cũ |
| `Modal` API khác Radix Dialog | Wrapper `Dialog` map `open` prop → `useOverlayState` hook |
| TW v4 không có `tailwind.config.js` | Config chuyển vào `@theme {}` trong `index.css` |
| Button `disabled` → `isDisabled` | Đã map trong Button wrapper |
| File inputs trong StaffProfile | Sẽ giữ native `<input type="file">` ẩn + Button làm trigger |
