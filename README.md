<div align="center">

<img src="public/icons/icon-192.png" alt="FestManager" width="100" style="border-radius:22px; margin-bottom:12px" />

# FestManager

**Ứng dụng quản lý sự kiện & F&B lưu động**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8)](https://web.dev/progressive-web-apps/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Giới thiệu

**FestManager** là Progressive Web App (PWA) quản lý toàn diện cho các doanh nghiệp F&B tham gia lễ hội và sự kiện ngoài trời. Tối ưu hoàn toàn cho thiết bị di động, hỗ trợ cài đặt lên màn hình chính (iOS & Android), hoạt động mượt mà với Dark Mode.

Hệ thống phục vụ hai nhóm người dùng:

| Vai trò | Quyền hạn |
|---------|-----------|
| **Quản lý (Admin)** | Toàn quyền: sự kiện, nhân sự, kho hàng, tài chính, khách hàng, phê duyệt chi phí |
| **Nhân sự (Staff)** | Xem lịch phân công, hồ sơ cá nhân, nộp & theo dõi chi phí cá nhân |

---

## Tính năng

### Quản lý sự kiện
- Tạo, chỉnh sửa, nhân bản (clone) sự kiện
- Phân công nhân viên cho từng sự kiện
- Theo dõi trạng thái: *Lên kế hoạch / Sắp tới / Đang diễn ra / Hoàn thành / Đã huỷ*
- Quản lý hợp đồng & tài liệu đính kèm
- Xuất báo cáo sự kiện dạng **PDF**
- Xuất danh sách sự kiện dạng **Excel**

### Kho hàng
- **2 danh mục riêng biệt:** Thực phẩm & Trang thiết bị
- Chỉnh sửa tên, số lượng, ngưỡng cảnh báo, đơn vị ngay inline khi bấm vào mặt hàng
- Cảnh báo tự động khi tồn kho dưới ngưỡng
- Import hàng loạt từ file Excel (2 cột: Tên | Số lượng)
- **Tab Lịch sử** riêng — theo dõi toàn bộ thay đổi kho

### Tài chính
- Tổng quan doanh thu / chi phí / lợi nhuận theo tháng
- Phân bổ chi phí theo danh mục (biểu đồ thanh)
- Phê duyệt / từ chối chi phí nhân viên kèm hóa đơn
- Chỉnh sửa tài chính trực tiếp trên từng sự kiện
- Xuất báo cáo tài chính **Excel**

### Nhân sự
- Hồ sơ đầy đủ: họ tên, ngày sinh, nơi ở, số điện thoại, loại hợp đồng
- Admin tạo tài khoản đăng nhập trực tiếp cho nhân viên
- Admin xem tên đăng nhập hiện tại của nhân viên
- Đổi tên đăng nhập & mật khẩu ngay trong ứng dụng
- Quản lý tài liệu cá nhân: Carte Vitale, Titre de Séjour
- Nộp chi phí cá nhân kèm ảnh hóa đơn

### Dashboard & Analytics
- Thống kê nhanh: sự kiện sắp tới, tổng nhân viên, kho sắp hết, chi phí chờ duyệt
- **Biểu đồ doanh thu** theo tháng (trục max 100 000€)
- **Bảng xếp hạng** top 3 nhân viên tích cực nhất

### Khách hàng / Đối tác
- Quản lý danh sách đơn vị tổ chức & đối tác
- Thêm, chỉnh sửa, xóa thông tin liên hệ

### PWA & Trải nghiệm người dùng
- **Dark Mode** với nút chuyển đổi trên Header và trang Login — lưu theo thiết bị
- **Push Notification** (Web Push API + VAPID): thông báo realtime cho admin
- **Cài đặt app** lên màn hình chính — iOS Safari & Android Chrome; nút hiện trên cả trang Login và Header
- Splash screen khi khởi động, offline-ready qua Service Worker
- Fix iOS Safari auto-zoom trên các ô input

---

## Công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 19, TypeScript 5, Vite 8 |
| Styling | Tailwind CSS 4 (Dark Mode: class) |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| PDF Export | @react-pdf/renderer |
| Excel Export | xlsx |
| Push Notification | Web Push API, VAPID, Supabase Edge Functions |
| PWA | Service Worker, Web App Manifest |
| Deploy | Vercel |

---

## Cài đặt & Chạy local

```bash
# 1. Clone
git clone https://github.com/Lancelot0405/Webapp-FestManager.git
cd Webapp-FestManager

# 2. Cài dependencies
npm install

# 3. Tạo file môi trường
cp .env.example .env
# → Điền đầy đủ các biến bên dưới

# 4. Chạy dev server
npm run dev

# 5. Build production
npm run build
```

### Biến môi trường

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| `VITE_SUPABASE_URL` | URL của Supabase project | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key | ✅ |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin operations) | ✅ |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key cho Web Push | ✅ |

---

## Cấu trúc thư mục

```
src/
├── components/
│   ├── clients/            # Quản lý khách hàng / đối tác
│   ├── dashboard/          # Dashboard, biểu đồ doanh thu, top nhân viên
│   ├── finance/            # Tài chính, phê duyệt chi phí, xuất Excel
│   ├── hr/                 # HRGlobal, StaffProfile, AddStaffForm
│   ├── inventory/          # Kho hàng (Thực phẩm / Trang thiết bị / Lịch sử)
│   ├── layout/             # Header, BottomNav, LoginScreen
│   ├── schedule/           # Schedule, EventDetail, PDF Export
│   │   └── tabs/           # Thông tin, Nhân sự, Chi phí, Kho, Hợp đồng
│   └── shared/             # ErrorBoundary, StatusBadge, DocThumbnail, Toast
├── context/
│   ├── AppContext.tsx       # Global state + Supabase sync
│   ├── ThemeContext.tsx     # Dark / Light mode
│   └── ToastContext.tsx     # Toast notifications
├── hooks/
│   ├── useInstallPrompt.ts         # PWA install prompt
│   ├── usePushNotifications.ts     # Web Push subscribe
│   └── useRealtimeNotifications.ts # Supabase Realtime
├── lib/
│   ├── supabase.ts         # Supabase clients (anon + admin)
│   └── db.ts               # Data fetching helpers
└── types/
    └── index.ts            # TypeScript interfaces
```

---

## Supabase — Migration cần thiết

Chạy các lệnh sau trong **SQL Editor** của Supabase:

```sql
-- Thêm cột phone cho nhân viên
ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Thêm cột category cho kho hàng (food / equipment)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'food';
```

---

## Bản quyền

Copyright © 2025 **Duy Truong HO (Lance)**. All rights reserved.

Dự án này được phát hành dưới giấy phép [MIT License](LICENSE).

---

<div align="center">
  Được xây dựng với ❤️ bởi <strong>Duy Truong HO (Lance)</strong>
</div>
