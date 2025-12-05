-- Drop policies first (cascade should handle it but being explicit is good)
DROP POLICY IF EXISTS "Students can insert their own mistakes" ON public.mistakes;
DROP POLICY IF EXISTS "Students can view their own mistakes" ON public.mistakes;
DROP POLICY IF EXISTS "Students can update their own mistakes" ON public.mistakes;
DROP POLICY IF EXISTS "Tutors can view their students' mistakes" ON public.mistakes;
DROP POLICY IF EXISTS "Tutors can insert mistakes for their students" ON public.mistakes;

-- Drop the table
DROP TABLE IF EXISTS public.mistakes CASCADE;
