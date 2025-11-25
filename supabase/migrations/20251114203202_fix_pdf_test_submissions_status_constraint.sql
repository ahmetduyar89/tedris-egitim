/*
  # Fix PDF Test Submissions Status Constraint

  1. Changes
    - Drop and recreate the status check constraint with explicit naming
    - Ensure the constraint accepts: 'started', 'completed', 'time_expired'
    - Add validation to prevent constraint violations
  
  2. Security
    - No changes to RLS policies
    - Maintains existing security model

  3. Notes
    - This fixes the constraint violation error when creating new submissions
    - Explicitly defines constraint name for better error tracking
*/

-- Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pdf_test_submissions_status_check'
    AND table_name = 'pdf_test_submissions'
  ) THEN
    ALTER TABLE pdf_test_submissions DROP CONSTRAINT pdf_test_submissions_status_check;
  END IF;
END $$;

-- Add the constraint back with explicit definition
ALTER TABLE pdf_test_submissions 
ADD CONSTRAINT pdf_test_submissions_status_check 
CHECK (status IN ('started', 'completed', 'time_expired'));
