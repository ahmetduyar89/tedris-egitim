-- Create private_lessons table
CREATE TABLE IF NOT EXISTS public.private_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL, -- Can be null if student is not in system yet
    student_name TEXT, -- For external students or quick entry
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.private_lessons ENABLE ROW LEVEL SECURITY;

-- Tutors can view/edit their own lessons
DROP POLICY IF EXISTS "Tutors can view their own lessons" ON public.private_lessons;
CREATE POLICY "Tutors can view their own lessons"
    ON public.private_lessons
    FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can insert their own lessons" ON public.private_lessons;
CREATE POLICY "Tutors can insert their own lessons"
    ON public.private_lessons
    FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their own lessons" ON public.private_lessons;
CREATE POLICY "Tutors can update their own lessons"
    ON public.private_lessons
    FOR UPDATE
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete their own lessons" ON public.private_lessons;
CREATE POLICY "Tutors can delete their own lessons"
    ON public.private_lessons
    FOR DELETE
    USING (auth.uid() = tutor_id);

-- Students can view lessons assigned to them
DROP POLICY IF EXISTS "Students can view their own lessons" ON public.private_lessons;
CREATE POLICY "Students can view their own lessons"
    ON public.private_lessons
    FOR SELECT
    USING (auth.uid() = student_id);


-- Create indexes
CREATE INDEX IF NOT EXISTS idx_private_lessons_tutor_id ON public.private_lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_private_lessons_student_id ON public.private_lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_private_lessons_start_time ON public.private_lessons(start_time);

