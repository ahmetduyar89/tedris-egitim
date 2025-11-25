/*
  # Consolidate Multiple Permissive Policies - Part 3

  1. Changes
    - Continue consolidating multiple permissive policies
    - Combines student and teacher access rules
  
  2. Affected Tables
    - progress_reports (SELECT)
    - question_bank_assignments (SELECT, UPDATE)
    - review_packages (SELECT)
    - spaced_repetition_schedule (SELECT, UPDATE)
  
  3. Security
    - No security changes, same authorization logic maintained
*/

-- PROGRESS_REPORTS: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can view own progress reports" ON progress_reports;
DROP POLICY IF EXISTS "Tutors can view progress reports" ON progress_reports;

CREATE POLICY "Users can view progress reports"
  ON progress_reports
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = progress_reports.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

-- QUESTION_BANK_ASSIGNMENTS: Consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Students can view own qb assignments" ON question_bank_assignments;
DROP POLICY IF EXISTS "Teachers can manage qb assignments" ON question_bank_assignments;

CREATE POLICY "Users can view qb assignments"
  ON question_bank_assignments
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert qb assignments"
  ON question_bank_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update qb assignments"
  ON question_bank_assignments
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  )
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can delete qb assignments"
  ON question_bank_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

-- REVIEW_PACKAGES: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can view own review packages" ON review_packages;
DROP POLICY IF EXISTS "Tutors can view review packages" ON review_packages;

CREATE POLICY "Users can view review packages"
  ON review_packages
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = review_packages.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

-- SPACED_REPETITION_SCHEDULE: Consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Students can view own schedule" ON spaced_repetition_schedule;
DROP POLICY IF EXISTS "Tutors can manage schedules" ON spaced_repetition_schedule;

CREATE POLICY "Users can view schedule"
  ON spaced_repetition_schedule
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert schedule"
  ON spaced_repetition_schedule
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update schedule"
  ON spaced_repetition_schedule
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (select auth.uid())
    )
  )
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can delete schedule"
  ON spaced_repetition_schedule
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );
