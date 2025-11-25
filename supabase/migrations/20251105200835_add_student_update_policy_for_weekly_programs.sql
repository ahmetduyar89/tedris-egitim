/*
  # Add student update access to weekly programs

  1. Changes
    - Add UPDATE policy for students to update their own weekly programs
    - Students can mark tasks as complete/incomplete in their assigned programs

  2. Security
    - Students can only update their own weekly programs (student_id = auth.uid())
    - Maintains data integrity by restricting updates to owner
*/

-- Add policy for students to update their own weekly programs
CREATE POLICY "Students can update own weekly programs"
  ON weekly_programs
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
  )
  WITH CHECK (
    student_id = auth.uid()
  );
