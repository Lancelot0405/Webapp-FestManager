# Tổng quan Stack công nghệ (Stack Overview)

Dự án **FestManager** được thiết kế dưới dạng Progressive Web App (PWA) tối ưu cho di động với stack công nghệ hiện đại.

## 🛠️ Danh sách các công nghệ cốt lõi

### 1. Frontend Core
*   **React 19 & TypeScript**: Phiên bản React mới nhất với hiệu năng tối ưu và hỗ trợ Server Actions.
*   **Vite 8**: Công cụ build siêu tốc và tối ưu hóa file bundles.

### 2. Giao diện (UI/UX)
*   **[[ui-components|HeroUI v3.2]]** (`@heroui/react`): Thư viện component chính thức cho toàn bộ dự án. **Không tự viết các control cơ bản.**
*   **Tailwind CSS 4**: Sử dụng compiler `@tailwindcss/vite` mới, hỗ trợ dark mode thông qua class selector.

### 3. Quản lý trạng thái & Dữ liệu
*   **TanStack Query v5** (React Query): Quản lý hoàn toàn Server State (caching, synchronization, invalidation).
*   **React Context**:
    *   `AppContext`: Quản lý Auth State (Session, User, Role).
    *   `ThemeContext`: Điều chỉnh theme sáng/tối + màu accent và đồng bộ lên metadata của Supabase.
    *   `FABContext`: Hỗ trợ cấu hình nút hành động nổi (Floating Action Button) động theo từng trang.
    *   `ToastContext`: Hiển thị thông báo.

### 4. Cơ sở dữ liệu & Backend (Supabase)
*   **PostgreSQL**: Cơ sở dữ liệu chính của hệ thống.
*   **Row-Level Security (RLS)**: Cơ chế phân quyền dữ liệu bảo mật trực tiếp trên Database.
*   **Edge Functions**: Thực hiện các tác vụ quản trị nâng cao (như tạo tài khoản nhân viên, phân quyền) bằng Service Role Key một cách an toàn.

### 5. PWA & Offline
*   **Service Worker (`sw.js`)**: Chiến lược *Network-first* cho HTML và *Cache-first* cho assets tĩnh.
*   **Web Push API**: Gửi thông báo đẩy (VAPID) cho người dùng thông qua hook `usePushNotifications`.

---
## 🔗 Liên kết xem thêm
*   [[core-architecture]]: Chi tiết luồng đi của dữ liệu từ UI đến Database.
*   [[log]]: Xem lịch sử phát triển dự án.
