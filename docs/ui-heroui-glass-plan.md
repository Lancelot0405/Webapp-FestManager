# Kế hoạch Nâng cấp Giao diện FestManager → HeroUI v3 Glass Preset

> **Trạng thái tổng thể:** 🔄 Đang triển khai (3/11 phases)  
> **Cập nhật lần cuối:** 2026-06-11  
> **Nhánh triển khai:** `claude/zealous-tesla-179zmi`

---

## Mục tiêu

Nâng cấp toàn bộ giao diện FestManager sang **HeroUI v3 Glass Preset** (dark mode), sử dụng tối đa các component chính thức của `@heroui/react`, không thay đổi logic nghiệp vụ, đảm bảo Mobile-First PWA và iOS Safe Area.

---

## Design Tokens mục tiêu

```
Background:       #09090b            (near-black)
Accent (dark):    #F8F8F9            (near-white)
Accent (light):   #2B2E31            (charcoal)
Card background:  rgba(255,255,255,0.05)
Card border:      rgba(255,255,255,0.08)
Backdrop blur:    36px (dark) / 20px (light)
Success:          #17C964
Warning:          #F7B750
Danger:           #DB3B3E
Font:             Inter
Border radius:    0.5rem (general)
```

---

## Quy tắc chung

- Sau mỗi phase: chạy `npm run build` + `npm test` trước khi commit
- Mỗi phase là 1 commit riêng, push lên branch `claude/zealous-tesla-179zmi`
- Không thay đổi logic nghiệp vụ, chỉ thay đổi UI
- Ưu tiên Mobile (375px) trước, sau đó Tablet/Desktop
- Giữ nguyên `pb-safe`, `pt-safe` cho iOS Safe Area
- Touch target tối thiểu 48×48px cho mọi vùng bấm
- Glass card pattern thống nhất: `bg-white/5 backdrop-blur-[36px] border border-white/8`

---

## HeroUI Components sẽ dùng

| Component | Thay thế | Phase |
|---|---|---|
| `Input` | Native `<input>` + Radix wrapper | 2, 4, 5, 6, 7, 8, 9, 10 |
| `Textarea` | Native `<textarea>` | 6, 8 |
| `Select` + `SelectItem` | Native `<select>` | 8, 9 |
| `NumberInput` | `<input type="number">` | 7, 9 |
| `DateInput` | `<input type="date">` | 8, 10 |
| `Switch` | Custom toggle button | 3, 8 |
| `RadioGroup` + `Radio` | Button group selection | 4, 8 |
| `Tabs` + `Tab` | Filter pill buttons | 5, 6, 7, 8, 9, 10 |
| `Modal` | `dialog.tsx` position="center" | 2 |
| `Drawer` | `dialog.tsx` position="bottom" | 2 |
| `Navbar` + `NavbarContent` | Custom Header div | 3 |
| `Dropdown` + `DropdownMenu` | Custom notification dropdown | 3 |
| `Accordion` + `AccordionItem` | Custom expand/collapse | 8, 9 |
| `Avatar` | User icon + initials div | 3, 8 |
| `Badge` | Custom count span | 3 |
| `Spinner` | Custom `animate-spin` span | 3, 4 |
| `Alert` | Custom error/success box | 4 |
| `Progress` | Custom BarRow % bars | 7 |
| `Autocomplete` | `FoodNameSelect` custom | 9 |
| `Tooltip` | Không có — thêm mới | 11 |
| `ScrollShadow` | Không có — thêm mới | 11 |
| `Divider` | Không có — thêm mới | 8, 11 |
| `Breadcrumbs` | Back button + title | 10 |
| `ButtonGroup` | Action button rows | 10 |
| `User` | User info display | 3 |
| `Chip` | StatusBadge (đã có, chuẩn hóa variant) | 6, 9 |

---

## Phase 1 — CSS Foundation & Design Tokens

**Trạng thái:** ✅ Hoàn thành  
**File:** `src/index.css`  
**Độ khó:** Thấp  

### Việc cần làm

