/*
  # Consolidate Multiple Permissive Policies - Part 4

  1. Changes
    - Final consolidation of multiple permissive policies
    - Combines student and teacher access rules
  
  2. Affected Tables
    - students (SELECT, UPDATE)
    - submissions (SELECT, INSERT, UPDATE, DELETE)
    - tests (SELECT, UPDATE)
    - weekly_programs (SELECT, UPDATE)
  
  3. Security
    - No security changes, same authorization logic maintained
*/

-- STUDENTS: Consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Tutors can read assigned students" ON students;

CREATE POLICY "Users can view students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR tutor_id = (select auth.uid())
  );

CREATE POLICY "Users can update students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR tutor_id = (select auth.uid())
  )
  WITH CHECK (
    id = (select auth.uid())
    OR tutor_id = (select auth.uid())
  );

-- SUBMISSIONS: Consolidate all policies
DROP POLICY IF EXISTS "Students can manage own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can manage student submissions" ON submissions;

CREATE POLICY "Users can view submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignments JOIN students ON students.id = assignments.student_id
      WHERE assignments.id = submissions.assignment_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert submissions"
  ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignments JOIN students ON students.id = assignments.student_id
      WHERE assignments.id = submissions.assignment_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update submissions"
  ON submissions
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignments JOIN students ON students.id = assignments.student_id
      WHERE assignments.id = submissions.assignment_id
      AND students.tutor_id = (select auth.uid())
    )
  )
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignments JOIN students ON students.id = assignments.student_id
      WHERE assignments.id = submissions.assignment_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete submissions"
  ON submissions
  FOR DELETE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignments JOIN students ON students.id = assignments.student_id
      WHERE assignments.id = submissions.assignment_id
      AND students.tutor_id = (select auth.uid())
    )
  );

-- TESTS: Consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Students can view own tests" ON tests;
DROP POLICY IF EXISTS "Tutors can view tests" ON tests;

CREATE POLICY "Users can view tests"
  ON tests
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = tests.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update tests"
  ON tests
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = tests.student_id
      AND students.tutor_id = (select auth.uid())
    )
  )
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = tests.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

-- WEEKLY_PROGRAMS: Consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Students can view own weekly programs" ON weekly_programs;
DROP POLICY IF EXISTS "Tutors can view weekly programs" ON weekly_programs;

CREATE POLICY "Users can view weekly programs"
  ON weekly_programs
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = weekly_programs.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update weekly programs"
  ON weekly_programs
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = weekly_programs.student_id
      AND students.tutor_id = (select auth.uid())
    )
  )
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = weekly_programs.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );
