/*
  # Consolidate Multiple Permissive Policies - Part 1

  1. Changes
    - Consolidate multiple permissive policies into single policies per action
    - Improves query performance and reduces policy evaluation overhead
    - Combines student and teacher access rules with OR conditions
  
  2. Affected Tables
    - assignments (SELECT, UPDATE)
    - badges (SELECT)
    - content_assignments (SELECT, UPDATE)
    - content_library (SELECT)
  
  3. Security
    - No security changes, same authorization logic maintained
    - Students still access their own data
    - Teachers still access their students' data
*/

-- ASSIGNMENTS: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can view own assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage assignments" ON assignments;

CREATE POLICY "Users can view assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students JOIN users ON users.id = students.tutor_id
      WHERE students.id = assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Users can insert assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students JOIN users ON users.id = students.tutor_id
      WHERE students.id = assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Users can update assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students JOIN users ON users.id = students.tutor_id
      WHERE students.id = assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  )
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students JOIN users ON users.id = students.tutor_id
      WHERE students.id = assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Teachers can delete assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students JOIN users ON users.id = students.tutor_id
      WHERE students.id = assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- BADGES: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can view own badges" ON badges;
DROP POLICY IF EXISTS "Tutors can view their students badges" ON badges;

CREATE POLICY "Users can view badges"
  ON badges
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = badges.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

-- CONTENT_ASSIGNMENTS: Consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Students can view own content assignments" ON content_assignments;
DROP POLICY IF EXISTS "Teachers can manage content assignments" ON content_assignments;

CREATE POLICY "Users can view content assignments"
  ON content_assignments
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = content_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert content assignments"
  ON content_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = content_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update content assignments"
  ON content_assignments
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = content_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  )
  WITH CHECK (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = content_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can delete content assignments"
  ON content_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = content_assignments.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

-- CONTENT_LIBRARY: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can view assigned content" ON content_library;
DROP POLICY IF EXISTS "Teachers can manage own content" ON content_library;

CREATE POLICY "Users can view content library"
  ON content_library
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM content_assignments
      WHERE content_assignments.content_id = content_library.id
      AND content_assignments.student_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can manage own content"
  ON content_library
  FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));
