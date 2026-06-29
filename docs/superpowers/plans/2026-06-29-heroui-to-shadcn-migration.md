# HeroUI → shadcn/ui Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace toàn bộ `@heroui/react` và `@heroui/styles` bằng shadcn/ui + Radix UI primitives, giữ nguyên Tailwind CSS 4, giữ nguyên toàn bộ logic/UX.

**Architecture:** Migrate bottom-up: setup → shared components → layout → page modules. Mỗi task hoàn chỉnh, build sạch, commit riêng. CSS variables của HeroUI được ánh xạ sang shadcn/ui variables (`--primary`, `--muted`, etc.) để các class Tailwind custom (`text-accent`, `bg-surface`, etc.) vẫn hoạt động.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 4, shadcn/ui (Radix UI primitives), React Hook Form, TanStack Query v5

## Global Constraints

- Mobile-first: kiểm tra UI trên viewport 390px trước
- UI text, labels, placeholders: tiếng Việt
- Ngày: DD-MM-YYYY (display), ISO 8601 (DB)
- Icons: Lucide React duy nhất — không thêm icon lib khác
- Dark mode: via `.dark` class trên `<html>` (next-themes)
- Build sạch `npm run build` trước mỗi commit
- `noUnusedLocals` + `noUnusedParameters` bật — xóa mọi import thừa sau migrate
- Không thêm tính năng mới — chỉ thay component, giữ nguyên behavior

## Component Mapping

| HeroUI | shadcn/ui |
|--------|-----------|
| `Button` | `Button` |
| `Card` | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| `TextField` + `Label` + `Input` + `FieldError` | `Input` + `Label` (shadcn form pattern) |
| `TextArea` | `Textarea` |
| `Select` + `ListBox` | `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` |
| `SearchField` | `Input` (type="search") |
| `Modal` | `Dialog` + `DialogContent` etc. |
| `Drawer` | `Sheet` (side panel) |
| `Popover` | `Popover` + `PopoverTrigger` + `PopoverContent` |
| `Tabs` | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` |
| `Table` | `Table` + `TableHeader` + `TableBody` + `TableRow` + `TableCell` |
| `Skeleton` | `Skeleton` |
| `Chip` | `Badge` |
| `Badge` | `Badge` (variant) |
| `Avatar` | `Avatar` + `AvatarImage` + `AvatarFallback` |
| `Separator` | `Separator` |
| `ToggleButton` + `ToggleButtonGroup` | `Toggle` + `ToggleGroup` + `ToggleGroupItem` |
| `TagGroup` + `Tag` | `Badge` group (manual layout) |
| `Alert` | `Alert` + `AlertDescription` |
| `AlertDialog` | `AlertDialog` + sub-components |
| `Calendar` | `Calendar` (shadcn, dùng react-day-picker) |
| `Autocomplete` | `Command` + `CommandInput` + `CommandList` |
| `ProgressBar` | `Progress` |
| `Disclosure` | `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` |
| `Switch` | `Switch` |
| `Form` | Form (shadcn, react-hook-form) |
| `Tooltip` | `Tooltip` + `TooltipTrigger` + `TooltipContent` |
| `Spinner` | Custom `<Loader2 className="animate-spin" />` (Lucide) |
| `EmptyState` | Custom div |
| `Link` | `<a>` hoặc `<Link>` từ react-router |
| `Header` | `<h2>` hoặc div |
| `Key`, `Selection` | TypeScript types thuần |
| `useFilter` | Custom filter function |

---

## Task 1: Setup shadcn/ui + CSS Variables

**Files:**
- Modify: `package.json`
- Modify: `src/index.css`
- Create: `components.json` (shadcn config)
- Modify: `src/lib/utils.ts`
- Modify: `vite.config.ts` (nếu cần path alias)

**Mục tiêu:** shadcn/ui cài xong, CSS variables ánh xạ đúng, build sạch.

- [ ] **Step 1: Install shadcn/ui và dependencies**

```bash
cd /path/to/project
npx shadcn@latest init
```

Khi CLI hỏi:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**
- Tailwind config: dùng `@import "tailwindcss"` (Tailwind v4)

Nếu CLI không nhận diện Tailwind v4, chạy manual:
```bash
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install @radix-ui/react-slot
```

- [ ] **Step 2: Tạo `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Cập nhật `src/index.css` — thay HeroUI variables bằng shadcn variables**

