# HeroUI Migration Plan — FestManager

## Mục tiêu
Đồng bộ 100% giao diện sang HeroUI v3, giữ brand blue (#006FEE), tối ưu PWA (mobile-first) + dark mode + tablet/pc. Không thay đổi business logic.

---

## Tiến trình

### Phase 0 — Foundation Fix
- [x] `src/main.tsx` — HeroUIProvider không tồn tại trong v3.1.0; theming dùng `data-theme` CSS attribute (không cần wrapper)
- [x] `src/context/ThemeContext.tsx` — `data-theme` attribute sync với HeroUI qua `root.setAttribute('data-theme', theme)`

### Phase 1 — Layout Components
- [x] `src/components/layout/Header.tsx` — HeroUI Button + Chip (Navbar không có trong v3.1.0)
- [x] `src/components/layout/BottomNav.tsx` — Đã dùng HeroUI Button từ trước, giữ nguyên
- [x] `src/components/layout/Sidebar.tsx` — HeroUI Avatar + AvatarFallback cho user footer
- [x] `src/components/layout/LoginScreen.tsx` — Card + CardContent + Button (HeroUI Input quá đơn giản, giữ raw input)

### Phase 2 — Shared UI Wrappers
- [x] `src/components/ui/button.tsx` — Thêm isLoading prop, giữ legacy variant/size mapping
- [x] `src/components/ui/input.tsx` — Migrate TextField (RAC) → native input wrapper (đơn giản hơn, tránh RAC controlled/uncontrolled conflict)
- [x] `src/components/ui/dialog.tsx` — Fix close button dùng Modal.CloseTrigger (thay vì button rỗng)
- [x] `src/components/ui/skeleton.tsx` — Giữ nguyên (đã tốt)
- [x] `src/components/ui/select.tsx` — **Tạo mới**: HeroUI Select wrapper + NativeSelect fallback
- [x] `src/components/ui/tabs.tsx` — **Tạo mới**: HeroUI Tabs wrapper với items API

### Phase 3 — Page Components
- [x] `src/components/dashboard/Dashboard.tsx` — Đã dùng HeroUI Card/Button, giữ nguyên layout divs
- [x] `src/components/schedule/Schedule.tsx` — Input wrapper cho search
- [x] `src/components/schedule/EventDetail.tsx` — HeroUI Button thay raw button, tabs dùng Button với border-b-2
- [x] `src/components/schedule/AddEventForm.tsx` — Input wrapper cho tất cả form fields
- [x] `src/components/hr/HRGlobal.tsx` — Input wrapper, fix Chip→Button, raw button→HeroUI Button
- [x] `src/components/hr/AddStaffForm.tsx` — Input wrapper, close button→HeroUI Button
- [x] `src/components/finance/Finance.tsx` — Input wrapper cho edit form
- [x] `src/components/inventory/Inventory.tsx` — NativeSelect thay raw select
- [x] `src/components/inventory/NumberPicker.tsx` — HeroUI Button + Input wrapper
- [x] `src/components/clients/Clients.tsx` — Input wrapper, remove Field helper
- [ ] `src/components/schedule/tabs/*.tsx` — (defer to next phase nếu cần)
- [ ] `src/components/hr/StaffProfile.tsx` — (defer: quá phức tạp, 600+ lines)

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