- [x] Đổi font import từ `Plus Jakarta Sans` → `Inter` (Google Fonts)
- [x] Redefine CSS variables theo Glass dark tokens:
  - `--background: #09090b`
  - `--primary` light: `#2B2E31` / dark: `#F8F8F9`
  - `--glass-bg: rgba(255,255,255,0.05)`
  - `--glass-border: rgba(255,255,255,0.08)`
  - `--glass-blur: 36px`
- [x] Cập nhật dark mode variables trong `.dark` block
- [x] Giữ nguyên safe area utilities (`pb-safe`, `pt-safe`)
- [x] Giữ nguyên custom animations (fadeIn, fadeUp, shimmer...)
- [x] Cập nhật `--color-brand-*` sang dải neutral charcoal/white
- [x] Thêm utilities: `.glass-card`, `.glow-success/danger/warning/primary`

### Kiểm tra sau phase

```bash
npm run build
npm test
```
Kiểm tra thủ công: mở app, xem font và màu nền đã đổi chưa.

---

## Phase 2 — UI Primitives Layer

**Trạng thái:** ✅ Hoàn thành  
**Files:** `src/components/ui/dialog.tsx`, `src/components/ui/input.tsx`, `src/components/ui/button.tsx`  
**Độ khó:** Trung bình  

### 2.1 `dialog.tsx` → HeroUI `Modal` + `Drawer`

- [x] Thay `Dialog position="center"` → HeroUI `ModalRoot/ModalBackdrop/ModalContainer/ModalDialog`
- [x] Thay `Dialog position="bottom"` → HeroUI `DrawerRoot/DrawerBackdrop/DrawerContent/DrawerDialog`
- [x] Giữ nguyên toàn bộ external API (open, isOpen, onOpenChange, position, hideClose)
- [x] Giữ nguyên sub-component exports (DialogHeader, DialogBody, DialogFooter, DialogTitle...)
- [x] Glass styling: `bg-[var(--popover)] backdrop-blur border border-[var(--glass-border)]`
- [x] Backdrop: `bg-black/60 backdrop-blur-sm`

### 2.2 `input.tsx` → HeroUI `Input` chuẩn

- [x] Rewrite dùng `TextField` + `InputRoot` từ `@heroui/react`
- [x] Glass styling: `bg-[var(--glass-bg)] border-[var(--glass-border)] backdrop-blur`
- [x] Focus ring: `focus:ring-[var(--primary)]/30`
- [x] Đổi prop `icon` → `startContent`/`endContent` (rõ ràng hơn)
- [x] Error state: `border-[var(--danger)]`

### 2.3 `button.tsx` — Chuẩn hóa Glass style

- [x] Glass style cho `outline` variant: `bg-[var(--glass-bg)] backdrop-blur`
- [x] Ghost variant: `hover:bg-white/8`
- [x] Giữ nguyên compatibility mapping (loading, fullWidth, variant cũ)

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Ripple khi bấm button, Input focus ring, Modal/Drawer mở đúng.

---

## Phase 3 — Layout: Header + BottomNav

**Trạng thái:** ✅ Hoàn thành  
**Files:** `src/components/layout/Header.tsx`, `src/components/layout/BottomNav.tsx`  
**Độ khó:** Trung bình  

### 3.1 `Header.tsx`

- [ ] Thay custom div header → HeroUI `Navbar` + `NavbarContent`
- [ ] Glass style: `className="bg-white/5 backdrop-blur-[36px] border-b border-white/8"`
- [ ] Thay user info div → HeroUI `User` component (avatar + name + role)
- [ ] Thay notification count span → HeroUI `Badge`
- [ ] Thay notification dropdown custom → HeroUI `Dropdown` + `DropdownMenu`
- [ ] Thay install modal custom → HeroUI `Modal`
- [ ] Thay custom spinner → HeroUI `Spinner`
- [ ] Dark mode toggle giữ nguyên (Sun/Moon icon button)

### 3.2 `BottomNav.tsx`

