# Công việc còn lại — FestManager

> Danh sách hạng mục **chưa làm**, nối tiếp `docs/DANH_GIA_VA_KE_HOACH.md`.
> Cập nhật: 2026-06-09 · Branch: `Test` · Backup: `Test-backup-20260609`
>
> Đã hoàn tất (đã push): lazy-load xlsx/@react-pdf (bundle 553KB→291KB), useMemo
> context, helper `runWrite` xử lý lỗi mutation, migration 002 (clients +
> push_subscriptions + RLS), `.env.example`, gom `any` ở db.ts (lint 30→17),
> primitive `Button`/`Input` + a11y khởi đầu.

---

## 🔴 Ưu tiên cao — Bảo mật

### 1. Gỡ service role key khỏi frontend → Supabase Edge Functions
**Vì sao:** `src/lib/supabase.ts` tạo `supabaseAdmin` bằng `VITE_SUPABASE_SERVICE_ROLE_KEY`
chạy ở trình duyệt → key bị nhúng vào bundle, ai cũng đọc được, bỏ qua toàn bộ RLS.
Đây là lỗ hổng critical thực sự.

**Các nơi đang dùng `supabaseAdmin` (phải chuyển sang Edge Function):**
- [ ] `src/components/layout/LoginScreen.tsx` — đăng ký (tạo user, tạo staff_members)
- [ ] `src/components/hr/AddStaffForm.tsx` — `auth.admin.createUser` (dòng ~43)
- [ ] `src/components/hr/StaffProfile.tsx` — đọc user, đổi role, reset mật khẩu
- [ ] `src/context/AppContext.tsx` — `deleteStaff` (xóa auth user), `rejectRegistration`

**Việc cần làm:**
- [ ] Tạo Edge Functions trong `supabase/functions/`:
  - [ ] `admin-create-user/` — đăng ký + tạo staff_members
  - [ ] `admin-delete-user/` — xóa staff + auth user
  - [ ] `admin-reset-password/` — đổi mật khẩu
  - [ ] `admin-approve-user/` — duyệt / từ chối đăng ký
- [ ] Mỗi function: đọc `SERVICE_ROLE_KEY` từ secret của function (KHÔNG phải VITE),
      xác thực JWT người gọi + kiểm tra `role = 'admin'` trước khi thao tác.
- [ ] Frontend gọi qua `supabase.functions.invoke('admin-...', { body })`.
- [ ] Xóa `supabaseAdmin` + biến `VITE_SUPABASE_SERVICE_ROLE_KEY`.
- [ ] `supabase secrets set SERVICE_ROLE_KEY=...`
- [ ] Test kỹ luồng đăng ký / tạo NV / xóa NV / reset mật khẩu / duyệt manager.

> ⚠️ Cần Supabase credentials thật để deploy + test. Không nên gỡ `supabaseAdmin`
> trước khi Edge Function chạy ổn (sẽ làm hỏng login/đăng ký).

### 2. Random mật khẩu tạm thay cho hardcode
- [ ] `src/components/hr/AddStaffForm.tsx` — đang hardcode `tempPassword = 'fest1234'`.
      Đổi sang random (crypto) hoặc gửi link reset; hiện mật khẩu 1 lần cho admin.

---

## 🟠 Ưu tiên trung bình — Kiến trúc & hiệu năng

### 3. TanStack Query thay refetch full-table
**Vì sao:** Hiện mỗi realtime event gọi `fetch*()` tải lại **toàn bộ bảng**; không cache,
không dedupe.
- [ ] Thêm `@tanstack/react-query`, bọc `QueryClientProvider`.
- [ ] Chuyển `fetchStaff/fetchEvents/...` thành `useQuery`.
- [ ] Realtime → `queryClient.invalidateQueries` thay vì refetch thủ công.
- [ ] Mutation dùng `useMutation` + optimistic update có **rollback** khi lỗi.

### 4. Tách AppContext (848 dòng) thành store nhỏ
- [ ] Tách theo miền: `AuthContext`, `EntitiesContext` (events/staff/inventory/clients),
      hoặc dùng Zustand. Mục tiêu: state một miền đổi không re-render miền khác.

### 5. Thêm react-router
- [ ] Thay điều hướng bằng `useState` (`activeTab`, `selectedEventId`, `selectedStaffId`)
      bằng route thật → deep-link, nút back trình duyệt, không mất vị trí khi refresh.

---

## 🟡 Ưu tiên trung bình — Ổn định & chất lượng

### 6. Testing
- [x] Cài Vitest + script `test` / `test:watch`.
- [x] Test `appReducer` (18 test phủ mọi nhóm action), `toISODate/fromISODate` (9),
      `computeEventStatus` (6) — **33 test pass**.
- [x] Tách reducer ra `src/context/appReducer.ts` (test độc lập, không cần DOM)
      và date helpers ra `src/lib/dateHelpers.ts` (không kéo theo Supabase client).
- [ ] Test component (cần @testing-library/react + jsdom) cho 1-2 form.
- [ ] (Tùy) Playwright cho e2e luồng chính.

### 7. Dọn nốt lint (còn 17 lỗi)
- [ ] `any` còn lại ở: `StaffProfile.tsx` (173/186/202/221), `EventExpensesTab.tsx`
      (135/146), `usePushNotifications.ts` (4/10), `Inventory.tsx` (`sheet_to_json<any[]>`).
- [ ] Lỗi `react-refresh/only-export-components` ở `ToastContext.tsx`,
      `AppContext.tsx`, `ThemeContext.tsx` — tách hook/constant ra file riêng.
- [ ] Lỗi `set-state-in-effect` / `impure function during render` ở
      `usePushNotifications.ts`, `useInstallPrompt.ts`.

### 8. Thay nốt `alert()` bằng toast
- [ ] `Inventory.tsx` (import file), `StaffProfile.tsx`, `EventExpensesTab.tsx` còn dùng
      `alert()` lẫn lộn — chuyển hết sang `showToast` cho nhất quán.

### 9. Optimistic update có rollback
- [ ] Hiện `runWrite` đã báo lỗi nhưng **chưa hoàn tác** state khi DB fail.
      Bổ sung rollback (lưu state cũ, revert khi lỗi) — hoặc giải quyết trọn gói khi
      chuyển sang TanStack Query (mục 3).

---

## 🟢 Ưu tiên thấp — UX/UI & design system

### 10. Nhân rộng design system
- [ ] Áp `Button`/`Input` (`src/components/shared/ui/`) cho các form còn lại:
      `LoginScreen`, `AddEventForm`, `Inventory`, `StaffProfile`, `Clients`, các tab Event.
- [ ] Tạo thêm primitive: `Modal`, `Card`, `Select`, `Badge`.

### 11. Accessibility toàn diện
- [ ] Thêm `aria-label` cho **tất cả** nút icon (Header, BottomNav, EventDetail…).
- [ ] Focus trap + đóng bằng Esc cho modal/dropdown.
- [ ] Rà soát contrast màu xám (text-gray-400 trên nền xám) đạt WCAG AA.

### 12. Loading & empty states
- [ ] Skeleton loader cho list khi đang tải.
- [ ] Empty state có minh họa + CTA (thay vì chỉ text "Không có...").

### 13. Token thiết kế
- [ ] Định nghĩa token màu/spacing/bo góc trong `tailwind.config.js` thay cho class rời.

---

## Khác
- [ ] i18n (nếu cần đa ngôn ngữ): hiện text tiếng Việt hardcode khắp nơi.
- [ ] Code-split thêm theo route khi đã có react-router.
- [ ] Xem lại `src/data/mockData.ts` — không dùng trong production, có thể xóa.
