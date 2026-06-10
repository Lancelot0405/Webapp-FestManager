# HeroUI Update — Tiến độ migration

> Branch: `Test`  
> Cập nhật: 2026-06-10  
> Trạng thái: **✅ Hoàn thành toàn bộ**

---

## Tổng quan

Nâng cấp toàn bộ codebase từ custom Tailwind primitives + shadcn/ui sang **HeroUI v3.1.0** + **Tailwind CSS v4**.

---

## ✅ Phase 0 — Upgrade Tailwind CSS v4

**Commit:** `74a85f5`

- Nâng Tailwind CSS từ v3 → v4
- Đổi cú pháp `tailwind.config.js` → `@theme {}` block trong `index.css`
- Cập nhật tất cả class Tailwind v3 không tương thích

---

## ✅ Phase 1 — Cài đặt HeroUI v3 & UI primitives

**Commit:** `74a85f5`

- Cài `@heroui/react@3.1.0`, `@heroui/styles`
- Thêm `@import "@heroui/styles"` vào `index.css`
- Tạo wrapper components tại `src/components/ui/`:
  - `button.tsx` — wrap HeroUI `Button`, hỗ trợ legacy variants + `loading` prop
  - `dialog.tsx` — wrap HeroUI `Modal`
  - `skeleton.tsx` — wrap HeroUI `Skeleton`
- Định nghĩa design tokens `brand-*`, `espresso-*`, `herb-*`, `saffron-*` trong `@theme {}`

---

## ✅ Phase 2 — Migrate Shared + Layout components

**Commit:** `2907015`

**Files:**
- `src/components/shared/StatusBadge.tsx` — dùng `Chip` HeroUI
- `src/components/shared/DocThumbnail.tsx` — dùng `Card` HeroUI
- `src/components/layout/BottomNav.tsx` — dùng `Button` HeroUI
- `src/components/layout/Sidebar.tsx` — dùng `Button`, `Card` HeroUI

---

## ✅ Phase 3 — Migrate Dashboard, Finance, Clients

**Commit:** `e93c9bf`

**Files:**
- `src/components/dashboard/Dashboard.tsx` — `Button`, `Card` HeroUI
- `src/components/finance/Finance.tsx` — `Button`, `Card` HeroUI
- `src/components/clients/Clients.tsx` — `Button`, `Card` HeroUI

---

## ✅ Phase 4 — Migrate Header, Schedule, AddEventForm, Inventory

**Commit:** `c97a846`

**Files:**
- `src/components/layout/Header.tsx` — `Button` HeroUI
- `src/components/schedule/Schedule.tsx` — `Button`, `Card` HeroUI
- `src/components/schedule/AddEventForm.tsx` — `Button`, `Dialog` wrapper
- `src/components/inventory/Inventory.tsx` — `Button`, `Card` HeroUI

---

## ✅ Phase 5 — Migrate HR + LoginScreen

**Commits:** `7acc6d2`, `bf2b365`

**Files:**
- `src/components/hr/HRGlobal.tsx` — `Button`, `Card`, `Chip`, native `<input>` styled
- `src/components/layout/LoginScreen.tsx` — `Button` (loading), native `<input>` styled với Tailwind
- `src/components/hr/AddStaffForm.tsx` — native `<input>` styled
- `src/components/hr/StaffProfile.tsx` — `Button`, `Card` HeroUI, native `<input>` styled

---

## ✅ Fix sau migration — Bug & Build errors

### Fix màu brand + input đen

**Commit:** `9d71266`

- Đổi `brand-*` palette từ violet/purple → **HeroUI blue** (`#006FEE`)
- Cập nhật toàn bộ shadows, gradients, CSS vars theo màu mới
- Xóa `HeroUIProvider` (không tồn tại trong v3.1.0)
- Thêm `bg-white` vào input classNames để fix input đen

### Fix Vercel build failure

**Commits:** `3bf586d`, `ba7eef3`

**Nguyên nhân:** HeroUI v3.1.0 có API khác hoàn toàn so với v2/NextUI:

| Component | Props sai (v2 style) | Props đúng (v3.1.0) |
|-----------|---------------------|---------------------|
| `Button` | `variant="solid"` | `variant="primary"` |
| `Button` | `variant="light"` | `variant="ghost"` |
| `Button` | `variant="flat"` | `variant="secondary"` |
| `Button` | `variant="bordered"` | `variant="outline"` |
| `Button` | `color="primary"` | dùng `className` |
| `Card` | `shadow="none"` | xóa prop `shadow` |
| `Input` | `variant="bordered"`, `size="sm"` | Input HeroUI v3 ≠ text field → dùng native `<input>` |

**Fix:**
- Tất cả Button variants → đúng theo HeroUI v3.1.0 spec
- Tất cả HeroUI `Input` trong form → thay bằng native `<input>` styled Tailwind
- Xóa `Card` `shadow` prop
- Xóa `HeroUIProvider` import (không export trong v3.1.0)

---

## Trạng thái cuối

| Hạng mục | Kết quả |
|----------|---------|
| Build Vite/Rolldown | ✅ 0 errors |
| TypeScript | ✅ 0 errors |
| ESLint | ✅ 0 errors (3 pre-existing warnings trong wrapper files) |
| Vitest | ✅ 33/33 tests pass |
| Vercel deploy | ✅ Build thành công |

---

## Ghi chú kỹ thuật HeroUI v3.1.0

- **Không có `HeroUIProvider`** — không cần provider, components tự hoạt động
- **`Input` từ `@heroui/react`** là OTP-style input (size = number) — **không dùng cho text field thông thường**
- **Text field** nên dùng: `TextField` + `TextFieldRoot`, hoặc native `<input>` styled Tailwind
- **Button variants hợp lệ:** `primary | secondary | ghost | outline | tertiary | danger | danger-soft`
- **Button colors hợp lệ:** `success | warning | default | danger | accent`
- **Chip variants hợp lệ:** `primary | secondary | tertiary | soft`
- **Card** không có prop `shadow` — dùng `className` với shadow utilities của Tailwind
