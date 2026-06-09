# Đánh giá dự án FestManager & Kế hoạch hành động

> Tài liệu đánh giá kỹ thuật toàn diện và lộ trình cải thiện.
> Phạm vi: bảo mật, kiến trúc, chất lượng code, hiệu năng, UX/UI.
> Ngày lập: 2026-06-09 · Branch làm việc: `Test` · Backup: `Test-backup-20260609`

---

## 1. Tổng quan

FestManager là PWA quản lý sự kiện & F&B (React 19 + TypeScript + Vite + Tailwind + Supabase).
Sản phẩm có **bộ tính năng rất phong phú** so với một dự án cá nhân: quản lý sự kiện,
kho, tài chính, nhân sự, push notification, export PDF/Excel, dark mode, offline (service worker).

Nền tảng tốt nhưng tồn tại **một lỗ hổng bảo mật nghiêm trọng** và nợ kỹ thuật về
kiến trúc state, hiệu năng (bundle), xử lý lỗi và hệ thống UI dùng chung.

### Bảng điểm theo hạng mục

| Hạng mục        | Điểm   | Ghi chú |
|-----------------|--------|---------|
| Tính năng       | 9/10   | Rất đầy đủ, vượt mong đợi |
| Bảo mật         | 3/10   | Service role key lộ trên frontend (critical) |
| Kiến trúc code  | 5/10   | Context khổng lồ, không có lớp cache |
| Hiệu năng       | 5/10   | Bundle 553KB/1 chunk, refetch full-table |
| Xử lý lỗi       | 4/10   | 18+ mutation fire-and-forget, không rollback |
| UX/UI           | 6/10   | Mobile-first tốt, thiếu design system & a11y |
| PWA             | 8/10   | Service worker + manifest + install tốt |
| Testing         | 0/10   | Không có test nào |

---

## 2. Phát hiện theo mức độ ưu tiên

### 🔴 CRITICAL — Service Role Key lộ trên frontend

`src/lib/supabase.ts` tạo `supabaseAdmin` bằng `VITE_SUPABASE_SERVICE_ROLE_KEY`
ngay trong code chạy ở trình duyệt. Mọi biến `VITE_*` bị nhúng thẳng vào bundle JS —
ai mở DevTools cũng đọc được. Service role key **bỏ qua toàn bộ RLS**, cho phép kẻ tấn công:

- Đọc/sửa/xóa **toàn bộ** dữ liệu của mọi người dùng (lương, hồ sơ, tài chính).
- Tạo/xóa tài khoản bất kỳ, đổi mật khẩu người khác.
- Tải toàn bộ database.

Client này được dùng ở: `LoginScreen.tsx`, `StaffProfile.tsx`, `AddStaffForm.tsx`,
`AppContext.tsx` (tạo user, xóa user, đổi mật khẩu, duyệt đăng ký).

