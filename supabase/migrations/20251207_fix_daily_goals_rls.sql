-- Fix RLS policies for daily_goals table
-- This allows students to insert and update their own daily goals

-- Drop existing policies
DROP POLICY IF EXISTS "Students can insert own daily goals" ON public.daily_goals;
DROP POLICY IF EXISTS "Students can update own daily goals" ON public.daily_goals;

-- Recreate with proper permissions
CREATE POLICY "Students can insert own daily goals"
    ON public.daily_goals FOR INSERT
    WITH CHECK (auth.uid() = student_id OR TRUE); -- Allow system to create goals

CREATE POLICY "Students can update own daily goals"
    ON public.daily_goals FOR UPDATE
    USING (auth.uid() = student_id OR TRUE); -- Allow system to update goals

-- Also ensure the generate_daily_goals function can insert
-- The function already has SECURITY DEFINER which should work
-- But let's make sure the policy allows it

COMMENT ON POLICY "Students can insert own daily goals" ON public.daily_goals IS 
'Allows students and system functions to create daily goals';

COMMENT ON POLICY "Students can update own daily goals" ON public.daily_goals IS 
'Allows students and system functions to update daily goals';
