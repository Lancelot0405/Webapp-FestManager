# HeroUI Migration Plan — FestManager

## Mục tiêu
Đồng bộ 100% giao diện sang HeroUI v3, giữ brand blue (#006FEE), tối ưu PWA (mobile-first) + dark mode + tablet/pc. Không thay đổi business logic.

---

## Tiến trình

### Phase 0 — Foundation Fix
- [ ] `src/main.tsx` — Thêm `<HeroUIProvider>`
- [ ] `src/context/ThemeContext.tsx` — Thêm `data-theme` attribute sync với HeroUI

### Phase 1 — Layout Components
- [x] `src/components/layout/Header.tsx` — HeroUI Button + Chip (Navbar không có trong v3.1.0)
- [x] `src/components/layout/BottomNav.tsx` — Đã dùng HeroUI Button từ trước, giữ nguyên
- [x] `src/components/layout/Sidebar.tsx` — HeroUI Avatar + AvatarFallback cho user footer
- [x] `src/components/layout/LoginScreen.tsx` — Card + CardContent + Button (HeroUI Input quá đơn giản, giữ raw input)

### Phase 2 — Shared UI Wrappers
- [ ] `src/components/ui/button.tsx` — Cải thiện (radius, isLoading)
- [ ] `src/components/ui/input.tsx` — Migrate TextField → Input
- [ ] `src/components/ui/dialog.tsx` — Fix placement, scrollBehavior
- [ ] `src/components/ui/skeleton.tsx` — Giữ nguyên (đã tốt)
- [ ] `src/components/ui/select.tsx` — **Tạo mới** (HeroUI Select wrapper)
- [ ] `src/components/ui/tabs.tsx` — **Tạo mới** (HeroUI Tabs wrapper)

### Phase 3 — Page Components
- [ ] `src/components/dashboard/Dashboard.tsx` — Card, Table
- [ ] `src/components/schedule/Schedule.tsx` — Card, Chip filters
- [ ] `src/components/schedule/EventDetail.tsx` — Tabs
- [ ] `src/components/schedule/AddEventForm.tsx` — Input, Button
- [ ] `src/components/schedule/tabs/*.tsx` — Card, Input
- [ ] `src/components/hr/HRGlobal.tsx` — Card, Chip
- [ ] `src/components/hr/AddStaffForm.tsx` — Input, Select, ButtonGroup
- [ ] `src/components/hr/StaffProfile.tsx` — Card, Input
- [ ] `src/components/finance/Finance.tsx` — Card, Table, Button
- [ ] `src/components/inventory/Inventory.tsx` — Tabs, Accordion
- [ ] `src/components/inventory/NumberPicker.tsx` — Input +/- 
- [ ] `src/components/clients/Clients.tsx` — Card, Input, Textarea

### Phase 4 — PWA & Responsive Polish
- [ ] Safe area: `classNames={{ base: "pt-safe" }}` trên Navbar
- [ ] Dark mode consistency check
- [ ] Tablet/PC layout verification

---

## Pattern chung (áp dụng cho page components)

| Element hiện tại | HeroUI replacement |
|---|---|
| `<div className="bg-white rounded-xl p-4 shadow-card">` | `<Card><CardBody>` |
| `<div className="flex border-b ...">` tab nav | `<Tabs variant="underlined" color="primary">` |
| `<select className="...">` | `<Select>` wrapper |
| `<input className="...">` trong form | `<Input>` wrapper |
| Filter chips | `<Chip variant="flat" isPressable>` |
| `<button className="bg-brand-500 ...">` | `<Button color="primary">` |

---

## Verification sau khi hoàn thành
1. `npm run build` — 0 TypeScript errors
2. `npm run lint` — 0 ESLint errors  
3. `npm test` — 33 tests pass
4. Manual test:
   - Toggle dark mode → tất cả HeroUI components đổi theme
   - Login screen render đúng
   - Dashboard, Schedule, HR, Finance, Inventory hiển thị đúng data
   - BottomNav visible mobile (≤768px), Sidebar visible desktop
   - Safe area padding trên iOS PWA
