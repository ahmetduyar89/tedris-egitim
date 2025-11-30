-- Allow tutors to view all students (for scheduling private lessons with any student)
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
    -- Allow if user is the student themselves (keep existing logic just in case, though "Students can read own data" handles this)
    auth.uid() = id
    OR
    -- Allow if user is the assigned tutor (redundant but safe)
    tutor_id = auth.uid()
  );
