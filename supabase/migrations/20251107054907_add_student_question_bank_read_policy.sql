/*
  # Add Student Read Access to Question Banks

  1. Changes
    - Add SELECT policy for students to read question banks that are assigned to them
    - Students can only read question banks if they have an active assignment for that bank
  
  2. Security
    - Students can only access question banks they have been assigned
    - Teachers retain full access to their own question banks
*/

-- Drop policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'question_banks' 
    AND policyname = 'Students can view assigned question banks'
  ) THEN
    DROP POLICY "Students can view assigned question banks" ON question_banks;
  END IF;
END $$;

-- Add policy for students to read assigned question banks
CREATE POLICY "Students can view assigned question banks"
  ON question_banks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM question_bank_assignments
      WHERE question_bank_assignments.question_bank_id = question_banks.id
        AND question_bank_assignments.student_id = auth.uid()
    )
  );
