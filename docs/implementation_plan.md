# Kế Hoạch Tái Cấu Trúc & Nâng Cấp FestManager — Phiên Bản Chính Thức

> **Cập nhật lần cuối:** 2026-06-12
> **Trạng thái:** Đã xác nhận — sẵn sàng triển khai

---

## Mục Lục

1. [Tóm tắt đánh giá hiện trạng](#1-tóm-tắt-đánh-giá-hiện-trạng)
2. [Phân tích điểm mạnh & điểm yếu](#2-phân-tích-điểm-mạnh--điểm-yếu)
3. [Quyết định kỹ thuật cốt lõi](#3-quyết-định-kỹ-thuật-cốt-lõi)
4. [Lộ trình triển khai theo pha](#4-lộ-trình-triển-khai-theo-pha)
5. [Đề xuất bổ sung nâng cao](#5-đề-xuất-bổ-sung-nâng-cao)
6. [Quy trình xác minh & kiểm thử](#6-quy-trình-xác-minh--kiểm-thử)

---

## 1. Tóm Tắt Đánh Giá Hiện Trạng

### Stack hiện tại (đã xác nhận từ codebase)

| Mục | Hiện trạng |
|-----|-----------|
| Framework | React 19.2.6 + TypeScript + Vite 8 |
| UI Library | HeroUI v3.1.0 (đã cài, nhưng dùng qua custom wrappers) |
| State | AppContext (667 dòng) + appReducer (30+ actions) |
| Data fetching | Trực tiếp trong AppContext, không cache |
| Routing | `useState<ActiveTab>` — không có URL |
| Animation | framer-motion 12.4 (đã cài, dùng rải rác) |
| Realtime | Supabase Realtime (8 bảng subscribe trong AppContext) |
| Optimistic updates | **Đã có** — qua `runWrite()` helper trong AppContext |
| Testing | 3 file test (lib/), không có component tests |

### File lớn cần chú ý

| File | Dòng | Vấn đề |
|------|------|--------|
| `src/context/AppContext.tsx` | 667 | God context: auth + data + realtime + mutations |
| `src/components/inventory/Inventory.tsx` | 408 | Logic + render + sub-components lẫn lộn |
| `src/components/finance/Finance.tsx` | 387 | Tương tự — cần tách trước khi refactor |
| `src/components/schedule/Schedule.tsx` | 187 | Chấp nhận được — không cần tách |
| `src/components/schedule/EventDetail.tsx` | 193 | Chấp nhận được — không cần tách |
| `src/lib/db.ts` | 260 | Sẽ được thay bằng service layer |

---

## 2. Phân Tích Điểm Mạnh & Điểm Yếu

### ✅ Điểm Mạnh Của Codebase Hiện Tại

| # | Điểm mạnh | Ghi chú |
|---|-----------|---------|
| 1 | Optimistic updates đã có | `runWrite()` trong AppContext dispatch ngay rồi rollback nếu lỗi — cần tái tạo pattern này khi migrate sang TanStack Query |
| 2 | Supabase Realtime đã hoạt động | 8 bảng đang subscribe — chiến lược giữ lại trong AppContext |
| 3 | ErrorBoundary đã có | `src/components/shared/ErrorBoundary.tsx` — cần mở rộng wrap từng section |
| 4 | framer-motion đã cài | Chưa dùng nhất quán — cần animation system thống nhất |
| 5 | HeroUI v3 đã cài | Đang dùng qua custom wrappers — cần bỏ wrappers, dùng trực tiếp |
| 6 | TypeScript strict | `noUnusedLocals`, `noUnusedParameters` bật — tốt cho refactor an toàn |
| 7 | PWA + push notifications | Service worker, VAPID đã hoạt động — giữ nguyên |

### ⚠️ Điểm Yếu Cần Giải Quyết

#### Vấn đề 1: Không có URL Routing

`App.tsx` dùng `useState<ActiveTab>` để điều hướng — không có URL thật.

**Hậu quả:**
- Không bookmark, không share link
- Browser back/forward không hoạt động
- Refresh trang mất state (luôn về dashboard)
- Deep linking không khả thi (`/events/123`)
- Analytics không theo dõi được per-page

#### Vấn đề 2: AppContext quá tải

667 dòng xử lý đồng thời: auth state, data fetching, realtime subscriptions, và tất cả mutations. Không có caching, không có background refetch.

#### Vấn đề 3: Custom UI Wrappers thừa

`src/components/ui/` có 7 wrapper files bọc lại HeroUI — gây ra layer không cần thiết và thiếu nhất quán với HeroUI v3 API.

#### Vấn đề 4: Không có Code Splitting

`App.tsx` import static tất cả 7 screens — user tải toàn bộ code dù chỉ xem 1 tab.

#### Vấn đề 5: Animation rải rác

framer-motion dùng ad-hoc, không có preset thống nhất — gây ra UX không đồng đều giữa các màn hình.

#### Vấn đề 6: Form validation thủ công

Các form (AddEventForm, AddStaffForm...) dùng nhiều `useState` riêng lẻ thay vì schema validation.

---

## 3. Quyết Định Kỹ Thuật Cốt Lõi

### 3.1 Routing: React Router v7

Sử dụng `react-router-dom` v7, thay thế hoàn toàn cơ chế `useState` navigation trong `App.tsx`.

**Cấu trúc route mục tiêu:**
```
/                    → redirect → /dashboard
/dashboard           → <Dashboard />
/schedule            → <Schedule />
/schedule/:eventId   → <EventDetail />
/inventory           → <Inventory />
/finance             → <Finance />
/hr                  → <HRGlobal />
/hr/:staffId         → <StaffProfile />
/profile             → <StaffProfile staffId={myStaffId} />
/clients             → <Clients />
```

**Migration note (App.tsx → Router):**
- `setActiveTab(tab)` → `navigate('/tab')`
- `setSelectedEventId(id)` → `navigate('/schedule/123')`
- `setSelectedStaffId(id)` → `navigate('/hr/456')`
- `selectedEventId` → `useParams<{ eventId: string }>()`
- `isInDetail` → kiểm tra route hiện tại thay vì state
- Scroll-triggered nav visibility logic giữ nguyên trong `Layout.tsx`
- `BottomNav` ẩn khi ở detail route thay vì khi `isInDetail`

### 3.2 Data Fetching: TanStack Query v5

Migrate data fetching ra khỏi AppContext sang custom hooks dùng `useQuery`/`useMutation`.

**Chiến lược migration AppContext (quan trọng):**

AppContext hiện tại đảm nhận 3 việc — cần tách dần:
1. **Auth state** (`currentUser`, `login`, `logout`) → **GIỮ LẠI** trong AppContext vĩnh viễn
2. **Data queries** (fetch events, staff, inventory...) → **MIGRATE** sang TanStack Query hooks
3. **Realtime subscriptions** → **GIỮ LẠI** trong AppContext, dùng để invalidate Query cache

**Migration từng bước — theo thứ tự ưu tiên:**
```
Bước 1: events + event_staff  (dùng nhiều nhất)
Bước 2: inventory + inventory_logs
Bước 3: expenses + finance
Bước 4: staff_members + contracts
Bước 5: clients, registration_requests
```

**Pattern realtime + TanStack Query (đã quyết định):**
```typescript
// AppContext giữ realtime, nhưng thay vì dispatch action
// → sẽ gọi queryClient.invalidateQueries() để TanStack tự refetch

const queryClient = useQueryClient();

supabase.channel('events')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  })
  .subscribe();
```

**Migration note cho Optimistic Updates:**

> **QUAN TRỌNG:** AppContext đã có optimistic updates qua `runWrite()` helper. Khi migrate sang TanStack Query, phải tái tạo pattern này — không phải viết mới từ đầu.

Pattern hiện tại trong AppContext:
```typescript
// 1. Dispatch ngay (optimistic)
dispatch({ type: 'UPDATE_EXPENSE_STATUS', ... });
// 2. Gọi API
const error = await runWrite(() => supabase...);
// 3. Rollback nếu lỗi
if (error) dispatch({ type: 'ROLLBACK_...' });
```

Pattern tương đương với TanStack Query `useMutation`:
```typescript
useMutation({
  mutationFn: (data) => supabase.from('expenses').update(data),
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: ['expenses'] });
    const previous = queryClient.getQueryData(['expenses']);
    queryClient.setQueryData(['expenses'], (old) => /* optimistic update */);
    return { previous };  // snapshot để rollback
  },
  onError: (_err, _data, context) => {
    queryClient.setQueryData(['expenses'], context.previous);  // rollback
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  },
})
```

### 3.3 UI System: HeroUI v3 Native

Bỏ toàn bộ 7 custom wrappers trong `src/components/ui/`, import trực tiếp từ `@heroui/react`.

**Danh sách files sẽ xóa và thay thế:**

| File xóa | Thay bằng (import trực tiếp) |
|----------|------------------------------|
| `src/components/ui/button.tsx` | `import { Button } from '@heroui/react'` |
| `src/components/ui/input.tsx` | `import { Input } from '@heroui/react'` |
| `src/components/ui/select.tsx` | `import { Select, SelectItem } from '@heroui/react'` |
| `src/components/ui/textarea.tsx` | `import { Textarea } from '@heroui/react'` |
| `src/components/ui/dialog.tsx` | `import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'` |
| `src/components/ui/skeleton.tsx` | `import { Skeleton } from '@heroui/react'` |
| `src/components/ui/fab.tsx` | Tích hợp trực tiếp vào component dùng nó |

**Migration note (PHẢI làm theo thứ tự):**
1. Tìm tất cả import từ `'../ui/button'`, `'../../ui/input'`... bằng grep
2. Cập nhật từng file: đổi import + điều chỉnh props API nếu khác
3. Chạy `npm run build` — TypeScript phải pass 0 errors
4. **CHỈ SAU KHI BUILD PASS** mới xóa file wrapper

**Thay thế Accordion bằng Drawer/Modal:**

| Pattern cũ | Pattern mới |
|-----------|------------|
| Accordion mở rộng form inline | `<Drawer>` slide từ dưới lên (mobile) |
| Dialog custom wrapper | `<Modal>` HeroUI native |
| Tab navigation custom | `<Tabs>` HeroUI native |

### 3.4 Form Validation: React Hook Form + Zod

Tích hợp bộ đôi `react-hook-form` + `zod` thay cho pattern nhiều `useState` thủ công hiện tại.

**Migration note (form hiện tại → RHF + Zod):**
```typescript
// Hiện tại trong AddEventForm.tsx (ước tính)
const [name, setName] = useState('');
const [date, setDate] = useState('');
const [error, setError] = useState('');

// Sau khi migrate
const schema = z.object({
  name: z.string().min(1, 'Tên sự kiện là bắt buộc'),
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Định dạng DD-MM-YYYY'),
});
const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
// HeroUI: <Input isInvalid={!!errors.name} errorMessage={errors.name?.message} />
```

---

## 4. Lộ Trình Triển Khai Theo Pha

> **Lý do thứ tự mới (so với bản kế hoạch cũ):**
> Bản cũ đặt Decomposition (Pha 0) trước khi có data layer mới, dẫn đến việc phải sửa lại tất cả các component mới tách khi thêm TanStack Query. Thứ tự đúng: nền tảng kỹ thuật trước → decomposition sau khi architecture ổn định.

---

### Pha 0 — Cài Đặt Nền Tảng & Sinh Types

**Mục tiêu:** Cài đặt tất cả dependencies và sinh TypeScript types từ database trước khi thay đổi bất kỳ logic nào.

#### 0.1 Cài Dependencies

```bash
npm install react-router-dom@^7 \
  @tanstack/react-query@^5 \
  @tanstack/react-query-devtools@^5 \
  react-hook-form@^7 \
  zod@^3 \
  @hookform/resolvers@^3
```

**Lý do không cài TanStack Router:** React Router v7 đã được chọn — TanStack Router có type-safety tốt hơn nhưng học phí cao và không cần thiết ở đây.

#### 0.2 Sinh Supabase TypeScript Types

```bash
# Dùng Supabase MCP hoặc CLI
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.types.ts
```

File output: `src/types/database.types.ts`

**Migration note:**
- Sau khi có file này, cập nhật `src/lib/db.ts` — đổi `type DbRow = Record<string, any>` sang types cụ thể từ `database.types.ts`
- Bất kỳ mismatch nào giữa frontend types và DB schema sẽ báo lỗi TypeScript ngay lập tức
- Giữ `src/types/index.ts` cho business logic types (không liên quan đến DB rows)

#### 0.3 Bọc Provider tại main.tsx

```tsx
// src/main.tsx — sau khi cài
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 phút
      retry: 2,
    },
  },
});

// Thứ tự wrap (từ ngoài vào trong):
// NextThemesProvider > ThemeProvider > BrowserRouter > QueryClientProvider
// > ErrorBoundary > ToastProvider > AppProvider > App
```

**Migration note (main.tsx):** `BrowserRouter` phải nằm ngoài `QueryClientProvider` để routing hoạt động trước khi queries chạy. `ReactQueryDevtools` chỉ render khi `import.meta.env.DEV === true`.

**Checkpoint Pha 0:** `npm run build` phải pass 0 TypeScript errors.

---

### Pha 1 — React Router v7 + Code Splitting

**Mục tiêu:** Thay thế `useState` navigation trong `App.tsx` bằng URL routing thực sự.

#### 1.1 Tạo Layout Component

Tách layout shell ra khỏi `App.tsx` thành `src/components/layout/Layout.tsx`:

```tsx
// src/components/layout/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  // Scroll detection logic (di chuyển từ App.tsx)
  // TopBar, Sidebar, BottomNav render ở đây
  // BottomNav ẩn khi route là /schedule/:eventId hoặc /hr/:staffId
  
  const location = useLocation();
  const isDetail = /\/(schedule|hr)\/.+/.test(location.pathname);
  
  return (
    <div className="h-screen font-sans overflow-hidden">
      <Sidebar ... />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <TopBar ... />
        <main ref={mainRef} className="...">
          <div className="max-w-5xl mx-auto w-full">
            <Outlet />  {/* Các route con render tại đây */}
          </div>
        </main>
        {!isDetail && <BottomNav ... />}
      </div>
    </div>
  );
}
```

#### 1.2 Định nghĩa Routes trong App.tsx

```tsx
// src/App.tsx — sau refactor
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Dashboard   = lazy(() => import('./components/dashboard/Dashboard'));
const Schedule    = lazy(() => import('./components/schedule/Schedule'));
const EventDetail = lazy(() => import('./components/schedule/EventDetail'));
const Inventory   = lazy(() => import('./components/inventory/Inventory'));
const Finance     = lazy(() => import('./components/finance/Finance'));
const HRGlobal    = lazy(() => import('./components/hr/HRGlobal'));
const StaffProfile = lazy(() => import('./components/hr/StaffProfile'));
const Clients     = lazy(() => import('./components/clients/Clients'));

export default function App() {
  const { state } = useApp();
  if (state.loading) return <SplashScreen />;
  if (!state.currentUser) return <LoginScreen />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>
        } />
        <Route path="schedule" element={
          <Suspense fallback={<PageSkeleton />}><Schedule /></Suspense>
        } />
        <Route path="schedule/:eventId" element={
          <Suspense fallback={<PageSkeleton />}><EventDetail /></Suspense>
        } />
        {/* ... các route khác */}
      </Route>
    </Routes>
  );
}
```

#### 1.3 Migration note: Props → Route Params

**Những gì thay đổi khi component nhận params từ route:**

| Trước | Sau |
|-------|-----|
| `<EventDetail eventId={selectedEventId} onBack={...} />` | `<EventDetail />` — dùng `useParams()` |
| `setSelectedEventId(id)` trong Dashboard | `navigate('/schedule/' + id)` |
| `onBack={() => setSelectedEventId(null)}` | `navigate(-1)` hoặc `navigate('/schedule')` |
| `selectedStaffId` state trong App.tsx | `useParams<{staffId: string}>()` trong StaffProfile |

**Migration note: Props cleanup**
- Xóa prop `onSelectEvent` khỏi `Dashboard`, `Schedule`, `Finance`
- Xóa prop `onSelectStaff` khỏi `HRGlobal`
- Xóa prop `onBack` khỏi `EventDetail`, `StaffProfile`
- Xóa prop `onNavigate` khỏi `Dashboard`
- Xóa `selectedEventId`, `selectedStaffId`, `activeTab` state khỏi `App.tsx`

#### 1.4 Route Guards

```tsx
// src/components/layout/ProtectedRoute.tsx
// Bảo vệ /finance, /hr, /clients — chỉ admin + manager
function ManagerRoute({ children }) {
  const { state } = useApp();
  const canView = state.currentUser?.role === 'admin' || state.currentUser?.role === 'manager';
  return canView ? children : <Navigate to="/dashboard" replace />;
}
```

**Checkpoint Pha 1:**
- [ ] Bấm link → URL thay đổi đúng
- [ ] Nhập URL `/schedule` trực tiếp → tải đúng màn hình
- [ ] Bấm Back trình duyệt → điều hướng đúng
- [ ] Network tab: mỗi route chỉ tải chunk JS của nó (code splitting hoạt động)

---

### Pha 2 — TanStack Query Data Layer

**Mục tiêu:** Di chuyển data fetching và mutations ra khỏi AppContext, giữ AppContext chỉ cho auth + realtime.

#### 2.1 Tạo Service Layer

```
src/services/
├── api/
│   ├── events.ts        ← fetchEvents, createEvent, updateEvent, deleteEvent, cloneEvent
│   ├── staff.ts         ← fetchStaff, createStaff, updateStaff, deleteStaff
│   ├── inventory.ts     ← fetchInventory, setInventoryItem, createInventoryItem, deleteInventoryItem, addInventoryLog
│   ├── expenses.ts      ← fetchExpenses, addExpense, updateExpenseStatus
│   ├── finance.ts       ← fetchEventFinancials (computed từ expenses + events)
│   ├── clients.ts       ← fetchClients, addClient, updateClient, deleteClient
│   └── contracts.ts     ← fetchContracts, addContract
```

**Migration note:** Các hàm này là extract từ `src/lib/db.ts` và các mutations trong AppContext — không phải viết lại, chỉ di chuyển và đặt tên rõ hơn.

#### 2.2 Tạo Query Hooks

```
src/hooks/queries/
├── useEventsQuery.ts      ← useQuery(['events'])
├── useEventQuery.ts       ← useQuery(['events', id])
├── useStaffQuery.ts       ← useQuery(['staff'])
├── useInventoryQuery.ts   ← useQuery(['inventory'])
├── useExpensesQuery.ts    ← useQuery(['expenses'])
├── useClientsQuery.ts     ← useQuery(['clients'])
└── mutations/
    ├── useCreateEvent.ts   ← useMutation + optimistic update
    ├── useUpdateEvent.ts
    ├── useApproveExpense.ts ← useMutation + optimistic update (quan trọng)
    ├── useUpdateInventory.ts ← useMutation + optimistic update
    └── ...
```

#### 2.3 Kết nối Realtime → Query Invalidation

Giữ realtime subscriptions trong AppContext, đổi target từ `dispatch` sang `queryClient.invalidateQueries`:

```typescript
// src/context/AppContext.tsx — phần realtime (refactored)
// Thêm useQueryClient() ở đầu AppProvider

const queryClient = useQueryClient();

// Thay vì: dispatch({ type: 'SET_EVENTS', payload: data })
// Dùng: queryClient.invalidateQueries({ queryKey: ['events'] })

const channels = [
  { table: 'events',           queryKey: ['events'] },
  { table: 'staff_members',    queryKey: ['staff'] },
  { table: 'inventory_items',  queryKey: ['inventory'] },
  { table: 'inventory_logs',   queryKey: ['inventory', 'logs'] },
  { table: 'expenses',         queryKey: ['expenses'] },
  { table: 'event_staff',      queryKey: ['events'] },
  { table: 'contracts',        queryKey: ['staff', 'contracts'] },
  { table: 'clients',          queryKey: ['clients'] },
];

channels.forEach(({ table, queryKey }) => {
  supabase.channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      queryClient.invalidateQueries({ queryKey });
    })
    .subscribe();
});
```

**Migration note: AppContext sau Pha 2**

AppContext sẽ co lại còn:
```typescript
// Giữ lại:
- currentUser (auth state)
- loading (auth loading)
- login()
- logout()
- Realtime subscriptions (trigger queryClient.invalidateQueries)

// Xóa dần (theo thứ tự migrate):
- state.events, state.staff, state.inventory, state.expenses, state.clients...
- addEvent(), updateEvent(), deleteEvent()...
- appReducer.ts sẽ giảm từ 30+ actions xuống còn ~5 actions auth
```

#### 2.4 Migration từng Feature (không làm đồng thời)

**Thứ tự migrate an toàn:**

```
Bước 1: Events (ít phụ thuộc nhất từ góc nhìn UI)
  - Tạo useEventsQuery + useCreateEvent
  - Schedule.tsx đổi từ useApp().state.events → useEventsQuery()
  - Kiểm tra realtime vẫn hoạt động
  - Xóa events state + actions khỏi AppContext

Bước 2: Inventory
  - useInventoryQuery + useUpdateInventory (với optimistic update)
  - Test kỹ: thay đổi số lượng tồn kho phải cập nhật ngay lập tức

Bước 3: Expenses + Finance
  - useExpensesQuery + useApproveExpense (với optimistic update)
  - Finance.tsx nhận data từ query thay vì context

Bước 4: Staff + HR
  - useStaffQuery — phức tạp hơn vì có nested contracts

Bước 5: Clients
  - Đơn giản nhất — migrate cuối
```

**Checkpoint Pha 2:**
- [ ] React Query DevTools hiển thị đúng queries và cache state
- [ ] Thay đổi dữ liệu trên một tab → tab khác tự cập nhật (realtime hoạt động)
- [ ] Optimistic updates: bấm "Duyệt chi phí" → UI cập nhật ngay, không cần chờ
- [ ] AppContext giảm xuống < 150 dòng (chỉ còn auth + realtime orchestration)

---

### Pha 3 — Phân Rã Component (Decomposition)

**Mục tiêu:** Tách các file lớn thành modules nhỏ hơn, SAU KHI architecture mới đã ổn định.

> **Lý do làm sau Pha 1 & 2:** Nếu tách component trước khi có TanStack Query, mỗi component mới vẫn dùng AppContext — phải sửa lại toàn bộ khi migrate data layer. Làm sau đảm bảo các component con ngay lập tức dùng đúng pattern mới.

#### 3.1 Finance Module (387 dòng → 6 files)

```
src/components/finance/
├── Finance.tsx              ← Shell + layout, ~50 dòng
├── FinanceSummaryCards.tsx  ← 3 thẻ: tổng thu / tổng chi / lợi nhuận
├── ExpenseList.tsx          ← Danh sách chi phí chờ duyệt (dùng useExpensesQuery)
├── EventFinanceCard.tsx     ← Thẻ tài chính per-event
├── AddExpenseDrawer.tsx     ← HeroUI Drawer — form thêm chi phí mới
└── FinanceExport.tsx        ← Logic xuất Excel (xlsx)
```

**Migration note:** `FinanceSummaryCards` nhận data từ `useExpensesQuery()` — không props drilling. `AddExpenseDrawer` dùng `useCreateExpense()` mutation.

#### 3.2 Inventory Module (408 dòng → 7 files)

```
src/components/inventory/
├── Inventory.tsx            ← Shell + layout, ~60 dòng
├── InventoryTabs.tsx        ← Tab điều hướng: Tất cả / Thực phẩm / Thiết bị
├── InventoryItemList.tsx    ← Danh sách items (dùng useInventoryQuery)
├── InventoryItemRow.tsx     ← Một dòng item (với quick-edit inline)
├── InventoryItemDrawer.tsx  ← HeroUI Drawer — chỉnh sửa item
├── InventoryAddModal.tsx    ← HeroUI Modal — thêm item mới
└── useInventoryFilters.ts   ← Hook quản lý filter/search state cục bộ
```

**Migration note:** `InventoryItemDrawer` thay thế Accordion pattern hiện tại — đây là thay đổi UX lớn nhất của module này.

#### 3.3 Schedule & EventDetail — KHÔNG CẦN TÁCH

> `Schedule.tsx` = 187 dòng, `EventDetail.tsx` = 193 dòng — đây là kích thước hợp lý.
> Kế hoạch cũ đề xuất tách EventDetail thành EventInfoTab, EventStaffTab... — **KHÔNG LÀM** vì chưa cần thiết và tăng độ phức tạp không có giá trị.

Chỉ cần update hai file này để dùng TanStack Query hooks thay vì AppContext data.

#### 3.4 Tạo Shared Skeleton Components

```
src/components/shared/skeletons/
├── PageSkeleton.tsx         ← Full-page loading (dùng với Suspense)
├── CardSkeleton.tsx         ← Thẻ đang tải
└── ListSkeleton.tsx         ← Danh sách đang tải
```

**Checkpoint Pha 3:**
- [ ] Mỗi file component < 200 dòng
- [ ] Không có prop drilling quá 2 cấp
- [ ] `npm run build` pass — không có unused imports

---

### Pha 4 — HeroUI v3 Native & Xóa Custom Wrappers

**Mục tiêu:** Thay thế tất cả 7 custom wrappers bằng HeroUI native, thay Accordion bằng Drawer/Modal.

#### 4.1 Quy trình xóa wrapper (BẮT BUỘC theo thứ tự)

```bash
# Bước 1: Tìm tất cả files đang import từ wrappers
grep -r "from '.*components/ui/button'" src/
grep -r "from '.*components/ui/input'" src/
grep -r "from '.*components/ui/dialog'" src/
# ... repeat cho từng wrapper

# Bước 2: Cập nhật từng import
# Bước 3: npm run build → 0 errors
# Bước 4: Xóa file wrapper
# Bước 5: npm run build lại để xác nhận
```

**Migration note: Props API differences (HeroUI v3)**

| Custom wrapper prop | HeroUI native prop |
|--------------------|-------------------|
| `variant="outline"` | `variant="bordered"` |
| `size="sm/md/lg"` | Giữ nguyên |
| `isLoading` | `isLoading` (giống) |
| `className` | `className` (giống) |
| Dialog `open` | Modal `isOpen` |
| Dialog `onOpenChange` | Modal `onClose` |

#### 4.2 Thay thế Accordion bằng Drawer

Những nơi dùng Accordion để hiện form inline → đổi thành HeroUI Drawer:

```tsx
// Pattern mới cho mọi "bottom sheet" trên mobile
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@heroui/react';

<Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
  <DrawerContent>
    <DrawerHeader>Thêm chi phí</DrawerHeader>
    <DrawerBody>
      {/* form content */}
    </DrawerBody>
    <DrawerFooter>
      <Button onPress={onClose}>Hủy</Button>
      <Button color="primary" onPress={handleSubmit}>Lưu</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

#### 4.3 Animation System Thống Nhất

Tạo preset animations với framer-motion:

```typescript
// src/lib/animations.ts
export const animations = {
  pageEnter: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  drawerSlide: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  listItem: (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.04, duration: 0.2 },
  }),
  press: { whileTap: { scale: 0.97 } },
};
```

**Migration note:** HeroUI Drawer đã có animation built-in — chỉ cần dùng `animations.pageEnter` cho page transitions và `animations.listItem` cho danh sách.

#### 4.4 Design Token System Bổ Sung

Bổ sung vào `src/index.css` (phần `:root`):

```css
:root {
  /* Spacing scale */
  --space-xs: 0.25rem;   --space-sm: 0.5rem;
  --space-md: 1rem;      --space-lg: 1.5rem;
  --space-xl: 2rem;      --space-2xl: 3rem;

  /* Typography */
  --text-xs: 0.75rem;    --text-sm: 0.875rem;
  --text-base: 1rem;     --text-lg: 1.125rem;
  --text-xl: 1.25rem;    --text-2xl: 1.5rem;
  --heading-weight: 800;

  /* Border radius */
  --radius-sm: 0.5rem;   --radius-md: 0.75rem;
  --radius-lg: 1rem;     --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;

  /* Shadows semantic */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-modal: 0 20px 60px -10px rgb(0 0 0 / 0.3);

  /* Z-index scale */
  --z-dropdown: 50;      --z-modal: 100;
  --z-drawer: 110;       --z-toast: 200;
}
```

**Checkpoint Pha 4:**
- [ ] `src/components/ui/` đã xóa hoàn toàn (hoặc chỉ còn `fab.tsx` nếu không migrate)
- [ ] Build pass 0 errors
- [ ] Drawer animation mượt — test trên mobile thật hoặc DevTools > responsive
- [ ] Light mode + Dark mode đều đúng cho tất cả components mới

---

### Pha 5 — React Hook Form + Zod Validation

**Mục tiêu:** Nâng cấp tất cả forms với schema validation và error messages chuyên nghiệp.

#### 5.1 Tạo Validation Schemas

```typescript
// src/lib/validations.ts
import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().min(1, 'Tên sự kiện là bắt buộc').max(100),
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Định dạng: DD-MM-YYYY'),
  location: z.string().min(1, 'Địa điểm là bắt buộc'),
  budget: z.number().positive('Ngân sách phải lớn hơn 0').optional(),
});

export const staffSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
});

