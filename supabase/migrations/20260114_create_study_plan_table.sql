-- Migration: Create Study Plan Table
-- Date: 2026-01-14

-- 1. study_plan table
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    task_description TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- 2. Policies for study_plans
-- Students can manage their own plans
DROP POLICY IF EXISTS "Students can manage their own study plans" ON public.study_plans;
CREATE POLICY "Students can manage their own study plans"
    ON public.study_plans FOR ALL
    TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- Tutors can view and manage their students' plans
DROP POLICY IF EXISTS "Tutors can manage their students' study plans" ON public.study_plans;
CREATE POLICY "Tutors can manage their students' study plans"
    ON public.study_plans FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = study_plans.student_id 
            AND students.tutor_id = auth.uid()
        )
    );

-- Parents can view their children's plans
DROP POLICY IF EXISTS "Parents can view their children's study plans" ON public.study_plans;
CREATE POLICY "Parents can view their children's study plans"
    ON public.study_plans FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = study_plans.student_id 
            AND students.parent_id = auth.uid()
        )
    );

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_plans_student_date ON public.study_plans(student_id, date);
CREATE INDEX IF NOT EXISTS idx_study_plans_completed ON public.study_plans(completed);
