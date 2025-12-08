-- Comprehensive RLS Policy Fix for Mastery Tracking

-- 1. Student Mastery Table
ALTER TABLE public.student_mastery ENABLE ROW LEVEL SECURITY;

-- Allow students to VIEW their own mastery
DROP POLICY IF EXISTS "Students can view own mastery" ON public.student_mastery;
CREATE POLICY "Students can view own mastery"
    ON public.student_mastery FOR SELECT
    USING (auth.uid() = student_id);

-- Allow students to INSERT their own mastery
DROP POLICY IF EXISTS "Students can insert own mastery" ON public.student_mastery;
CREATE POLICY "Students can insert own mastery"
    ON public.student_mastery FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Allow students to UPDATE their own mastery
DROP POLICY IF EXISTS "Students can update own mastery" ON public.student_mastery;
CREATE POLICY "Students can update own mastery"
    ON public.student_mastery FOR UPDATE
    USING (auth.uid() = student_id);


-- 2. Mastery History Table
ALTER TABLE public.mastery_history ENABLE ROW LEVEL SECURITY;

-- Allow students to VIEW their own history
DROP POLICY IF EXISTS "Students can view own history" ON public.mastery_history;
CREATE POLICY "Students can view own history"
    ON public.mastery_history FOR SELECT
    USING (auth.uid() = student_id);

-- Allow students to INSERT their own history
DROP POLICY IF EXISTS "Students can insert own history" ON public.mastery_history;
CREATE POLICY "Students can insert own history"
    ON public.mastery_history FOR INSERT
    WITH CHECK (auth.uid() = student_id);


-- 3. Tedris Plan Table (just in case)
ALTER TABLE public.tedris_plan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own plan" ON public.tedris_plan;
CREATE POLICY "Students can view own plan"
    ON public.tedris_plan FOR SELECT
    USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own plan" ON public.tedris_plan;
CREATE POLICY "Students can update own plan"
    ON public.tedris_plan FOR UPDATE
    USING (auth.uid() = student_id);

-- Grant privileges to authenticated users
GRANT ALL ON public.student_mastery TO authenticated;
GRANT ALL ON public.mastery_history TO authenticated;
GRANT ALL ON public.tedris_plan TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
