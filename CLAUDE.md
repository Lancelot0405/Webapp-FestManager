# FestManager — CLAUDE.md

## Quy tắc bắt buộc

- Sau mỗi thay đổi lớn, chụp screenshot và so sánh với design gốc trước khi tiếp tục
- Luôn triển khai cho **PWA (mobile)** trước, sau đó mới điều chỉnh cho Tablet/PC
- Luôn **chia nhỏ kế hoạch** thành các bước cụ thể trước khi bắt đầu triển khai

---

## Tổng quan dự án

FestManager là một **Progressive Web App (PWA)** quản lý hoạt động F&B (Food & Beverage) cho các sự kiện và lễ hội. Ứng dụng được tối ưu cho mobile với hỗ trợ offline và thông báo push.

**Stack:**
- React 19 + TypeScript 5 + Vite 8
- Tailwind CSS 4 (dark mode via CSS class)
- Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage)
- Triển khai trên Vercel

**Ngôn ngữ:** Toàn bộ UI, label, và string dùng tiếng Việt. Định dạng ngày: DD-MM-YYYY.

---

## Lệnh phổ biến

```bash
npm run dev          # Khởi động dev server (http://localhost:5173)
npm run build        # Type-check + build production (dist/)
npm run lint         # Chạy ESLint
npm run test         # Chạy test một lần
npm run test:watch   # Chạy test ở watch mode
npm run preview      # Preview build production
```

---

## Kiến trúc & cấu trúc thư mục

```
src/
├── components/
│   ├── clients/       # Quản lý khách hàng/đối tác sự kiện
│   ├── dashboard/     # Trang tổng quan, biểu đồ doanh thu
│   ├── finance/       # Báo cáo tài chính, duyệt chi phí
│   ├── hr/            # Hồ sơ nhân viên, hợp đồng
│   ├── inventory/     # Quản lý tồn kho thực phẩm & thiết bị
│   ├── layout/        # Header, BottomNav, LoginScreen
│   ├── schedule/      # Lịch sự kiện; tabs: Info/Staff/Expenses/Inventory/Contracts
│   └── shared/        # ErrorBoundary, StatusBadge, DocThumbnail; ui/: Button, Input, Modal, Skeleton
├── context/
│   ├── AppContext.tsx  # Global state + Supabase sync (events, staff, inventory, expenses, users)
│   ├── appReducer.ts   # Reducer với 30+ actions
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
├── hooks/
│   ├── useInstallPrompt.ts          # PWA install prompt
│   ├── usePushNotifications.ts      # Web Push / VAPID subscription
│   └── useRealtimeNotifications.ts  # Supabase Realtime listener
├── lib/
│   ├── supabase.ts    # Supabase client (anon key, không dùng service role ở frontend)
│   ├── adminApi.ts    # Client gọi Edge Function cho các tác vụ admin
│   ├── db.ts          # Hàm fetch dữ liệu (fetchStaff, fetchEvents, fetchInventory…)
│   ├── dateHelpers.ts # toISODate / fromISODate
│   ├── eventStatus.ts # Hằng số và tiện ích trạng thái sự kiện
│   └── errors.ts      # Custom error classes
├── types/index.ts     # Tất cả TypeScript interfaces dùng chung
└── data/mockData.ts   # Dữ liệu mock/tĩnh
```

**Backend (Supabase):**
```
supabase/
├── schema.sql             # Định nghĩa schema PostgreSQL (12 bảng + enums)
├── migrations/            # Migration files (001_…, 002_…)
└── functions/admin/       # Edge Function: register, create-staff, set-password, delete-user, get-user-email
```

---

## State Management

Toàn bộ state được quản lý qua `AppContext` + `appReducer`. **Không dùng Redux hay Zustand.**

- Thêm state mới → cập nhật `appReducer.ts` + dispatch từ component
- Sync với Supabase diễn ra trong `AppContext.tsx`
- Toast notification → dùng `useToast()` từ `ToastContext`
- Theme → dùng `useTheme()` từ `ThemeContext`

---

## Database & Backend

**Bảng chính:**
| Bảng | Mô tả |
|------|-------|
| `users` | Auth users với roles: `admin`, `manager`, `staff` |
| `staff_members` | Hồ sơ nhân viên |
| `events` | Sự kiện lễ hội |
| `event_staff` | Junction table event ↔ staff |
| `contracts` | Hợp đồng nhân viên |
| `inventory_items` | Tồn kho |
| `inventory_logs` | Lịch sử thay đổi tồn kho |
| `expenses` | Chi phí nhân viên (pending/approved/rejected) |
| `clients` | Đối tác/khách hàng sự kiện |
| `push_subscriptions` | Web Push VAPID subscriptions |
| `registration_requests` | Yêu cầu đăng ký manager |

**Edge Functions (supabase/functions/admin/):**
- `register` — public, tự đăng ký staff/manager
- `create-staff`, `set-password`, `delete-user`, `get-user-email` — chỉ admin

**Quy tắc bảo mật:**
- Service role key **chỉ** dùng trong Edge Functions, không bao giờ expose ra frontend
- Row-Level Security (RLS) bật trên tất cả bảng
- Tất cả tác vụ admin đi qua Edge Function, không gọi trực tiếp Supabase với service role

---

## Biến môi trường

Tạo file `.env` từ `.env.example`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_VAPID_PUBLIC_KEY=...
```

---

## Quy ước code

- **TypeScript strict:** `noUnusedLocals`, `noUnusedParameters` bật — xóa imports/variables không dùng
- **Tailwind CSS:** Dùng utility classes, dark mode qua prefix `dark:`, safe area qua custom spacing
- **Import order:** External packages trước, sau đó internal (`@/` hoặc relative)
- **Component file:** Mỗi component trong file riêng, export default
- **Không comment** trừ khi lý do thực sự không rõ ràng từ code
- **Không thêm tính năng** ngoài phạm vi yêu cầu

---

## Quy ước UI / UX

- **Mobile-first:** max-width `md` là chuẩn, layout đơn cột
- **Dark mode:** Luôn kiểm tra cả light và dark khi thêm màu sắc mới
- **iOS safe area:** Dùng padding/margin `safe-*` cho header và bottom nav
- **Icons:** Dùng inline SVG hoặc emoji, không import thư viện icon nặng
- **Ngày tháng:** Hiển thị DD-MM-YYYY, lưu ISO 8601 trong DB

---

## Testing

- Framework: **Vitest**
- Test files: `src/**/*.test.ts`
- Test files hiện có: `appReducer.test.ts`, `dateHelpers.test.ts`, `eventStatus.test.ts`
- Khi thêm logic mới trong `lib/` hoặc `appReducer.ts`, viết unit test kèm theo

---

## PWA

- Service Worker: `public/sw.js` — network-first cho HTML, cache-first cho assets
- Manifest: `public/manifest.json`
- Push notifications: Web Push API + VAPID (hook: `usePushNotifications`)
- Cần test trên mobile thật hoặc DevTools > Application > Service Workers

---

## Deployment

- **Platform:** Vercel (tự động deploy từ branch `main`)
- **Build command:** `npm run build`
- **Output dir:** `dist/`
- Vercel Speed Insights đã tích hợp
