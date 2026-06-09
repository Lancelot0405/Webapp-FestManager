# FestManager — Design Upgrade Progress

**Theme:** F&B / Festival — "Warm Feast"
**Scope:** Toàn bộ app · Light + Dark mode · Phone / Tablet / Desktop

---

## Bộ màu — Warm Feast

| Token | Light | Dark | Mô tả |
|---|---|---|---|
| primary | `#F97316` (orange-500) | `#FB923C` (orange-400) | Cam lửa — CTA, active |
| primary-hover | `#EA6D0D` | `#F97316` | |
| primary-light | `#FFF7ED` | `#431407` | Background nhạt |
| secondary | `#EAB308` (yellow-500) | `#FDE047` | Vàng nghệ — accent |
| success | `#22C55E` (green-500) | `#4ADE80` | Tươi, ok |
| surface | `#FFFBF5` | `#1C1008` | Nền trang |
| card | `#FFFFFF` | `#2C1A0E` | Nền card |
| border | `#FED7AA` | `#92400E` | Viền ấm |
| text-primary | `#1C1008` | `#FEF3C7` | Chữ chính |
| text-secondary | `#78350F` | `#FCD34D` | Chữ phụ |

---

## Kế hoạch triển khai

| # | Phần | Trạng thái | Files |
|---|---|---|---|
| 1 | **Design Tokens** — tailwind config, CSS variables, font | ✅ Hoàn thành | `tailwind.config.js`, `src/index.css` |
| 2 | **UI Primitives** — Button, Input, Badge, Card, Modal | ⏳ Chờ | `src/components/shared/ui/` |
| 3 | **Layout** — Header, BottomNav, LoginScreen | ⏳ Chờ | `src/components/layout/` |
| 4 | **Dashboard** — Hero banner, stat cards, event list | ⏳ Chờ | `src/components/dashboard/` |
| 5 | **Inventory** — Tab bar, item cards, form | ⏳ Chờ | `src/components/inventory/` |
| 6 | **Các màn hình còn lại** — Staff, Expense, EventDetail | ⏳ Chờ | `src/components/*/` |
| 7 | **Polish** — Dark mode, responsive tablet/desktop, animation | ⏳ Chờ | Toàn bộ |

---

## Chi tiết từng phần

### Phần 1 — Design Tokens ✅
- [x] Cập nhật `tailwind.config.js`: brand colors mới, spacing, shadow, font, gradients, keyframes
- [x] Cập nhật `src/index.css`: CSS variables light + dark, shimmer, scrollbar, text-gradient
- [x] Import font Plus Jakarta Sans từ Google Fonts

### Phần 2 — UI Primitives
- [ ] `Button.tsx`: variant mới (primary cam, secondary vàng, ghost)
- [ ] `Input.tsx`: border ấm, focus ring cam
- [ ] `Badge/StatusBadge.tsx`: màu sắc F&B
- [ ] `Card.tsx`: warm shadow, border cam nhạt

### Phần 3 — Layout
- [ ] `LoginScreen.tsx`: gradient cam-vàng, logo mới
- [ ] `Header.tsx`: gradient header, icon đổi màu
- [ ] `BottomNav.tsx`: active pill cam, icon to hơn

### Phần 4 — Dashboard
- [ ] Hero banner theo sự kiện đang diễn ra
- [ ] Stat cards với màu F&B
- [ ] Event list cards redesign

### Phần 5 — Inventory
- [ ] Tab bar style mới
- [ ] Item cards với icon màu theo danh mục
- [ ] Form fields responsive

### Phần 6 — Các màn hình còn lại
- [ ] Staff management
- [ ] Expense tracking
- [ ] Event detail

### Phần 7 — Polish
- [ ] Dark mode đầy đủ
- [ ] Tablet layout (sidebar thay BottomNav)
- [ ] Desktop layout
- [ ] Micro-animations

---

*Cập nhật lần cuối: 2026-06-09*
