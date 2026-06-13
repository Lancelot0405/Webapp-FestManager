# Kế hoạch Migrate 100% HeroUI — FestManager

**Ngày lập:** 13-06-2026  
**Mục tiêu:** Thay thế toàn bộ custom CSS và các thành phần UI tự viết bằng HeroUI React v3, đồng thời áp dụng theme tùy chỉnh thống nhất cho toàn ứng dụng.

---

## Tình trạng hiện tại

| Hạng mục | Hiện tại |
|----------|----------|
| Tổng số component files | 45 files |
| Files đã dùng HeroUI | 35 files (78%) |
| Files chưa dùng HeroUI | 10 files (22%) |
| Thư viện thừa (cài nhưng không dùng) | `@radix-ui/react-dialog`, `@radix-ui/react-slot` |
| CSS custom không cần thiết | ~300 dòng trong `index.css` |

---

## Tổng quan các bước

| Bước | Nội dung | Độ phức tạp | Ưu tiên |
|------|----------|------------|---------|
| 1 | Áp dụng theme tùy chỉnh | Thấp | 🔴 Cao |
| 2 | Dọn dẹp `index.css` | Thấp | 🔴 Cao |
| 3 | Migrate layout (TopBar, BottomNav, Sidebar) | Trung bình | 🟡 Cao |
| 4 | Migrate Skeleton components | Thấp | 🟡 Trung bình |
| 5 | Migrate ErrorBoundary | Thấp | 🟢 Thấp |
| 6 | Migrate Finance, Inventory, Schedule | Trung bình | 🟡 Trung bình |
| 7 | Xóa dependencies thừa | Thấp | 🟢 Thấp |
| 8 | Kiểm tra toàn bộ giao diện | — | 🔴 Bắt buộc |

---

## Chi tiết từng bước

---

### Bước 1 — Áp dụng theme tùy chỉnh vào `index.css`

**Mục tiêu:** Gắn file `theme.css` bạn đã cung cấp vào dự án để xác định màu sắc, border-radius và font theo chuẩn HeroUI.

**Thay đổi:**
- Chèn toàn bộ nội dung file `theme.css` vào `src/index.css` ngay sau dòng `@import "@heroui/styles"`
- Theme này bao gồm:
  - Màu accent: xanh dương `oklch(62.04% 0.1950 253.83)`
  - Background dark mode: `oklch(12.00% 0.0015 253.83)` (gần đen)
  - Font: Inter (đã có sẵn trong dự án)
  - Border radius: `0.5rem` (field), `0.75rem` (input)

**Lưu ý:** Không xóa các phần CSS khác ở bước này — làm ở Bước 2.

---

### Bước 2 — Dọn dẹp `index.css`

**Mục tiêu:** Xóa các CSS variables và utility classes tự viết không còn cần thiết sau khi có theme HeroUI.

**Sẽ xóa (~300 dòng):**
- Toàn bộ `@theme { ... }` block (các màu `--color-brand-*`, `--color-indigo-*`, `--color-slate-*`, shadows, v.v.)
- Các CSS variables cũ: `--text-primary`, `--card`, `--glass-bg`, `--glass-blur`, `--glass-border`, `--primary`, v.v.
- Các utility classes tự viết: `.glass-card`, `.saas-card`, `.glow-*`, `.text-brand-gradient`, `.icon-primary-gradient`, `.shimmer`, `.bottom-nav-pill`
- Các design token thừa: `--space-*`, `--text-*`, `--radius-*`, `--shadow-modal`

**Sẽ giữ lại:**
- `@import` statements
- `@custom-variant dark`
- Base reset (`*, html, body, #root`)
- Safe area utilities (`.pb-safe`, `.pt-safe`)
- iOS Safari fixes (`input[type=number]`, auto-zoom prevention)
- Scrollbar styles
- `@media (prefers-reduced-motion)`

**Kết quả:** `index.css` từ ~435 dòng → ~80 dòng, sạch và dễ bảo trì hơn.

---

### Bước 3 — Migrate Layout Components

**3 files cần cập nhật:**

#### `src/components/layout/TopBar.tsx`
- **Hiện tại:** Div tự viết với Tailwind, logo, nút theme, avatar
- **Thay bằng:** HeroUI `Navbar` + `NavbarBrand` + `NavbarContent`
- **Lợi ích:** Responsive tự động, sticky behavior, blur backdrop chuẩn

#### `src/components/layout/BottomNav.tsx`
- **Hiện tại:** Fixed div với `.bottom-nav-pill` custom CSS, 5 tab icons
- **Thay bằng:** HeroUI `Navbar` position bottom hoặc custom với HeroUI tokens
- **Lợi ích:** Nhất quán với design system, bỏ được CSS custom phức tạp

#### `src/components/layout/Sidebar.tsx`
- **Hiện tại:** Drawer side với Tailwind thuần
- **Thay bằng:** HeroUI `Drawer` hoặc `Navbar` dọc
- **Lợi ích:** Animation mượt hơn, accessible hơn (focus trap, ARIA)

---

### Bước 4 — Migrate Skeleton Components

**3 files cần cập nhật:**

