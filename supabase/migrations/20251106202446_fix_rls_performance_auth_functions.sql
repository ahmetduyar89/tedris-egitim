/*
  # Fix RLS Performance Issues with auth.uid()

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in DELETE policies
    - This prevents re-evaluation of auth.uid() for each row
    - Significantly improves query performance at scale
  
  2. Affected Policies
    - students: "Tutors can delete assigned students"
    - users: "Tutors can delete assigned student users"
  
  3. Security
    - No security changes, only performance optimization
    - Same authorization logic maintained
*/

-- Drop and recreate students delete policy with optimized auth.uid()
DROP POLICY IF EXISTS "Tutors can delete assigned students" ON students;

CREATE POLICY "Tutors can delete assigned students"
  ON students
  FOR DELETE
  TO authenticated
  USING (tutor_id = (select auth.uid()));

-- Drop and recreate users delete policy with optimized auth.uid()
DROP POLICY IF EXISTS "Tutors can delete assigned student users" ON users;

CREATE POLICY "Tutors can delete assigned student users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    role = 'student'
    AND EXISTS (
      SELECT 1
      FROM students
      WHERE students.id = users.id
      AND students.tutor_id = (select auth.uid())
    )
  );
