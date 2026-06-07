# FestManager

<p align="center">
  <img src="public/icons/icon-192.png" alt="FestManager Logo" width="96" height="96" style="border-radius: 20px" />
</p>

<p align="center">
  <strong>Ứng dụng quản lý sự kiện & lễ hội — dành cho doanh nghiệp F&B và tổ chức sự kiện</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
</p>

---

## Giới thiệu

**FestManager** là ứng dụng web quản lý sự kiện và lễ hội được xây dựng dưới dạng Progressive Web App (PWA), tối ưu cho thiết bị di động. Ứng dụng phục vụ hai nhóm người dùng:

- **Quản lý (Admin)** — Toàn quyền điều phối sự kiện, nhân sự, kho hàng, tài chính và khách hàng
- **Nhân sự (Staff)** — Xem lịch phân công, hồ sơ cá nhân và chi phí cần duyệt

---

## Tính năng chính

### Quản lý sự kiện
- Tạo, chỉnh sửa, nhân bản (clone) sự kiện với đầy đủ thông tin: ngày, địa điểm, trạng thái
- Xem lịch sự kiện theo danh sách, lọc theo trạng thái
- Phân công nhân sự cho từng sự kiện
- Xuất báo cáo sự kiện dạng **PDF**

### Quản lý nhân sự
- Thêm nhân viên, tạo tài khoản đăng nhập trực tiếp từ giao diện admin
- Hồ sơ nhân viên: tên, số điện thoại, thành phố, vai trò
- Đổi tên đăng nhập và mật khẩu ngay trong ứng dụng

### Quản lý kho hàng
- Theo dõi số lượng tồn kho, cảnh báo khi dưới ngưỡng tối thiểu
- Lịch sử nhập/xuất kho

### Quản lý tài chính
- Theo dõi thu nhập và chi phí theo từng sự kiện
- Duyệt / từ chối biên lai chi phí của nhân viên

### Quản lý khách hàng
- Danh sách đối tác / đơn vị tổ chức
- Thêm, chỉnh sửa, xóa thông tin liên hệ

### Dashboard & Analytics
- Thống kê nhanh: sự kiện sắp tới, nhân sự, cảnh báo kho, chi phí chờ duyệt
- Biểu đồ doanh thu theo tháng
- Bảng xếp hạng nhân viên tích cực nhất

### Thông báo & PWA
- **Push Notification** (Web Push API + VAPID): admin nhận thông báo realtime khi có cập nhật
- Cài đặt ứng dụng lên màn hình chính (iOS Safari & Android Chrome)
- Hỗ trợ chế độ **Dark Mode** với nút chuyển đổi ngay trên header
- Splash screen khi khởi động, offline-ready qua Service Worker

---

## Công nghệ sử dụng

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4 |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| PDF Export | @react-pdf/renderer |
| Push Notification | Web Push API, VAPID, Supabase Edge Functions |
| PWA | Service Worker, Web App Manifest |
| Deploy | Vercel |

---

## Cài đặt & Chạy local

```bash
# Clone repository
git clone https://github.com/Lancelot0405/Webapp-FestManager.git
cd Webapp-FestManager

# Cài dependencies
npm install

# Tạo file môi trường
cp .env.example .env
# Điền VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY, VITE_VAPID_PUBLIC_KEY

# Chạy development server
npm run dev

# Build production
npm run build
```

---

## Biến môi trường

| Biến | Mô tả |
|------|-------|
| `VITE_SUPABASE_URL` | URL của Supabase project |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key của Supabase |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service role key (chỉ dùng server-side) |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key cho Web Push |

---

## Cấu trúc thư mục

```
src/
├── components/
│   ├── clients/        # Quản lý khách hàng
│   ├── dashboard/      # Dashboard & Analytics
│   ├── finance/        # Tài chính
│   ├── hr/             # Nhân sự
│   ├── inventory/      # Kho hàng
│   ├── layout/         # Header, BottomNav, LoginScreen
│   ├── schedule/       # Lịch sự kiện, EventDetail, PDF Export
│   └── shared/         # ErrorBoundary, StatusBadge, Toast...
├── context/            # AppContext, ThemeContext, ToastContext
├── hooks/              # usePushNotifications, useInstallPrompt, useRealtimeNotifications
├── lib/                # supabase client, db helpers
└── types/              # TypeScript interfaces
```

---

## Screenshots

> *(Cập nhật ảnh chụp màn hình sau khi deploy)*

---

## Đóng góp

Pull requests và issues đều được hoan nghênh. Vui lòng tạo issue trước khi gửi PR lớn để thảo luận về hướng triển khai.

---

## Bản quyền

Copyright © 2025 **Duy Truong HO (Lance)**. All rights reserved.

Dự án này được phát hành dưới giấy phép [MIT License](LICENSE).

---

<p align="center">
  Được xây dựng với ❤️ bởi <strong>Duy Truong HO (Lance)</strong>
</p>
