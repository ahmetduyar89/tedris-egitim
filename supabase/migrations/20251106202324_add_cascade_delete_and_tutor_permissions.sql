/*
  # Add CASCADE Delete and Tutor Delete Permissions

  1. Changes
    - Add DELETE policy for tutors to delete student users from users table
    - This works with existing CASCADE rules on students table
    - When students record is deleted, all related data (tests, assignments, etc.) are automatically deleted via CASCADE
  
  2. Security
    - Only tutors can delete student users that are assigned to them
    - Students cannot delete their own user records
    - All related data is automatically cleaned up via existing CASCADE foreign keys
  
  3. Data Integrity
    - Deletion order: students table first, then users table
    - All student-related data (tests, assignments, badges, chat_messages, etc.) 
      automatically deleted via CASCADE foreign keys
*/

-- Allow tutors to delete student users they are assigned to
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
      AND students.tutor_id = auth.uid()
    )
  );
