-- Migration: Add is_premium column to students table
-- Date: 2026-01-14

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Update existing records can stay FALSE by default or you can set some to TRUE if needed
-- UPDATE public.students SET is_premium = TRUE WHERE ...;