Xóa toàn bộ block `@import "@heroui/styles"` và các CSS variables HeroUI. Thay bằng:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  :root {
    --background: 0 0% 97%;
    --foreground: 222 14% 10%;
    --card: 0 0% 100%;
    --card-foreground: 222 14% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 14% 10%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 94%;
    --secondary-foreground: 222 14% 10%;
    --muted: 220 14% 94%;
    --muted-foreground: 220 9% 55%;
    --accent: 217 91% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 90%;
    --input: 220 13% 90%;
    --ring: 217 91% 60%;
    --radius: 0.75rem;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    /* Accent gradient — dùng bởi ThemeContext */
    --accent-from: oklch(62% 0.195 254);
    --accent-to: oklch(58% 0.22 280);
  }
  .dark {
    --background: 222 16% 12%;
    --foreground: 210 17% 95%;
    --card: 222 16% 16%;
    --card-foreground: 210 17% 95%;
    --popover: 222 16% 16%;
    --popover-foreground: 210 17% 95%;
    --primary: 217 91% 65%;
    --primary-foreground: 0 0% 100%;
    --secondary: 222 16% 20%;
    --secondary-foreground: 210 17% 95%;
    --muted: 222 16% 20%;
    --muted-foreground: 220 9% 60%;
    --accent: 217 91% 65%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62% 55%;
    --destructive-foreground: 0 0% 100%;
    --border: 222 16% 22%;
    --input: 222 16% 22%;
    --ring: 217 91% 65%;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', sans-serif;
  }
}

/* Legacy aliases — giữ nguyên để các component chưa migrate không bị vỡ */
:root {
  --separator: hsl(var(--border));
  --overlay: hsl(var(--popover));
  --overlay-foreground: hsl(var(--popover-foreground));
  --field-background: hsl(var(--card));
  --field-foreground: hsl(var(--foreground));
  --field-placeholder: hsl(var(--muted-foreground));
  --danger: hsl(var(--destructive));
  --danger-foreground: hsl(var(--destructive-foreground));
  --focus: hsl(var(--ring));
}
```

Giữ lại tất cả animation keyframes, `.pb-safe`, `.pt-safe`, và các custom utilities hiện có.

- [ ] **Step 4: Cập nhật `src/lib/utils.ts` — đảm bảo `cn()` vẫn dùng `clsx` + `tailwind-merge`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Cập nhật `tsconfig.json` — thêm path alias nếu chưa có**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 6: Cập nhật `vite.config.ts` — thêm path alias**

```typescript
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 7: Install shadcn/ui components cần dùng**

```bash
npx shadcn@latest add button card input label textarea select dialog sheet popover tabs table skeleton badge avatar separator toggle toggle-group alert alert-dialog calendar progress collapsible switch form tooltip command
```

Các component sẽ được tạo trong `src/components/ui/`.

- [ ] **Step 8: Verify build sạch**

```bash
npm run build
```

Expected: build thành công (có thể còn warning về unused HeroUI imports — OK ở bước này).

- [ ] **Step 9: Commit**

```bash
git add src/index.css src/lib/utils.ts vite.config.ts tsconfig.json components.json src/components/ui/
git commit -m "feat: install shadcn/ui, configure CSS variables, add ui components"
```

---

## Task 2: Migrate Shared Components

