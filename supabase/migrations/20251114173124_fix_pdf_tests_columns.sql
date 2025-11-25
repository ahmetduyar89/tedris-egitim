/*
  # Fix PDF Tests Table Columns

  1. Changes
    - Add missing 'unit' column for organizing tests by curriculum unit
    - Rename 'time_limit_minutes' to 'duration_minutes' for consistency with the codebase
  
  2. Notes
    - Ensures column names match the frontend expectations
    - Maintains backward compatibility by preserving existing data
*/

-- Add unit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_tests' AND column_name = 'unit'
  ) THEN
    ALTER TABLE pdf_tests ADD COLUMN unit text DEFAULT '';
  END IF;
END $$;

-- Rename time_limit_minutes to duration_minutes if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_tests' AND column_name = 'time_limit_minutes'
  ) THEN
    ALTER TABLE pdf_tests RENAME COLUMN time_limit_minutes TO duration_minutes;
  END IF;
END $$;
