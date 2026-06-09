# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                 # Install dependencies
cp .env.example .env        # Configure Supabase + VAPID keys before first run

npm run dev                 # Vite dev server at localhost:5173
npm run build               # tsc -b && vite build → dist/
npm run preview             # Preview production build locally

npm test                    # Run Vitest (33 tests)
npm run test:watch          # Watch mode
npm run lint                # ESLint (flat config, must pass with 0 errors)
```

Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`.

## Architecture

**FestManager** is a PWA for event/F&B management built on React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase.

### State Management

All global state lives in `src/context/AppContext.tsx` (848 lines). State mutations go through `src/lib/appReducer.ts` — a pure reducer with 20+ action types covering events, staff, inventory, expenses, and clients. This is the primary place to add new state logic.

Navigation is currently `useState`-based (no React Router yet) — active view is stored in context.

### Data Layer

- **`src/lib/db.ts`** — All Supabase query helpers. Fetch from here, dispatch to reducer.
- **`src/lib/adminApi.ts`** — Calls the Supabase Edge Function `admin` for privileged ops (no service key on frontend). The Edge Function lives at `supabase/functions/admin/index.ts`.
- **`src/types/index.ts`** — Single source of truth for all TypeScript types.

### Component Tree

```
src/components/
├── layout/      — Header, BottomNav, Sidebar, LoginScreen
├── dashboard/   — Stats, revenue chart, event list
├── schedule/    — EventDetail with tabs (Info, Staff, Expenses, Inventory, Contracts)
├── inventory/   — Food/Equipment dual categories, bulk xlsx import, history log
├── finance/     — Revenue/expense dashboard, approval workflow, Excel export
├── hr/          — Staff list, StaffProfile, AddStaffForm
├── clients/     — Organizer/partner management
└── shared/      — Reusable UI: Button, Input, Modal, Skeleton, Toast, ErrorBoundary
```

Heavy libraries (`xlsx`, `@react-pdf`) are lazy-loaded via dynamic imports — Vite splits them as separate chunks.

### Backend (Supabase)

13 tables defined in `supabase/schema.sql`. Key tables: `users`, `staff_members`, `contracts`, `events` (JSONB for expenses/inventory), `event_staff`, `inventory_items`, `inventory_logs`, `expenses`, `clients`. All tables have RLS policies.

The `admin` Edge Function handles: `register`, `create-staff`, `set-password`, `delete-user`, `get-user-email`. All admin actions verify JWT + `role='admin'`.

### Design System — "Warm Feast"

Colors defined in `tailwind.config.js`: primary orange (`#F97316`), secondary yellow (`#EAB308`), success green (`#22C55E`), warm surface (`#FFFBF5`). Dark mode is toggled via `ThemeContext` with localStorage persistence. Font: Plus Jakarta Sans.

Custom Tailwind tokens: `safe-area-*` insets, `bottom-nav-height`, `card`, `warm`, `hero`, `float` shadows, `fadeUp`/`slideUp`/`pop`/`shimmer` animations.

### Key Hooks

- `useApp()` — access AppContext (state + dispatch)
- `useToast()` — trigger toast notifications
- `useTheme()` — dark/light toggle
- `usePushNotifications()` — Web Push (VAPID)
- `useRealtimeNotifications()` — Supabase Realtime listener

## Known TODOs (from docs/)

- React Router (replace useState navigation)
- TanStack Query (replace full-table refetches)
- Split AppContext into domain stores (Zustand or smaller contexts)
- Component tests (React Testing Library)
- Random temp passwords (currently hardcoded `'fest1234'`)
- Deploy Edge Function `admin` for production
