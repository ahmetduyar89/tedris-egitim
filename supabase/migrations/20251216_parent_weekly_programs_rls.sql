-- Add RLS policy for parents to view weekly programs
-- Date: 2025-12-16

-- ============================================================================
-- WEEKLY PROGRAMS - PARENT ACCESS
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.weekly_programs ENABLE ROW LEVEL SECURITY;

-- Drop existing parent policy if exists
DROP POLICY IF EXISTS "Parents can view their children's weekly programs" ON public.weekly_programs;

-- Create policy for parents to view their children's weekly programs
CREATE POLICY "Parents can view their children's weekly programs"
    ON public.weekly_programs FOR SELECT
    USING (
        student_id IN (
            SELECT student_id 
            FROM public.parent_student_relations 
            WHERE parent_id = auth.uid()
        )
    );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_programs_student_id 
    ON public.weekly_programs(student_id);

COMMENT ON POLICY "Parents can view their children's weekly programs" ON public.weekly_programs IS 
'Velilerin çocuklarının haftalık programlarını görüntülemesine izin verir';
