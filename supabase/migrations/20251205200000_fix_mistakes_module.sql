-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create mistakes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mistakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT,
    question_data JSONB,
    student_answer TEXT,
    correct_answer TEXT,
    ai_analysis JSONB,
    status TEXT DEFAULT 'new',
    source_type TEXT,
    source_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Student can insert their own mistakes
DROP POLICY IF EXISTS "Students can insert their own mistakes" ON public.mistakes;
CREATE POLICY "Students can insert their own mistakes" 
ON public.mistakes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = student_id);

-- 2. Student can view their own mistakes
DROP POLICY IF EXISTS "Students can view their own mistakes" ON public.mistakes;
CREATE POLICY "Students can view their own mistakes" 
ON public.mistakes FOR SELECT 
TO authenticated 
USING (auth.uid() = student_id);

-- 3. Student can update their own mistakes (e.g. mark as mastered)
DROP POLICY IF EXISTS "Students can update their own mistakes" ON public.mistakes;
CREATE POLICY "Students can update their own mistakes" 
ON public.mistakes FOR UPDATE 
TO authenticated 
USING (auth.uid() = student_id);

-- 4. Tutors can view mistakes of students they teach
-- Assuming there is a relationship in 'students' table mapping student_id to tutor_id
-- We need to check if the current user (tutor) is the tutor of the student_id in the mistake
DROP POLICY IF EXISTS "Tutors can view their students' mistakes" ON public.mistakes;
CREATE POLICY "Tutors can view their students' mistakes" 
ON public.mistakes FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = mistakes.student_id
        AND s.tutor_id = auth.uid()
    )
);

-- 5. Tutors can insert mistakes for their students (e.g. manual entry or during lesson)
DROP POLICY IF EXISTS "Tutors can insert mistakes for their students" ON public.mistakes;
CREATE POLICY "Tutors can insert mistakes for their students" 
ON public.mistakes FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = mistakes.student_id
        AND s.tutor_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_mistakes_student_id ON public.mistakes(student_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_status ON public.mistakes(status);