export const expenseSchema = z.object({
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  description: z.string().min(1, 'Mô tả là bắt buộc'),
  category: z.enum(['travel', 'taxi', 'food', 'misc']),
});

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Tên mặt hàng là bắt buộc'),
  quantity: z.number().min(0, 'Số lượng không được âm'),
  unit: z.string().min(1, 'Đơn vị là bắt buộc'),
});
```

#### 5.2 Pattern Tích Hợp với HeroUI

```tsx
// Cách kết nối React Hook Form + HeroUI Input
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(eventSchema),
});

<Input
  label="Tên sự kiện"
  {...register('name')}
  isInvalid={!!errors.name}
  errorMessage={errors.name?.message}
/>
```

#### 5.3 Danh Sách Forms Cần Migrate

| Form | File | Ưu tiên |
|------|------|---------|
| Thêm/sửa sự kiện | `AddEventForm.tsx` | Cao |
| Thêm nhân viên | `AddStaffForm.tsx` | Cao |
| Thêm chi phí | `AddExpenseDrawer.tsx` (mới) | Cao |
| Sửa mặt hàng kho | `InventoryItemDrawer.tsx` (mới) | Trung bình |
| Thêm khách hàng | Trong `Clients.tsx` | Trung bình |
| Đăng ký tài khoản | `LoginScreen.tsx` | Thấp |

**Checkpoint Pha 5:**
- [ ] Submit form rỗng → hiện error messages đúng field
- [ ] Error message biến mất khi user bắt đầu nhập đúng
- [ ] `npm run test` pass — thêm unit tests cho validation schemas

---

## 5. Đề Xuất Bổ Sung Nâng Cao

*Các đề xuất này không thuộc lộ trình 6 pha ở trên, nhưng nên xem xét song song hoặc sau khi hoàn thành.*

### A. Error Boundary Mở Rộng

Hiện `ErrorBoundary` chỉ wrap toàn app (trong `main.tsx`). Cần wrap từng section:

```tsx
<ErrorBoundary fallback={<SectionError title="Finance" onRetry={refetch} />}>
  <Suspense fallback={<FinanceSkeleton />}>
    <Finance />
  </Suspense>
