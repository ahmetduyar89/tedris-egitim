-- Allow students to insert/update their own mastery records
ALTER TABLE public.student_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert own mastery" ON public.student_mastery;
CREATE POLICY "Students can insert own mastery"
    ON public.student_mastery FOR INSERT
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own mastery" ON public.student_mastery;
CREATE POLICY "Students can update own mastery"
    ON public.student_mastery FOR UPDATE
    USING (auth.uid() = student_id);

-- Allow students to insert detailed history
ALTER TABLE public.mastery_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert own history" ON public.mastery_history;
CREATE POLICY "Students can insert own history"
    ON public.mastery_history FOR INSERT
    WITH CHECK (auth.uid() = student_id);
    
DROP POLICY IF EXISTS "Students can view own history" ON public.mastery_history;
CREATE POLICY "Students can view own history"
    ON public.mastery_history FOR SELECT
    USING (auth.uid() = student_id);
    
-- Ensure stored procedure permissions if used
GRANT EXECUTE ON FUNCTION update_student_streak TO authenticated;
GRANT EXECUTE ON FUNCTION generate_daily_goals TO authenticated;
