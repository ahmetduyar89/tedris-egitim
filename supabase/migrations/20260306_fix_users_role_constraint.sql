-- Migration: Fix users role constraint to allow parent and admin roles
-- Date: 2026-03-06

-- 1. Drop existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add updated constraint
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('tutor', 'student', 'parent', 'admin'));

-- 3. Ensure profiles table also has similar constraints if any (it doesn't seem to have one in the migration)

-- 4. Fix any existing data that might be inconsistent (optional but good)
UPDATE public.users SET role = 'parent' WHERE id IN (SELECT id FROM public.parents);
