-- Create pdf_test_assignments table
-- This table tracks which PDF tests are assigned to which students

CREATE TABLE IF NOT EXISTS public.pdf_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_test_id UUID NOT NULL REFERENCES public.pdf_tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a student can't have the same test assigned multiple times
    UNIQUE(pdf_test_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pdf_test_assignments_student 
    ON public.pdf_test_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_pdf_test_assignments_test 
    ON public.pdf_test_assignments(pdf_test_id);
CREATE INDEX IF NOT EXISTS idx_pdf_test_assignments_status 
    ON public.pdf_test_assignments(status);

-- Enable Row Level Security
ALTER TABLE public.pdf_test_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_test_assignments

-- Students can view their own assignments
CREATE POLICY "Students can view their own PDF test assignments"
    ON public.pdf_test_assignments
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE id = auth.uid()
        )
    );

-- Tutors can view assignments for their students
CREATE POLICY "Tutors can view PDF test assignments for their students"
    ON public.pdf_test_assignments
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

-- Tutors can create assignments for their students
CREATE POLICY "Tutors can create PDF test assignments for their students"
    ON public.pdf_test_assignments
    FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

-- Tutors can update assignments for their students
CREATE POLICY "Tutors can update PDF test assignments for their students"
    ON public.pdf_test_assignments
    FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

-- Tutors can delete assignments for their students
CREATE POLICY "Tutors can delete PDF test assignments for their students"
    ON public.pdf_test_assignments
    FOR DELETE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

-- Students can update their own assignment status
CREATE POLICY "Students can update their own PDF test assignment status"
    ON public.pdf_test_assignments
    FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pdf_test_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdf_test_assignments_updated_at
    BEFORE UPDATE ON public.pdf_test_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_test_assignments_updated_at();
