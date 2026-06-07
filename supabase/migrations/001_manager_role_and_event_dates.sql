-- =============================================================================
-- MIGRATION: Add manager role, user status, event end_date
-- Run this in the Supabase SQL editor for existing databases
-- =============================================================================

-- 1. Add 'manager' to users role check and add status column
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'staff'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'rejected'));

-- 2. Add end_date column to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_date text;

-- 3. Add is_manager() helper function
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'manager' AND status = 'active'
  );
$$;

-- 4. RLS policies for manager (read-only access to all data)
DO $$
BEGIN
  -- users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users: manager read all'
  ) THEN
    CREATE POLICY "users: manager read all"
      ON public.users FOR SELECT
      USING (public.is_manager());
  END IF;

  -- events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events: manager read all'
  ) THEN
    CREATE POLICY "events: manager read all"
      ON public.events FOR SELECT
      USING (public.is_manager());
  END IF;

  -- staff_members
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_members' AND policyname = 'staff_members: manager read all'
  ) THEN
    CREATE POLICY "staff_members: manager read all"
      ON public.staff_members FOR SELECT
      USING (public.is_manager());
  END IF;

  -- contracts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'contracts: manager read all'
  ) THEN
    CREATE POLICY "contracts: manager read all"
      ON public.contracts FOR SELECT
      USING (public.is_manager());
  END IF;

  -- event_staff
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_staff' AND policyname = 'event_staff: manager read all'
  ) THEN
    CREATE POLICY "event_staff: manager read all"
      ON public.event_staff FOR SELECT
      USING (public.is_manager());
  END IF;

  -- expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'expenses: manager read all'
  ) THEN
    CREATE POLICY "expenses: manager read all"
      ON public.expenses FOR SELECT
      USING (public.is_manager());
  END IF;
END $$;