- [ ] Thêm glass bar style: `bg-white/5 backdrop-blur-[36px] border-t border-white/8`
- [ ] Thay count span → HeroUI `Badge`
- [ ] Active tab: dùng HeroUI primary color, bỏ gradient tự viết

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Navbar hiển thị đúng mobile, Dropdown notifications mở/đóng, BottomNav active state.

---

## Phase 4 — LoginScreen

**Trạng thái:** 🔲 Chưa bắt đầu  
**File:** `src/components/layout/LoginScreen.tsx`  
**Độ khó:** Thấp  

### Việc cần làm

- [ ] Background: gradient `#09090b` toàn trang
- [ ] Login/Register toggle → HeroUI `Tabs` variant="underlined"
- [ ] Text inputs → HeroUI `Input` variant="bordered" (đã chuẩn từ Phase 2)
- [ ] Password input → HeroUI `Input` type="password" với `endContent` toggle Eye/EyeOff
- [ ] Role selection buttons → HeroUI `RadioGroup` + `Radio` card variant
- [ ] Department selection → HeroUI `RadioGroup`
- [ ] Error box → HeroUI `Alert` color="danger"
- [ ] Success box → HeroUI `Alert` color="success"
- [ ] Submit button → HeroUI `Button` isLoading (đã chuẩn từ Phase 2)
- [ ] Form card: glass style center màn hình

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Login flow hoàn chỉnh, validation errors hiển thị đúng, dark/light mode.

---

## Phase 5 — Dashboard

**Trạng thái:** 🔲 Chưa bắt đầu  
**File:** `src/components/dashboard/Dashboard.tsx`  
**Độ khó:** Thấp  

### Việc cần làm

- [ ] Stat cards → HeroUI `Card` glass style
- [ ] Thêm `Divider` giữa stat và list sections
- [ ] "Xem thêm" buttons → HeroUI `Button` variant="light"
- [ ] Pending list → wrap bằng `ScrollShadow`
- [ ] Thêm `Tooltip` cho stat icons
- [ ] Revenue bar chart: giữ nguyên custom (không có HeroUI chart)

### Kiểm tra sau phase

```bash
npm run build && npm test
```

---

## Phase 6 — Clients Page

**Trạng thái:** 🔲 Chưa bắt đầu  
**File:** `src/components/clients/Clients.tsx`  
**Độ khó:** Thấp  

### Việc cần làm

- [ ] Search input → HeroUI `Input` `isClearable` `startContent={<Search/>}`
- [ ] Form fields → HeroUI `Input` variant="bordered"
- [ ] Notes → HeroUI `Textarea` variant="bordered"
- [ ] Client cards → HeroUI `Card` glass style `isHoverable`
- [ ] Phone/Email/City text → HeroUI `Chip` variant="flat" size="sm"
- [ ] Add/Edit form → HeroUI `Modal` (đã chuẩn từ Phase 2)

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Thêm/sửa/xóa khách hàng hoạt động đúng.

---

## Phase 7 — Finance Page

**Trạng thái:** 🔲 Chưa bắt đầu  
**File:** `src/components/finance/Finance.tsx`  
**Độ khó:** Trung bình  

### Việc cần làm

- [ ] Month filter → HeroUI `Tabs` variant="solid" radius="full"
- [ ] Number inputs → HeroUI `NumberInput`
- [ ] Stat cards (Doanh thu/Chi phí/Lợi nhuận) → HeroUI `Card` glass + glow border màu tương ứng (green/red/blue)
- [ ] Số tiền lớn → font size lớn, đậm
- [ ] BarRow % bars → HeroUI `Progress` với gradient color
- [ ] Expense cards chờ duyệt → HeroUI `Card` + `Button` Approve/Reject `radius="full"`

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Filter tháng, edit income/expenses, approve/reject expenses.

---

## Phase 8 — HR Pages

**Trạng thái:** 🔲 Chưa bắt đầu  
**Files:** `src/components/hr/HRGlobal.tsx`, `src/components/hr/StaffProfile.tsx`, `src/components/hr/AddStaffForm.tsx`  
**Độ khó:** Cao (StaffProfile phức tạp nhất)  

