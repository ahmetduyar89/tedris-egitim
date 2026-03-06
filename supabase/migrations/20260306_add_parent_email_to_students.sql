-- Migration to add parent_email and ensure parent_id to students table
-- Date: 2026-03-06

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON public.students(parent_email);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);

-- Update RLS policies to allow tutors to manage these fields
-- (Assuming tutors already have UPDATE/INSERT permission on students table)