| File | Hiện tại | Thay bằng |
|------|----------|-----------|
| `shared/skeletons/CardSkeleton.tsx` | Custom `.shimmer` animation CSS | HeroUI `Skeleton` component |
| `shared/skeletons/ListSkeleton.tsx` | Div với background gradient | HeroUI `Skeleton` |
| `shared/skeletons/PageSkeleton.tsx` | Kết hợp 2 loại trên | HeroUI `Skeleton` |

**Ví dụ thay thế:**
```tsx
// Trước
<div className="shimmer h-4 w-3/4 rounded-md" />

// Sau
<Skeleton className="h-4 w-3/4 rounded-md" />
```

---

### Bước 5 — Migrate ErrorBoundary

**File:** `src/components/shared/ErrorBoundary.tsx`

- **Hiện tại:** Class component với div Tailwind thuần, không dùng HeroUI
- **Thay bằng:** Bọc UI lỗi trong HeroUI `Card` + `Button` (retry)
- **Lưu ý:** Logic ErrorBoundary (class component) giữ nguyên, chỉ thay phần UI render

---

### Bước 6 — Migrate Feature Components

#### `src/components/finance/FinanceSummaryCards.tsx`
- **Hiện tại:** Grid cards tự viết với Tailwind, hiển thị tổng doanh thu, chi phí, lợi nhuận
- **Thay bằng:** HeroUI `Card` + `CardBody` + `CardHeader`
- **Lợi ích:** Shadow, border, dark mode tự động theo theme

#### `src/components/inventory/InventoryItemList.tsx`
- **Hiện tại:** Grid layout với div Tailwind thuần
- **Thay bằng:** HeroUI `Card` cho từng item, hoặc HeroUI `Table` nếu dữ liệu dạng bảng

#### `src/components/schedule/tabs/EventInfoTab.tsx`
- **Hiện tại:** Display thông tin sự kiện với Tailwind, không có cấu trúc rõ ràng
- **Thay bằng:** HeroUI `Card`, `Divider`, `Chip` cho các trường thông tin

---

### Bước 7 — Xóa Dependencies Thừa

**Chạy lệnh:**
```bash
npm uninstall @radix-ui/react-dialog @radix-ui/react-slot
```

**Lý do:** `@heroui/react` đã bao gồm Radix UI bên trong — cài thêm 2 package này là thừa và có thể gây conflict version.

**Kiểm tra sau:** Chạy `npm run build` để đảm bảo không có lỗi import.

---

### Bước 8 — Kiểm tra toàn bộ giao diện

**Checklist kiểm tra:**

- [ ] Light mode — tất cả màu sắc hiển thị đúng với theme mới
- [ ] Dark mode — background, text, border đúng tone
- [ ] Mobile (375px) — layout không bị vỡ
- [ ] Tablet (768px) — sidebar/layout hiển thị đúng
- [ ] LoginScreen — form đăng nhập đúng style
- [ ] Dashboard — cards, charts đúng
- [ ] Schedule — list sự kiện, tabs (Info/Staff/Expenses/Inventory/Contracts)
- [ ] HR — danh sách nhân viên, form thêm nhân viên
- [ ] Finance — summary cards, expense list
- [ ] Inventory — item list, modal thêm hàng
- [ ] Clients — danh sách khách hàng
- [ ] Toast notifications — màu đúng (success/error/warning)
- [ ] Modal/Dialog — backdrop, animation đúng
- [ ] Form inputs — GlassInput, GlassSelect, GlassTextarea vẫn hoạt động

---

## Ước tính thời gian

| Bước | Thời gian ước tính |
|------|--------------------|
| Bước 1 — Áp dụng theme | 15 phút |
| Bước 2 — Dọn dẹp CSS | 30 phút |
| Bước 3 — Migrate Layout | 2–3 giờ |
| Bước 4 — Migrate Skeletons | 30 phút |
| Bước 5 — Migrate ErrorBoundary | 20 phút |
| Bước 6 — Migrate Feature components | 2–3 giờ |
| Bước 7 — Xóa dependencies | 10 phút |
| Bước 8 — Kiểm tra | 1–2 giờ |
| **Tổng cộng** | **~7–10 giờ** |

---

## Rủi ro cần lưu ý

| Rủi ro | Mức độ | Cách xử lý |
|--------|--------|------------|
| Màu sắc custom (indigo, brand) bị mất sau khi xóa `@theme` | Trung bình | Kiểm tra từng screen sau Bước 2 trước khi tiếp tục |
| GlassInput/GlassSelect bị ảnh hưởng bởi theme mới | Thấp | Test ngay sau Bước 1 |
| BottomNav layout bị vỡ trên iOS Safari | Trung bình | Test trên DevTools mobile + safe area |
| HeroUI Navbar không hỗ trợ cấu hình hiện tại của TopBar | Thấp | Có thể dùng custom wrapper thay vì Navbar |

---

## Kết quả mong đợi sau khi hoàn thành

- ✅ 100% components dùng HeroUI design system
- ✅ Theme nhất quán giữa light/dark mode
- ✅ `index.css` gọn gàng (~80 dòng thay vì ~435 dòng)
- ✅ Xóa được 2 package thừa
- ✅ Giao diện chuyên nghiệp, đồng nhất toàn ứng dụng
- ✅ Dễ bảo trì và mở rộng trong tương lai

---

*Tài liệu này do Claude Code tạo ra ngày 13-06-2026. Xem xét và phê duyệt trước khi triển khai.*