**Files:**
- Modify: `src/components/shared/StatusBadge.tsx`
- Modify: `src/components/shared/ErrorBoundary.tsx`
- Modify: `src/components/shared/DocThumbnail.tsx`
- Modify: `src/components/shared/AppDatePicker.tsx`
- Modify: `src/components/shared/FranceCityAutocomplete.tsx`
- Modify: `src/components/shared/skeletons/CardSkeleton.tsx`
- Modify: `src/components/shared/skeletons/ListSkeleton.tsx`
- Modify: `src/components/shared/skeletons/PageSkeleton.tsx`

**Mục tiêu:** Shared components không còn import `@heroui/react`.

### StatusBadge.tsx

- [ ] **Step 1: Replace Chip với Badge**

```typescript
// TRƯỚC:
import { Chip } from '@heroui/react'
// SAU:
import { Badge } from '@/components/ui/badge'
```

`Chip` → `Badge`. Map variant:
- `color="success"` → `variant="success"` hoặc className `bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`
- `color="danger"` → className `bg-red-100 text-red-700`
- `color="warning"` → className `bg-yellow-100 text-yellow-700`
- `color="primary"` → `variant="default"`

### ErrorBoundary.tsx

- [ ] **Step 2: Replace Button**

```typescript
import { Button } from '@/components/ui/button'
```

Props mapping: `onPress` → `onClick`, `color="primary"` → `variant="default"`.

### DocThumbnail.tsx

- [ ] **Step 3: Replace Badge và Card nếu có**

Thay `Badge` HeroUI → shadcn `Badge`. Thay `Card` → shadcn `Card`.

### AppDatePicker.tsx

- [ ] **Step 4: Replace Calendar và Popover**

```typescript
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
```

HeroUI Calendar props: `value`, `onChange` dùng DateValue từ `@internationalized/date`.
shadcn Calendar dùng `Date | undefined`.

```typescript
// Converter:
import { parseDate } from '@internationalized/date'

// HeroUI value: CalendarDate
// shadcn value: Date
// Convert in/out:
const dateValue = value ? new Date(value.year, value.month - 1, value.day) : undefined
const onSelect = (d: Date | undefined) => {
  if (d) onChange(parseDate(d.toISOString().split('T')[0]))
}
```

Nếu project dùng string dates (ISO), bỏ `@internationalized/date` và convert trực tiếp.

### FranceCityAutocomplete.tsx

- [ ] **Step 5: Replace Autocomplete với Command**

HeroUI `Autocomplete` → shadcn `Command` pattern:

```typescript
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
```

Bỏ `useFilter` từ HeroUI — dùng `.filter()` thuần:

```typescript
const filtered = items.filter(item =>
  item.toLowerCase().includes(query.toLowerCase())
)
```

Bỏ import `Autocomplete`, `EmptyState`, `Header`, `Label`, `ListBox`, `SearchField`, `Separator`, `useFilter`.

### Skeletons

- [ ] **Step 6: Replace Skeleton**

```typescript
import { Skeleton } from '@/components/ui/skeleton'
```

`<Skeleton className="h-4 w-full" />` — shadcn Skeleton nhận className trực tiếp.
HeroUI Skeleton dùng `isLoaded` prop — shadcn không có, chỉ render Skeleton khi loading.

- [ ] **Step 7: Build check**

```bash
npm run build
```

Expected: 0 import từ `@heroui/react` trong `src/components/shared/`.

- [ ] **Step 8: Commit**

```bash
git add src/components/shared/
git commit -m "feat(migrate): shared components HeroUI → shadcn/ui"
```

---

## Task 3: Migrate Layout Components

**Files:**
- Modify: `src/components/layout/LoginScreen.tsx`
- Modify: `src/components/layout/TopBar.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/components/layout/UserSheet.tsx`
- Modify: `src/components/layout/UserSheetContent.tsx`

### LoginScreen.tsx

