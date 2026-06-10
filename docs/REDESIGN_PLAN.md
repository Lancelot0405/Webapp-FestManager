# Kế hoạch Redesign — FestManager → MeetCraft UI

**Mục tiêu:** Giữ nguyên tính năng, chỉ thay đổi giao diện sang phong cách MeetCraft (tím/indigo, light-only, clean cards).

---

## Tiến độ

| Part | Nội dung | Trạng thái | Commit |
|------|----------|------------|--------|
| 1 | Design tokens (tailwind.config.js + index.css) | ✅ Hoàn thành | redesign/part-1 |
| 2 | Layout (Sidebar, BottomNav, Header, App.tsx) | ✅ Hoàn thành | redesign/part-1 |
| 3 | UI Primitives (Button, Input, StatusBadge, LoginScreen) | ✅ Hoàn thành | redesign/part-1 |
| 4 | Dashboard | ✅ Hoàn thành | redesign/part-1 |
| 5 | Các màn hình còn lại (Schedule, Finance, HR, Inventory) | ✅ Hoàn thành | redesign/part-1 |

---

## Thay đổi chính

### Bảng màu
| Token cũ | Token mới |
|----------|-----------|
| brand-500: `#F97316` (cam) | brand-500: `#8B5CF6` (tím violet) |
| saffron-500: `#EAB308` (vàng) | indigo-500: `#6366F1` (indigo) |
| espresso-* (nâu ấm) | slate-* (xám lạnh) |
| surface: `#FFFBF5` | surface: `#F8F9FA` |

### Dark mode
- **Đã xóa hoàn toàn** — chỉ còn light mode
- Xóa `ThemeContext` usage khỏi Header và LoginScreen
- Xóa tất cả class `dark:*` khỏi toàn bộ components

### Gradients
- `bg-brand-gradient`: cam→vàng → **tím→indigo** (`#8B5CF6 → #6366F1`)
- Shadow: RGB `249 115 22` → RGB `124 58 237`

---

## Lưu ý kỹ thuật
- Lỗi lint trong `FoodTemplateManager.tsx` (react-hooks/set-state-in-effect) là **pre-existing**, không liên quan đến redesign
- Tên token `espresso-*` được giữ trong tailwind.config.js (map sang slate) để tránh break class cũ trong các files chưa cập nhật
- 33 tests vẫn pass sau khi thay đổi (logic không bị ảnh hưởng)
