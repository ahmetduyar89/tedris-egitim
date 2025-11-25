/*
  # Fix PDF Test Submissions Table Columns

  1. Changes
    - Rename 'unanswered_count' to 'empty_count' for consistency with the codebase
    - Rename 'time_spent_minutes' to 'time_spent_seconds' for more precise time tracking
  
  2. Notes
    - Ensures column names match the frontend expectations
    - Maintains backward compatibility by preserving existing data
*/

-- Rename unanswered_count to empty_count
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_test_submissions' AND column_name = 'unanswered_count'
  ) THEN
    ALTER TABLE pdf_test_submissions RENAME COLUMN unanswered_count TO empty_count;
  END IF;
END $$;

-- Rename time_spent_minutes to time_spent_seconds
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_test_submissions' AND column_name = 'time_spent_minutes'
  ) THEN
    ALTER TABLE pdf_test_submissions RENAME COLUMN time_spent_minutes TO time_spent_seconds;
  END IF;
END $$;