- [ ] **Step 1: Replace Alert, Button, Card, Form, Link, Label, TextField, Input**

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
```

HeroUI `TextField` + `Label` + `Input` pattern:
```tsx
// TRƯỚC (HeroUI):
<TextField>
  <Label>Email</Label>
  <Input />
  <FieldError />
</TextField>

// SAU (shadcn):
<div className="space-y-1">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" {...register('email')} />
  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
</div>
```

HeroUI `Alert` → shadcn `Alert`:
```tsx
// SAU:
<Alert variant="destructive">
  <AlertDescription>{errorMessage}</AlertDescription>
</Alert>
```

HeroUI `Link` → `<a>` hoặc React Router `<Link>`.

HeroUI `Form` → bỏ, dùng `<form>` thuần (react-hook-form `handleSubmit`).

### TopBar.tsx

- [ ] **Step 2: Replace Avatar, Badge, Button, Chip, Popover, Separator**

```typescript
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
```

HeroUI `Avatar` → shadcn Avatar:
```tsx
// SAU:
<Avatar>
  <AvatarImage src={user.avatarUrl} />
  <AvatarFallback>{user.name[0]}</AvatarFallback>
</Avatar>
```

HeroUI `Badge` (notification dot) → shadcn `Badge` với `variant="destructive"` hoặc custom className.

### BottomNav.tsx

- [ ] **Step 3: Replace Button nếu có, giữ nguyên Tailwind layout**

Thường BottomNav dùng ít HeroUI — chỉ thay `Button` nếu có, còn lại giữ nguyên div/Tailwind.

### Sidebar.tsx

- [ ] **Step 4: Replace Button, Avatar, Badge, Chip, Disclosure, Switch**

`Disclosure` → `Collapsible`:
```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
```

```tsx
// SAU:
<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">Menu item</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* sub-items */}
  </CollapsibleContent>
</Collapsible>
```

`Switch` → shadcn `Switch`:
```typescript
import { Switch } from '@/components/ui/switch'
```

Props: `isSelected` → `checked`, `onChange` → `onCheckedChange`.

### UserSheet.tsx

- [ ] **Step 5: Replace Card, Drawer với Sheet**

HeroUI `Drawer` (side panel) → shadcn `Sheet`:
```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
```

```tsx
// SAU:
<Sheet open={isOpen} onOpenChange={onClose}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Thông tin</SheetTitle>
    </SheetHeader>
    {/* content */}
  </SheetContent>
</Sheet>
```

### UserSheetContent.tsx

- [ ] **Step 6: Replace Avatar, Badge, Button, Chip, Separator**

Tương tự mapping trên. `Chip` → `Badge`.

- [ ] **Step 7: Build check**

```bash
npm run build
```

Expected: 0 import `@heroui/react` trong `src/components/layout/`.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/
git commit -m "feat(migrate): layout components HeroUI → shadcn/ui"
```

---

## Task 4: Migrate Schedule Module

**Files:**
- Modify: `src/components/schedule/Schedule.tsx`
- Modify: `src/components/schedule/AddEventForm.tsx`
- Modify: `src/components/schedule/EventDetail.tsx`
- Modify: `src/components/schedule/EventDetailContent.tsx`
- Modify: `src/components/schedule/EventCalendarView.tsx`
- Modify: `src/components/schedule/EventPDFExport.tsx`
- Modify: `src/components/schedule/tabs/EventInfoTab.tsx`
- Modify: `src/components/schedule/tabs/EventStaffTab.tsx`
- Modify: `src/components/schedule/tabs/EventExpensesTab.tsx`
- Modify: `src/components/schedule/tabs/EventInventoryTab.tsx`
- Modify: `src/components/schedule/tabs/EventContractsTab.tsx`

### Schedule.tsx

- [ ] **Step 1: Replace Button, Card, Chip, SearchField, Table, Tabs**

`SearchField` → `Input` với icon:
```tsx
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// SAU:
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    className="pl-9"
    placeholder="Tìm sự kiện..."
    value={search}
    onChange={e => setSearch(e.target.value)}
  />
</div>
```

