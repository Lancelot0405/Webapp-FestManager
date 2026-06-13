# HeroUI Migration — FestManager

> Cập nhật: 13-06-2026 · Branch: `claude/trusting-fermi-g3tgum`

---

## Trạng thái tổng quan

| Hạng mục | Tiến độ |
|----------|---------|
| Theme & CSS tokens | ✅ Xong |
| Card shadow | ✅ Xong |
| GlassInput / GlassSelect / GlassTextarea | ✅ Xong |
| StatusBadge (Chip) | ✅ Xong |
| Skeleton components | ✅ Xong |
| ErrorBoundary | ✅ Xong |
| Inventory Modal & Drawer | ✅ Xong |
| Layout (TopBar, BottomNav, Sidebar) | ⏳ Phase 1 |
| Dashboard cards | ⏳ Phase 2 |
| Finance (Table, Progress) | ⏳ Phase 3 |
| HR & Clients cards | ⏳ Phase 4 |
| Polish nhỏ lẻ | ⏳ Phase 5 |

---

## Đã hoàn thành

### Theme & CSS (`src/index.css`)
- HeroUI design tokens làm nguồn duy nhất: `--accent`, `--foreground`, `--surface`, `--muted`, `--separator`, `--background`, `--danger`, `--success`, `--warning`
- Dark mode qua `.dark` class
- `.saas-card` định nghĩa đúng với `var(--surface)` + `var(--separator)` + shadow
- Xóa toàn bộ CSS variables cũ (`--text-primary`, `--card`, `--glass-bg`, v.v.)

### Components đã dùng HeroUI đúng chuẩn
- `GlassInput` / `GlassSelect` / `GlassTextarea` — wrapper của HeroUI TextField / Select / TextArea
- `StatusBadge` — dùng HeroUI `<Chip>`
- `ErrorBoundary` — dùng HeroUI `<Card>` + `<Button>`
- `CardSkeleton`, `ListSkeleton`, `PageSkeleton` — dùng HeroUI `<Skeleton>`
- `InventoryAddModal` — dùng HeroUI Modal primitives
- `InventoryItemDrawer` — dùng HeroUI Drawer primitives
- `InventoryItemRow` — dùng HeroUI `<Card>`
- `FinanceSummaryCards` — dùng HeroUI `<Card>`
- `EventInfoTab` — dùng HeroUI `<Card>`, `<Chip>`, `<Separator>`

---

## Kế hoạch theo Phase

---

### Phase 1 — Layout (ưu tiên cao)

**Files:** `TopBar.tsx`, `BottomNav.tsx`, `Sidebar.tsx`, `UserSheet.tsx`

| Việc cần làm | Chi tiết |
|--------------|---------|
| TopBar buttons | 3 raw `<button>` → HeroUI `<Button variant="ghost" isIconOnly>` |
| BottomNav buttons | Nav items raw `<button>` → HeroUI `<Button>` với `isSelected` state |
| Sidebar buttons | 5 raw `<button>` (nav + user) → HeroUI `<Button variant="ghost">` |
| UserSheet theme toggle | Custom div toggle → HeroUI `<Switch>` |

**Rủi ro:** BottomNav ảnh hưởng iOS safe area — test kỹ trên mobile sau khi thay đổi.

---

### Phase 2 — Dashboard

**Files:** `Dashboard.tsx`

| Việc cần làm | Chi tiết |
|--------------|---------|
| `StatCard` | `<button className="saas-card">` → HeroUI `<Card>` + `onPress` |
| `RevenueChart` container | Raw div `.saas-card` → HeroUI `<Card>` |
| `TopStaffList` container | Raw div `.saas-card` → HeroUI `<Card>` |
| `EmptyState` | Raw div → HeroUI `<Card>` |

---

### Phase 3 — Finance

**Files:** `ExpenseList.tsx`, `EventFinanceCard.tsx`, `Finance.tsx`, `FinanceSummaryCards.tsx`

| Việc cần làm | Chi tiết |
|--------------|---------|
| `ExpenseList` table | Raw HTML `<table>` → HeroUI `<Table>` |
| `EventFinanceCard` wrapper | Raw div card → HeroUI `<Card>` |
| Progress bars | Manual div bars trong `FinanceSummaryCards` & `EventFinanceCard` → HeroUI `<ProgressBar>` |
| `Finance.tsx` filter buttons | Manual active state → HeroUI `<ToggleButtonGroup>` hoặc `<Button isSelected>` |

---

### Phase 4 — HR & Clients

**Files:** `HRGlobal.tsx`, `Clients.tsx`, `LoginScreen.tsx`

| Việc cần làm | Chi tiết |
|--------------|---------|
| Staff card (HRGlobal) | Raw div card → HeroUI `<Card>` |
| Client card (Clients) | Raw div card → HeroUI `<Card>` |
| LoginScreen AlertBox | Raw div alert → HeroUI `<Alert>` |

---

### Phase 5 — Polish

**Files:** `InventoryTabs.tsx`, `EventStaffTab.tsx`, `Finance.tsx`

| Việc cần làm | Chi tiết |
|--------------|---------|
| Tab counter badges | Manual span số → HeroUI `<Badge>` hoặc `<Chip size="sm">` |
| EventStaffTab button states | Manual className state → HeroUI `variant`/`isSelected` prop |
| Xóa dependencies thừa | `npm uninstall @radix-ui/react-dialog @radix-ui/react-slot` |

---

## Quy tắc khi migrate

1. **Đọc HeroUI docs trước** — dùng `.heroui-docs/react/components/` tương ứng
2. **Không thay đổi logic nghiệp vụ** khi migrate UI
3. **Test mobile (375px) sau mỗi phase** — đặc biệt safe area
4. **Build phải sạch** (`npm run build`) trước khi commit
5. **Dùng `variant` và `isSelected` prop** thay vì manual className state
6. **Wrapper pattern** cho các input phức tạp: xem `GlassInput.tsx` làm mẫu