### 8.1 `HRGlobal.tsx`

- [ ] Search input → HeroUI `Input` isClearable
- [ ] Filter chips → HeroUI `Tabs` variant="underlined"
- [ ] Staff cards → HeroUI `Card` glass + `Avatar` (initials)
- [ ] Pending registrations section → HeroUI `Accordion`
- [ ] Pending count → HeroUI `Badge`
- [ ] Approve/Reject buttons → HeroUI `Button` icon-only với `Tooltip`

### 8.2 `StaffProfile.tsx`

- [ ] Tất cả `<input type="text">` → HeroUI `Input` variant="bordered"
- [ ] `<select>` type/role/dept → HeroUI `Select` + `SelectItem`
- [ ] `<textarea>` → HeroUI `Textarea`
- [ ] `<input type="date">` → HeroUI `DateInput`
- [ ] File upload: giữ pattern hidden input + HeroUI `Button` trigger
- [ ] Document cards → HeroUI `Card` glass
- [ ] Section dividers → HeroUI `Divider`
- [ ] Custom spinner → HeroUI `Spinner`
- [ ] Switch dark mode (nếu có) → HeroUI `Switch`

### 8.3 `AddStaffForm.tsx`

- [ ] Dialog bottom → HeroUI `Drawer` anchor="bottom" (đã chuẩn từ Phase 2)
- [ ] Text inputs → HeroUI `Input`
- [ ] Role/Dept/Type selection → HeroUI `RadioGroup` card variant

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Toàn bộ flow thêm/sửa nhân viên, upload file, đổi mật khẩu.

---

## Phase 9 — Inventory Page

**Trạng thái:** 🔲 Chưa bắt đầu  
**Files:** `src/components/inventory/Inventory.tsx`, `src/components/inventory/NumberPicker.tsx`, `src/components/inventory/FoodNameSelect.tsx`  
**Độ khó:** Cao  

### 9.1 `Inventory.tsx`

- [ ] Main tabs (Nhà hàng/Festival) → HeroUI `Tabs` variant="solid"
- [ ] Sub tabs (Thực phẩm/Thiết bị/Lịch sử) → HeroUI `Tabs` variant="underlined"
- [ ] `<select>` unit → HeroUI `Select` + `SelectItem`
- [ ] Expand/collapse items → HeroUI `Accordion` + `AccordionItem`
- [ ] Warning chip → HeroUI `Chip` color="danger" variant="flat"
- [ ] Import button giữ nguyên pattern (hidden file input)

### 9.2 `NumberPicker.tsx`

- [ ] Quick value buttons → HeroUI `ButtonGroup`
- [ ] Custom input → HeroUI `NumberInput`
- [ ] Giữ nguyên min/max/step validation logic

### 9.3 `FoodNameSelect.tsx`

- [ ] Thay custom dropdown → HeroUI `Autocomplete` + `AutocompleteItem`
- [ ] Group display → HeroUI `AutocompleteSection` cho từng nhóm
- [ ] Giữ nguyên Supabase fetch logic bên trong
- [ ] Giữ nguyên "Quản lý template" button

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Tab chuyển đổi kho, thêm/sửa/xóa item, FoodNameSelect search và select.

---

## Phase 10 — Schedule Pages

**Trạng thái:** 🔲 Chưa bắt đầu  
**Files:** `src/components/schedule/Schedule.tsx`, `src/components/schedule/EventDetail.tsx`, `src/components/schedule/AddEventForm.tsx`  
**Độ khó:** Trung bình  

### 10.1 `Schedule.tsx`

- [ ] Status filter pills → HeroUI `Tabs` variant="solid" radius="full"
- [ ] Search input → HeroUI `Input` isClearable
- [ ] Event cards → HeroUI `Card` + left-border color theo status:
  - `Đang diễn ra`: border-l-4 border-success
  - `Sắp tới`: border-l-4 border-primary
  - `Đã hoàn thành`: border-l-4 border-default
  - `Lên kế hoạch`: border-l-4 border-warning