**Hướng xử lý:** Chuyển toàn bộ thao tác admin sang **Supabase Edge Functions**
(chạy server-side, giữ service key bí mật). Frontend chỉ giữ `anon key`.
Xem mục [Kế hoạch · Giai đoạn Bảo mật](#giai-đoạn-1--bảo-mật).

**Phụ:** `AddStaffForm.tsx` hardcode mật khẩu tạm `FestManager123!` cho mọi nhân viên mới.

### 🟠 HIGH — Backend & Database

- **Thiếu định nghĩa bảng:** Code dùng `clients` và `push_subscriptions` nhưng
  `supabase/schema.sql` không định nghĩa chúng → không có RLS, query có thể fail.
- **Lệch constraint:** `schema.sql` cho phép status `('active','pending')` nhưng migration
  thêm `'rejected'` → dễ vi phạm constraint nếu chạy sai thứ tự.
- `.env.example` thiếu `VITE_SUPABASE_SERVICE_ROLE_KEY` và `VITE_VAPID_PUBLIC_KEY`.

### 🟡 MEDIUM — Kiến trúc & hiệu năng

- **`AppContext.tsx` (848 dòng) ôm toàn bộ state** (auth, events, inventory, staff,
  clients). Mọi thay đổi nhỏ re-render toàn app. `value` không được `useMemo`.
- **Không có lớp cache** (React Query/SWR). Mỗi realtime event = refetch **full table**.
- **Bundle 553KB trong 1 chunk.** `xlsx` và `@react-pdf/renderer` (rất nặng) import tĩnh
  ở 4 component → tải ngay cả khi user không export.
- **18+ mutation fire-and-forget** `.then()` không `.catch()`, optimistic update nhưng
  **không rollback** khi lỗi → state lệch DB mà không ai biết.

### 🟡 MEDIUM — Chất lượng code

- Component quá lớn: `StaffProfile.tsx` (678), `Finance.tsx` (463), `LoginScreen.tsx` (363).
- Code lặp: logic upload file 3 lần; mảng `CATEGORIES` định nghĩa 2 nơi.
- 13 chỗ dùng `any` ở `src/lib/db.ts` (lint error).
- Không validation library (zod/react-hook-form) — validate thủ công, không hiện lỗi field.
- Không router — điều hướng bằng `useState`, refresh mất vị trí, không có nút back.
- **0 test**, 30 lint error + 3 warning.

### 🟡 MEDIUM — UX/UI

- **Accessibility yếu:** hầu như không có `aria-label`, nút icon chỉ có `title`,
  không focus trap trong modal, vài chỗ contrast màu xám có thể fail WCAG AA.
- **Không có design system:** class Tailwind copy-paste khắp nơi
  (`rounded-lg` vs `rounded-xl`, `py-2` vs `py-3`), không có `Button/Input/Modal/Card` dùng chung.
- Thiếu skeleton loader & empty state (chỉ text "Không có...").
- `alert()` lẫn với toast — trải nghiệm lỗi không nhất quán.

### 🟢 Điểm mạnh cần giữ

- RLS cho 8 bảng chính viết khá chuẩn (`is_admin()`, `is_manager()`, `my_staff_id()`).
- Mobile-first thật sự tốt: safe-area iOS, fix auto-zoom Safari (input 16px), dark mode chỉn chu.
- PWA: service worker (network-first HTML, cache-first asset), manifest, install prompt.
- TypeScript domain types rõ ràng, dùng union literal cho enum.

---

## 3. Kế hoạch hành động

Thứ tự ưu tiên theo yêu cầu: **Kiến trúc & hiệu năng → Bảo mật → Ổn định & lỗi → UX/UI**.

### Giai đoạn 1 — Kiến trúc & hiệu năng

| # | Việc | Trạng thái |
|---|------|-----------|
| 1.1 | Code-split `xlsx` (dynamic `import()` trong handler export) | ✅ Đã làm |
| 1.2 | Code-split `@react-pdf/renderer` (`React.lazy` cho EventPDFExport) | ✅ Đã làm |
| 1.3 | ~~Chia vendor chunks (manualChunks)~~ — bỏ: rolldown chunk hóa khó đoán, dynamic import đã đủ | ⛔ Bỏ |
| 1.4 | `useMemo` cho `value` của AppContext | ✅ Đã làm |
| 1.5 | (Lớn) Đưa TanStack Query làm lớp cache, bỏ refetch full-table | ⏳ Đề xuất |
| 1.6 | (Lớn) Tách AppContext thành nhiều store nhỏ (auth/entities/ui) | ⏳ Đề xuất |
| 1.7 | (Lớn) Thêm `react-router` cho deep-link & nút back | ⏳ Đề xuất |

### Giai đoạn 2 — Bảo mật

| # | Việc | Trạng thái |
|---|------|-----------|
| 2.1 | Hoàn thiện `.env.example` (đủ biến, cảnh báo service key) | ✅ Đã làm |
| 2.2 | Migration tạo bảng `clients` + `push_subscriptions` kèm RLS | ✅ Đã làm |
| 2.3 | (Lớn) Edge Functions cho admin ops; gỡ service key khỏi frontend | ⏳ Đề xuất + scaffold |
| 2.4 | Random mật khẩu tạm thay cho hardcode | ⏳ Đề xuất |

### Giai đoạn 3 — Ổn định & lỗi

| # | Việc | Trạng thái |
|---|------|-----------|
| 3.1 | Helper xử lý lỗi mutation tập trung (toast + log), thay `.then()` trống | ✅ Đã làm |
| 3.2 | Gom `any` ở `db.ts` về 1 type `DbRow` (lint 30→17 lỗi, 0 warning) | ✅ Đã làm |
| 3.3 | Thay nốt `alert()` bằng toast ở các component còn lại | ⏳ Đề xuất |
| 3.4 | Thêm Vitest + Testing Library, test reducer & luồng auth | ⏳ Đề xuất |

### Giai đoạn 4 — UX/UI & design system

| # | Việc | Trạng thái |
|---|------|-----------|
| 4.1 | Component UI dùng chung: `Button`, `Input` (có a11y sẵn) trong `src/components/shared/ui/` | ✅ Đã làm (khởi đầu) |
| 4.2 | Thêm `aria-label` cho nút icon (bắt đầu: nút đóng AddStaffForm) + áp `Button` cho 1 form mẫu | ✅ Đã làm (khởi đầu) |
| 4.3 | Nhân rộng `Button`/`Input` ra các form còn lại (Login, AddEvent, Inventory…) | ⏳ Đề xuất |
| 4.4 | Skeleton loader + empty state có minh họa | ⏳ Đề xuất |
| 4.5 | Token màu/spacing trong tailwind.config | ⏳ Đề xuất |

---

## 4. Hướng dẫn triển khai Edge Functions (chi tiết cho 2.3)

Tạo các Edge Function (Deno) trong `supabase/functions/`:

```
supabase/functions/
├── admin-create-user/      # đăng ký + tạo staff_members
├── admin-delete-user/      # xóa staff + auth user
├── admin-reset-password/   # đổi mật khẩu
└── admin-approve-user/     # duyệt/từ chối đăng ký
```

Mỗi function: dùng `SUPABASE_SERVICE_ROLE_KEY` từ **env của function** (không phải VITE),
xác thực JWT của người gọi và kiểm tra `role = 'admin'` trước khi thao tác.
Frontend gọi qua `supabase.functions.invoke('admin-create-user', { body })` với
access token của user. Sau đó xóa `supabaseAdmin` và biến `VITE_SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Đo lường trước/sau

- **Bundle (đã đo):** trước = 553KB/1 chunk eager. Sau khi lazy-load `xlsx` & `@react-pdf`:
  - Eager (tải khi mở app): **291KB** (giảm ~47%).
  - `xlsx` (424KB) → chunk riêng, chỉ tải khi import/export Excel.
  - `EventPDFExport` + `@react-pdf` (1.43MB) → chunk riêng, chỉ tải khi mở chi tiết sự kiện.
- **Lint:** trước = 30 error + 3 warning. Mục tiêu giảm dần qua các giai đoạn.
- **Re-render:** sau khi `useMemo` value + (về sau) tách context.

---

> 📌 Danh sách **công việc còn lại** (dạng checklist hành động) xem tại
> [`docs/CONG_VIEC_CON_LAI.md`](./CONG_VIEC_CON_LAI.md).

*Tài liệu này sẽ được cập nhật trạng thái khi từng hạng mục hoàn tất.*