</ErrorBoundary>
```

**Lợi ích:** Finance crash không kéo sập toàn bộ app.

### B. Supabase Types Auto-generation (đã đề cập ở Pha 0)

Hiện `src/lib/db.ts` dùng `type DbRow = Record<string, any>`. Sau khi gen types:
- Mọi thay đổi schema trên Supabase Dashboard → lỗi TypeScript ngay lập tức
- Loại bỏ runtime type errors

### C. React Query DevTools

```tsx
// src/main.tsx
{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
```

**Lợi ích:** Debug cache state, query lifecycle (stale/fetching/inactive) trực tiếp trên trình duyệt.

### D. Bundle Analyzer

```bash
npm install --save-dev rollup-plugin-visualizer
```

Thêm vào `vite.config.ts` để theo dõi bundle size khi thêm HeroUI components.

### E. Web Vitals Tracking

Đã có Vercel Speed Insights. Chú ý đặc biệt:
- **CLS (Cumulative Layout Shift):** Khi đổi Accordion → Drawer, CLS có thể giảm đáng kể — cần verify
- **LCP (Largest Contentful Paint):** Code splitting ở Pha 1 nên giảm LCP trên mobile

### F. Internationalization (i18n) Foundation

> App hiện hard-code tiếng Việt. Nếu tương lai cần hỗ trợ tiếng Anh/Pháp, phải refactor toàn bộ.

Nếu quyết định làm, chuẩn bị sẵn:
```
src/i18n/
├── vi.json   ← Tất cả strings tiếng Việt
└── index.ts  ← useTranslation hook
```

### G. Offline Queue (Nâng cao)

Service worker đã có (network-first strategy). Để thêm offline mutation queue:
- Khi offline, mutations được queue vào IndexedDB
- Khi online lại, replay queue tự động

Pattern này được dùng trong Shopify POS, Square POS — phức tạp, chỉ làm nếu có yêu cầu business rõ ràng.

### H. Testing Strategy

Hiện tại có 3 test files (unit tests cho lib/). Nên bổ sung:

```
Testing pyramid:
├── Unit tests (lib/, validation schemas)    ← Mở rộng từ hiện có
├── Component tests (vitest + testing-library) ← THIẾU
│   - Modal/Drawer mở/đóng đúng
│   - Form validation hiển thị đúng error
│   - Filter logic trong Schedule, Finance
└── E2E tests (Playwright)                   ← Tương lai
```

---

## 6. Quy Trình Xác Minh & Kiểm Thử

### Automated (sau mỗi pha)

```bash
npm run build    # TypeScript + build — phải pass 0 errors
npm run lint     # ESLint — phải pass 0 warnings
npm run test     # Unit tests — phải pass
```

### Manual Checklist

#### Sau Pha 1 (Routing)
- [ ] Click từng tab → URL đổi đúng (`/schedule`, `/inventory`...)
- [ ] Nhập URL `/schedule/123` trực tiếp → mở EventDetail đúng
- [ ] Bấm Back trình duyệt → điều hướng đúng
- [ ] Refresh trang tại `/hr` → không bị redirect về dashboard
- [ ] Network tab: chunk splitting hoạt động (mỗi route = 1 chunk riêng)

#### Sau Pha 2 (TanStack Query)
- [ ] React Query DevTools hiển thị queries và cache
- [ ] Mở 2 tab trình duyệt → thay đổi ở tab 1 → tab 2 tự cập nhật (realtime)
- [ ] Duyệt chi phí → UI cập nhật ngay không chờ API (optimistic)
- [ ] Ngắt mạng → thay đổi → cắm mạng lại → rollback đúng

#### Sau Pha 3 (Decomposition)
- [ ] Tất cả features hoạt động như trước (không regression)
- [ ] Không có prop drilling quá 2 cấp
- [ ] Mỗi file < 200 dòng

#### Sau Pha 4 (HeroUI)
- [ ] `src/components/ui/` không còn files nào (hoặc chỉ còn items thực sự custom)
- [ ] Drawer animation mượt — test trên mobile (DevTools > responsive > iPhone)
- [ ] Light mode + Dark mode đúng cho tất cả components mới
- [ ] Không có Layout Shift khi Drawer mở/đóng (Chrome DevTools > Performance > CLS)

#### Sau Pha 5 (Forms)
- [ ] Submit form rỗng → tất cả required fields hiện error
- [ ] Error message biến mất khi user nhập đúng (real-time validation)
- [ ] Keyboard navigation hoạt động (Tab giữa các fields)

---

## Ghi Chú Kiến Trúc Quan Trọng

### AppContext sau khi hoàn thành toàn bộ 5 pha

```typescript
// Cấu trúc AppContext cuối cùng (~100-150 dòng thay vì 667)
interface AppContextValue {
  // Auth (vĩnh viễn ở đây)
  currentUser: CurrentUser | null;
  loading: boolean;
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
  
  // Realtime orchestration (không expose ra ngoài — internal only)
  // Tất cả data đã chuyển sang TanStack Query hooks
}
```

### Query Keys Convention

Dùng nhất quán để invalidation hoạt động đúng:

```typescript
export const queryKeys = {
  events: ['events'] as const,
  event: (id: number) => ['events', id] as const,
  staff: ['staff'] as const,
  staffMember: (id: string) => ['staff', id] as const,
  inventory: ['inventory'] as const,
  expenses: ['expenses'] as const,
  expensesByEvent: (eventId: number) => ['expenses', 'event', eventId] as const,
  clients: ['clients'] as const,
} as const;
```

### Không Làm Trong Lộ Trình Này

- Redux, Zustand, Jotai — AppContext + TanStack Query là đủ
- Server-side rendering / Next.js migration — out of scope
- Offline mutation queue — chỉ làm khi có yêu cầu business cụ thể
- Tách Schedule.tsx và EventDetail.tsx — kích thước hiện tại hợp lý