### 10.2 `EventDetail.tsx`

- [ ] 5-tab navigation (button group) → HeroUI `Tabs` variant="underlined"
- [ ] Back button area → HeroUI `Breadcrumbs`
- [ ] Export/Clone/Delete buttons → HeroUI `ButtonGroup`

### 10.3 `AddEventForm.tsx`

- [ ] Dialog bottom → HeroUI `Drawer` anchor="bottom" (đã chuẩn từ Phase 2)
- [ ] `<input type="text">` → HeroUI `Input`
- [ ] `<input type="date">` → HeroUI `DateInput`

### Kiểm tra sau phase

```bash
npm run build && npm test
```
Kiểm tra: Tạo sự kiện, xem detail, chuyển tab, export.

---

## Phase 11 — Polish & Consistency

**Trạng thái:** 🔲 Chưa bắt đầu  
**Phạm vi:** Toàn bộ app  
**Độ khó:** Thấp  

### Việc cần làm

- [ ] Thêm `Tooltip` cho tất cả icon-only buttons (Header, EventDetail, HRGlobal)
- [ ] Wrap danh sách dài bằng `ScrollShadow` (HR list, Schedule list)
- [ ] Thêm `Divider` giữa các section trong Card (StaffProfile, Dashboard)
- [ ] Kiểm tra Glass style nhất quán: `bg-white/5 backdrop-blur-[36px] border border-white/8`
- [ ] Kiểm tra dark/light mode toggle toàn app
- [ ] Kiểm tra safe area iOS không bị vỡ
- [ ] Kiểm tra touch target ≥ 48×48px
- [ ] Xóa CSS class cũ không còn dùng trong `index.css`
- [ ] Chạy `npm run lint` và fix toàn bộ warnings

### Kiểm tra cuối cùng

```bash
npm run build
npm test
npm run lint
```

Kiểm tra thủ công trên mobile:
1. Dark mode — contrast text rõ ràng
2. Ripple effect khi bấm button
3. Tabs chuyển mượt
4. Modal/Drawer hiển thị đúng giữa màn hình / bottom
5. Safe area iOS (header + bottom nav)

---

## Tiến độ tổng thể

| Phase | Mô tả | Trạng thái | Commit |
|---|---|---|---|
| 1 | CSS Foundation & Tokens | ✅ Hoàn thành | e9c96fd → phase-1 |
| 2 | UI Primitives (Modal, Input, Button) | ✅ Hoàn thành | phase-2 |
| 3 | Layout (Header + BottomNav) | 🔲 Chưa bắt đầu | — |
| 4 | LoginScreen | 🔲 Chưa bắt đầu | — |
| 5 | Dashboard | 🔲 Chưa bắt đầu | — |
| 6 | Clients Page | 🔲 Chưa bắt đầu | — |
| 7 | Finance Page | 🔲 Chưa bắt đầu | — |
| 8 | HR Pages | 🔲 Chưa bắt đầu | — |
| 9 | Inventory Page | 🔲 Chưa bắt đầu | — |
| 10 | Schedule Pages | 🔲 Chưa bắt đầu | — |
| 11 | Polish & Consistency | 🔲 Chưa bắt đầu | — |

---

## Ghi chú kỹ thuật

- **Không dùng `<HeroUIProvider>`** — HeroUI v3 CSS-first, styles load qua `@import "@heroui/styles"` trong `index.css`
- **Dark mode** quản lý qua class `.dark` của `<NextThemesProvider>` trong `main.tsx`
- **TypeScript strict:** `noUnusedLocals` + `noUnusedParameters` bật — xóa imports thừa sau mỗi refactor
- **Không thay đổi:** Logic Supabase, AppContext, appReducer, hooks, Edge Functions
- **Giữ nguyên:** `EventPDFExport` (react-pdf), `DocThumbnail`, `ErrorBoundary`, `InventoryLogList`