`Tabs` → shadcn Tabs:
```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
```

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="list">Danh sách</TabsTrigger>
    <TabsTrigger value="calendar">Lịch</TabsTrigger>
  </TabsList>
  <TabsContent value="list">...</TabsContent>
  <TabsContent value="calendar">...</TabsContent>
</Tabs>
```

### AddEventForm.tsx

- [ ] **Step 2: Replace Button, Card, Modal, ToggleButtonGroup, ToggleButton, TextField, Label, Input, FieldError**

`Modal` → `Dialog`:
```typescript
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
```

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Thêm sự kiện</DialogTitle>
    </DialogHeader>
    {/* form content */}
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Hủy</Button>
      <Button onClick={handleSubmit}>Lưu</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

`ToggleButtonGroup` + `ToggleButton` → `ToggleGroup` + `ToggleGroupItem`:
```typescript
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
```

```tsx
<ToggleGroup type="single" value={value} onValueChange={setValue}>
  <ToggleGroupItem value="a">Option A</ToggleGroupItem>
  <ToggleGroupItem value="b">Option B</ToggleGroupItem>
</ToggleGroup>
```

`Select` + `ListBox` → shadcn Select:
```typescript
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui/select'
```

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Chọn..." />
  </SelectTrigger>
  <SelectContent>
    {options.map(opt => (
      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### EventDetail.tsx

- [ ] **Step 3: Replace Card, Drawer (side panel)**

HeroUI `Drawer` side panel → shadcn `Sheet`:
```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
```

### EventDetailContent.tsx

- [ ] **Step 4: Replace Avatar, Badge, Button, Chip, Tabs, Table, Separator**

### EventCalendarView.tsx

- [ ] **Step 5: Replace Calendar, ToggleButtonGroup, ToggleButton**

shadcn `Calendar` dùng `react-day-picker`:
```typescript
import { Calendar } from '@/components/ui/calendar'
```

Props: `selected`, `onSelect`, `mode="single"` | `"multiple"` | `"range"`.
Nếu calendar view phức tạp hơn (custom rendering per day), dùng `react-day-picker` trực tiếp với `modifiers` và `components` prop.

### Event Tabs

- [ ] **Step 6: Replace các components trong từng tab**

Mỗi tab (`EventInfoTab`, `EventStaffTab`, `EventExpensesTab`, `EventInventoryTab`, `EventContractsTab`) — thay Button, Card, Table, Badge, Avatar tương tự mapping đã định nghĩa.

`Table` → shadcn Table:
```typescript
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table'
```

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Tên</TableHead>
      <TableHead>Vai trò</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map(row => (
      <TableRow key={row.id}>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.role}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

- [ ] **Step 7: Build check**

```bash
npm run build
```

Expected: 0 import `@heroui/react` trong `src/components/schedule/`.

- [ ] **Step 8: Commit**

```bash
git add src/components/schedule/
git commit -m "feat(migrate): schedule module HeroUI → shadcn/ui"
```

---

## Task 5: Migrate Finance Module

**Files:**
- Modify: `src/components/finance/Finance.tsx`
- Modify: `src/components/finance/EventFinanceCard.tsx`
- Modify: `src/components/finance/ExpenseList.tsx`
- Modify: `src/components/finance/FinanceSummaryCards.tsx`
- Modify: `src/components/finance/FinanceExport.tsx`

- [ ] **Step 1: Replace Card, ProgressBar trong FinanceSummaryCards**

`ProgressBar` → shadcn `Progress`:
```typescript
import { Progress } from '@/components/ui/progress'
```

```tsx
<Progress value={percentage} className="h-2" />
```

- [ ] **Step 2: Replace Button, Card, Spinner, TextField, Label, Input, Select, ListBox trong Finance.tsx**

`Spinner` → Lucide `Loader2`:
```tsx
import { Loader2 } from 'lucide-react'
// ...
<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
```

- [ ] **Step 3: Replace Card, Separator, Chip trong EventFinanceCard**

- [ ] **Step 4: Replace trong ExpenseList và FinanceExport**

- [ ] **Step 5: Build check + commit**

```bash
npm run build
git add src/components/finance/
git commit -m "feat(migrate): finance module HeroUI → shadcn/ui"
```

---

## Task 6: Migrate HR Module

**Files:**
- Modify: `src/components/hr/HRGlobal.tsx`
- Modify: `src/components/hr/StaffProfile.tsx`
- Modify: `src/components/hr/AddStaffForm.tsx`

- [ ] **Step 1: Replace Button, Card, Label, Link, Spinner, ToggleButton, ToggleButtonGroup, TextField, Input, Select, ListBox**

`AddStaffForm.tsx` có nhiều nhất HeroUI. Thay toàn bộ form fields theo pattern Task 3 Step 1 (Label + Input + error message).

- [ ] **Step 2: Replace AlertDialog trong HRGlobal nếu có**

`AlertDialog` → shadcn `AlertDialog`:
```typescript
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
```

- [ ] **Step 3: Build check + commit**

```bash
npm run build
git add src/components/hr/
git commit -m "feat(migrate): HR module HeroUI → shadcn/ui"
```

---

## Task 7: Migrate Inventory Module

**Files:**
- Modify: `src/components/inventory/Inventory.tsx`
- Modify: `src/components/inventory/InventoryItemList.tsx`
- Modify: `src/components/inventory/InventoryTable.tsx`
- Modify: `src/components/inventory/InventoryLogList.tsx`
- Modify: `src/components/inventory/InventoryAddModal.tsx`
- Modify: `src/components/inventory/InventoryItemDrawer.tsx`
- Modify: `src/components/inventory/InventoryNavigation.tsx`
- Modify: `src/components/inventory/InventoryToolbar.tsx`
- Modify: `src/components/inventory/InventorySummary.tsx`
- Modify: `src/components/inventory/InventoryQuantityStepper.tsx`
- Modify: `src/components/inventory/FoodNameSelect.tsx`
- Modify: `src/components/inventory/FoodTemplateManager.tsx`
- Modify: `src/components/inventory/NumberPicker.tsx`

Module lớn nhất. Có `AlertDialog`, `Modal`, `Drawer`, `Table`, `Select`, `SearchField`, `ToggleButtonGroup`.

- [ ] **Step 1: InventoryAddModal — Modal → Dialog**

Theo pattern Task 4 Step 2.

- [ ] **Step 2: InventoryItemDrawer — Drawer → Sheet**

Theo pattern Task 3 Step 5.

- [ ] **Step 3: InventoryTable — Table → shadcn Table**

Theo pattern Task 4 Step 6.

- [ ] **Step 4: InventoryToolbar — SearchField, ToggleButtonGroup, Select**

Theo pattern Task 4 Step 1 và 2.

- [ ] **Step 5: FoodNameSelect — Select + ListBox**

Nếu cần autocomplete: dùng `Command` pattern (Task 2 Step 5).
Nếu chỉ cần simple select: dùng shadcn `Select`.

- [ ] **Step 6: FoodTemplateManager — AlertDialog, Modal**

Theo mapping AlertDialog và Dialog.

- [ ] **Step 7: NumberPicker và InventoryQuantityStepper**

Thường chỉ dùng Button — thay đơn giản.

- [ ] **Step 8: Còn lại (Inventory.tsx, InventorySummary, InventoryNavigation, InventoryLogList, InventoryItemList)**

Thay Card, Badge, Chip, Spinner theo mapping chuẩn.

- [ ] **Step 9: Build check + commit**

```bash
npm run build
git add src/components/inventory/
git commit -m "feat(migrate): inventory module HeroUI → shadcn/ui"
```

---

## Task 8: Migrate Dashboard + Clients

**Files:**
- Modify: `src/components/dashboard/Dashboard.tsx`
- Modify: `src/components/clients/Clients.tsx`

- [ ] **Step 1: Dashboard — Card, ProgressBar, Button, Spinner**

- [ ] **Step 2: Clients — AlertDialog, Button, Card, EmptyState, Modal, SearchField, TextField, Label, Input, TextArea, FieldError**

`TextArea` → shadcn `Textarea`:
```typescript
import { Textarea } from '@/components/ui/textarea'
```

`EmptyState` → custom div:
```tsx
<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
  <Users className="h-12 w-12 mb-3 opacity-40" />
  <p className="text-sm">Chưa có khách hàng nào</p>
