-- Force Supabase PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Re-apply RLS to student_streaks to ensure it's picked up
ALTER TABLE public.student_streaks ENABLE ROW LEVEL SECURITY;

-- Re-create policy to force metadata update
DROP POLICY IF EXISTS "Students can view own streak" ON public.student_streaks;
CREATE POLICY "Students can view own streak"
    ON public.student_streaks FOR SELECT
    USING (auth.uid() = student_id);

-- Ensure permissions are granted to authenticated users
GRANT ALL ON public.student_streaks TO authenticated;
GRANT ALL ON public.student_streaks TO service_role;
