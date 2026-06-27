# FestManager — Kiến Trúc Kỹ Thuật

## Stack

| Layer | Công nghệ |
|-------|-----------|
| UI | React 19 + HeroUI v3.2 + Tailwind CSS 4 |
| Routing | React Router v7 (lazy + Suspense) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form v7 + Zod |
| Auth + DB | Supabase (PostgreSQL + RLS + Realtime) |
| Build | Vite 8 + TypeScript |
| Deploy | Vercel |

## Luồng Dữ Liệu

```
Component
  └── hooks/queries/use*Query.ts       ← TanStack Query (cache, loading, error)
        └── services/api/*.ts          ← Supabase fetch functions
              └── lib/supabase.ts      ← Supabase client (anon key)
```

Mutations đi qua cùng layer nhưng ngược chiều:

```
Component → hooks/queries/mutations/use*Mutation.ts → services/api/*.ts → Supabase
```

## Phân Tầng services/api/

| File | Fetch functions | Mutation functions |
|------|-----------------|--------------------|
| `events.ts` | `fetchEvents` | `apiCreateEvent`, `apiUpdateEvent`, `apiDeleteEvent`, `apiCloneEvent`, `apiAddExpense`, `apiUpdateExpenseStatus`, `apiAddStaffToEvent`, `apiRemoveStaffFromEvent` |
| `staff.ts` | `fetchStaff` | `apiCreateStaff`, `apiUpdateStaff`, `apiDeleteStaff`, `apiAddContract` |
| `inventory.ts` | `fetchInventory`, `fetchInventoryLogs` | `apiSetInventoryItem`, `apiCreateInventoryItem`, `apiDeleteInventoryItem`, `apiUpdateInventoryUnit`, `apiUpdateInventoryItem`, `apiAddInventoryLog` |
| `clients.ts` | `fetchClients`, `fetchPendingRegistrations` | `apiAddClient`, `apiUpdateClient`, `apiDeleteClient`, `apiApproveRegistration`, `apiRejectRegistration` |

## Auth Flow

1. `main.tsx` — Provider tree: NextThemes → ThemeContext → Router → QueryClient → ErrorBoundary → Toast → App → FAB
2. `AppContext` — `onAuthStateChange` listener → dispatch `LOGIN`/`LOGOUT` → invalidate query cache
3. `ProtectedRoute` — redirect nếu chưa đăng nhập
4. Edge Functions (`supabase/functions/admin/`) — tác vụ admin (tạo/xóa user) dùng service role key, không expose ra frontend

## State Management

- **Server state:** TanStack Query — fetch, cache, invalidate
- **Auth:** `AppContext` (useReducer) — `currentUser`, `loading`
- **UI theme:** `ThemeContext` — dark/light + accent, sync Supabase `user_metadata`
- **Toasts:** `ToastContext`
- **FAB:** `FABContext` — floating action button đăng ký per-page

## Cấu Trúc Thư Mục

```
src/
├── components/       # UI features (clients, dashboard, finance, hr, inventory, layout, schedule, shared)
├── context/          # React context + reducers
├── hooks/
│   ├── queries/      # TanStack Query hooks
│   │   └── mutations/
│   └── *.ts          # Custom hooks (FAB, push, realtime, keyboard...)
├── lib/              # Pure utilities (supabase client, dateHelpers, queryKeys, validations, animations...)
├── services/api/     # Supabase data functions (fetch + mutations)
├── test/
│   ├── setup.ts      # Vitest + Testing Library + MSW setup
│   └── fixtures/     # Static mock data dùng cho dev/test
└── types/            # TypeScript interfaces + generated Supabase types
```

## PWA

- Service Worker: `public/sw.js` — network-first cho HTML, cache-first cho assets
- Web Push: VAPID via `usePushNotifications` → `push_subscriptions` table
- iOS safe area: không dùng `viewport-fit=cover` (xem CLAUDE.md → iOS standalone section)
