/*
  # Fix PDF Test Submissions RLS Policies

  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create clean, simple policies
    - Students can create and manage their own submissions
    - Teachers can view and grade their students' submissions
  
  2. Security
    - Students can only insert their own submissions (auth.uid() = student_id)
    - Students can view and update their own submissions
    - Teachers can view and update submissions for their tests
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can create submissions" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Öğrenciler kendi submission'larını oluşturabilir" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Students can view own submissions" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Teachers can view test submissions" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Öğrenciler kendi submission'larını görebilir" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Öğretmenler öğrencilerinin submission'larını görebilir" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Students can update own submissions" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Öğrenciler kendi submission'larını güncelleyebilir" ON pdf_test_submissions;
DROP POLICY IF EXISTS "Öğretmenler öğrencilerinin submission'larını güncelleyeb" ON pdf_test_submissions;

-- Students can insert their own submissions
CREATE POLICY "Students can insert own submissions"
ON pdf_test_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
ON pdf_test_submissions FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Teachers can view submissions for their tests
CREATE POLICY "Teachers can view test submissions"
ON pdf_test_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pdf_tests
    WHERE pdf_tests.id = pdf_test_submissions.pdf_test_id
    AND pdf_tests.teacher_id = auth.uid()
  )
);

-- Students can update their own submissions
CREATE POLICY "Students can update own submissions"
ON pdf_test_submissions FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Teachers can update submissions for their tests (for grading)
CREATE POLICY "Teachers can update test submissions"
ON pdf_test_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pdf_tests
    WHERE pdf_tests.id = pdf_test_submissions.pdf_test_id
    AND pdf_tests.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pdf_tests
    WHERE pdf_tests.id = pdf_test_submissions.pdf_test_id
    AND pdf_tests.teacher_id = auth.uid()
  )
);
