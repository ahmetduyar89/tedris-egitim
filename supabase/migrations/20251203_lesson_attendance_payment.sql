-- Create lesson_attendance table for tracking lesson completion and payments
CREATE TABLE IF NOT EXISTS public.lesson_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.private_lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    attendance_status TEXT NOT NULL CHECK (attendance_status IN ('completed', 'missed', 'cancelled')),
    payment_amount DECIMAL(10, 2),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
    payment_date TIMESTAMPTZ,
    payment_notes TEXT,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_payment_config table for per-student lesson pricing
CREATE TABLE IF NOT EXISTS public.student_payment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    per_lesson_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'TL',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, tutor_id)
);

-- Add RLS policies for lesson_attendance
ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;

-- Tutors can view their own lesson attendance records
DROP POLICY IF EXISTS "Tutors can view their lesson attendance" ON public.lesson_attendance;
CREATE POLICY "Tutors can view their lesson attendance"
    ON public.lesson_attendance
    FOR SELECT
    USING (auth.uid() = tutor_id);

-- Tutors can insert attendance records for their lessons
DROP POLICY IF EXISTS "Tutors can insert lesson attendance" ON public.lesson_attendance;
CREATE POLICY "Tutors can insert lesson attendance"
    ON public.lesson_attendance
    FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

-- Tutors can update their own lesson attendance records
DROP POLICY IF EXISTS "Tutors can update lesson attendance" ON public.lesson_attendance;
CREATE POLICY "Tutors can update lesson attendance"
    ON public.lesson_attendance
    FOR UPDATE
    USING (auth.uid() = tutor_id);

-- Tutors can delete their own lesson attendance records
DROP POLICY IF EXISTS "Tutors can delete lesson attendance" ON public.lesson_attendance;
CREATE POLICY "Tutors can delete lesson attendance"
    ON public.lesson_attendance
    FOR DELETE
    USING (auth.uid() = tutor_id);

-- Students can view their own lesson attendance
DROP POLICY IF EXISTS "Students can view their lesson attendance" ON public.lesson_attendance;
CREATE POLICY "Students can view their lesson attendance"
    ON public.lesson_attendance
    FOR SELECT
    USING (auth.uid() = student_id);

-- Add RLS policies for student_payment_config
ALTER TABLE public.student_payment_config ENABLE ROW LEVEL SECURITY;

-- Tutors can view payment configs for their students
DROP POLICY IF EXISTS "Tutors can view student payment configs" ON public.student_payment_config;
CREATE POLICY "Tutors can view student payment configs"
    ON public.student_payment_config
    FOR SELECT
    USING (auth.uid() = tutor_id);

-- Tutors can insert payment configs for their students
DROP POLICY IF EXISTS "Tutors can insert student payment configs" ON public.student_payment_config;
CREATE POLICY "Tutors can insert student payment configs"
    ON public.student_payment_config
    FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

-- Tutors can update payment configs for their students
DROP POLICY IF EXISTS "Tutors can update student payment configs" ON public.student_payment_config;
CREATE POLICY "Tutors can update student payment configs"
    ON public.student_payment_config
    FOR UPDATE
    USING (auth.uid() = tutor_id);

-- Tutors can delete payment configs for their students
DROP POLICY IF EXISTS "Tutors can delete student payment configs" ON public.student_payment_config;
CREATE POLICY "Tutors can delete student payment configs"
    ON public.student_payment_config
    FOR DELETE
    USING (auth.uid() = tutor_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_lesson_id ON public.lesson_attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_student_id ON public.lesson_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_tutor_id ON public.lesson_attendance(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_status ON public.lesson_attendance(attendance_status);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_payment_status ON public.lesson_attendance(payment_status);

CREATE INDEX IF NOT EXISTS idx_student_payment_config_student_id ON public.student_payment_config(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payment_config_tutor_id ON public.student_payment_config(tutor_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at timestamp
DROP TRIGGER IF EXISTS update_lesson_attendance_updated_at ON public.lesson_attendance;
CREATE TRIGGER update_lesson_attendance_updated_at
    BEFORE UPDATE ON public.lesson_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_payment_config_updated_at ON public.student_payment_config;
CREATE TRIGGER update_student_payment_config_updated_at
    BEFORE UPDATE ON public.student_payment_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
