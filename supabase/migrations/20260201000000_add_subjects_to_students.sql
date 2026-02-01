-- Migration to add subjects column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}'::TEXT[];

-- Ensure the column is accessible in the schema cache
-- (Supabase/PostgREST usually picks this up automatically, but explicit reload might be needed via dashboards)
