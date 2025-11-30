-- ============================================
-- ÖZEL DERS PROGRAMI KURULUMU
-- ============================================

-- 1. Eğitmenlerin tüm öğrencileri görebilmesi için izin ver
DROP POLICY IF EXISTS "Tutors can read assigned students" ON public.students;
DROP POLICY IF EXISTS "Tutors can view their students" ON public.students;

CREATE POLICY "Tutors can view all students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is a tutor
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'tutor'
    )
    OR
    -- Allow if user is the student themselves
    auth.uid() = id
    OR
    -- Allow if user is the assigned tutor
    tutor_id = auth.uid()
  );

-- 2. private_lessons tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.private_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS politikalarını ekle
ALTER TABLE public.private_lessons ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Students can view their own lessons" ON public.private_lessons;
CREATE POLICY "Students can view their own lessons"
    ON public.private_lessons
    FOR SELECT
    USING (auth.uid() = student_id);

-- 4. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_private_lessons_tutor_id ON public.private_lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_private_lessons_student_id ON public.private_lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_private_lessons_start_time ON public.private_lessons(start_time);
