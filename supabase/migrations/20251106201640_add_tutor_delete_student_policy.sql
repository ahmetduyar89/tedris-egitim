/*
  # Add Tutor Delete Permission for Students

  1. Changes
    - Add DELETE policy for tutors to remove their assigned students
  
  2. Security
    - Only tutors can delete students they are assigned to
    - Students cannot delete their own records
    - Maintains data integrity through proper ownership checks
*/

-- Allow tutors to delete their assigned students
CREATE POLICY "Tutors can delete assigned students"
  ON students
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tutor'
      AND students.tutor_id = users.id
    )
  );
