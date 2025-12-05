-- Migration: Add teacher_id column to tests table
-- Description: Adds the missing teacher_id column and populates it.

-- 1. Add the column if it doesn't exist
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id);

-- 2. Populate the teacher_id from the student's tutor
UPDATE tests
SET teacher_id = students.tutor_id
FROM students
WHERE tests.student_id = students.id
  AND tests.teacher_id IS NULL;

-- 3. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_tests_teacher_id ON tests(teacher_id);

-- 4. Update RLS policies to allow teachers to manage their own tests
-- (Dropping existing policies to be safe and recreating them)
DROP POLICY IF EXISTS "Tutors can view tests of their students" ON tests;
DROP POLICY IF EXISTS "Tutors can create tests for their students" ON tests;
DROP POLICY IF EXISTS "Tutors can update tests of their students" ON tests;
DROP POLICY IF EXISTS "Tutors can delete tests of their students" ON tests;
DROP POLICY IF EXISTS "Tutors can manage tests" ON tests;

-- Policy: Tutors can do everything with their own tests
CREATE POLICY "Tutors can manage tests"
ON tests
FOR ALL
TO authenticated
USING (
  teacher_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = tests.student_id 
    AND students.tutor_id = auth.uid()
  )
)
WITH CHECK (
  teacher_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = tests.student_id 
    AND students.tutor_id = auth.uid()
  )
);