</div>
```

- [ ] **Step 3: Build check + commit**

```bash
npm run build
git add src/components/dashboard/ src/components/clients/
git commit -m "feat(migrate): dashboard and clients HeroUI → shadcn/ui"
```

---

## Task 9: Remove HeroUI + Final Cleanup

**Files:**
- Modify: `package.json`
- Modify: `src/index.css`
- Check: tất cả `.tsx` và `.ts` files

- [ ] **Step 1: Xác nhận 0 import còn sót**

```bash
grep -r "from '@heroui/react'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@heroui" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output.

- [ ] **Step 2: Uninstall HeroUI**

```bash
npm uninstall @heroui/react @heroui/styles
```

- [ ] **Step 3: Xóa legacy CSS aliases khỏi index.css**

Xóa block comment `/* Legacy aliases */` và các biến HeroUI tương ứng.
Giữ lại `--accent-from`, `--accent-to` (dùng bởi `ThemeContext`).

- [ ] **Step 4: Kiểm tra `@internationalized/date`**

```bash
grep -r "@internationalized/date" src/ --include="*.tsx" --include="*.ts"
```

Nếu còn dùng (trong `AppDatePicker`): giữ lại.
Nếu đã bỏ: `npm uninstall @internationalized/date`.

- [ ] **Step 5: TypeScript strict check**

```bash
npm run build
```

Fix mọi unused import, unused variable TypeScript error.

- [ ] **Step 6: Smoke test trên mobile**

Mở DevTools → Device Toolbar → iPhone 14 Pro (393px).
Kiểm tra: Login, Schedule, Finance, HR, Inventory, Dashboard, Clients.
Dark mode toggle hoạt động.
Accent color picker hoạt động (ThemeContext vẫn set `--accent-from`/`--accent-to`).

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(migrate): remove HeroUI, complete shadcn/ui migration"
```

- [ ] **Step 8: Push**

```bash
git push origin shadcn/ui
```

---

## Rủi ro & Lưu ý

| Rủi ro | Xử lý |
|--------|-------|
| shadcn/ui `Calendar` dùng `react-day-picker` v9 — API khác | Đọc docs shadcn Calendar trước khi migrate `AppDatePicker` và `EventCalendarView` |
| HeroUI `Key`/`Selection` types không còn — TypeScript sẽ báo lỗi | Thay bằng `string`, `Set<string>`, hoặc custom type |
| `ToggleButtonGroup` HeroUI quản lý selection state nội bộ — shadcn `ToggleGroup` cần controlled state | Thêm `useState` cho controlled value |
| HeroUI `onPress` event (keyboard + pointer) → shadcn `onClick` chỉ là click | Thêm `onKeyDown` nếu cần keyboard support |
| CSS class `bg-surface`, `border-separator`, `text-muted` — HeroUI custom tokens | Map sang shadcn tokens: `bg-card`, `border-border`, `text-muted-foreground` — audit sau Task 9 |
| `ThemeContext` sets `--accent-from`/`--accent-to` CSS vars | Giữ vars này trong index.css — shadcn không dùng nhưng ThemeContext cần |
| Drawer (HeroUI) position: right vs shadcn Sheet position: right | Dùng `side="right"` cho Sheet |
