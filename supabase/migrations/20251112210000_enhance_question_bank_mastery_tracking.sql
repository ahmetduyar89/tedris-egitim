/*
  # Enhance Question Bank and Mastery Tracking Integration

  1. Changes to question_banks table
    - Add metadata field for question-level topic mapping
    - Add reference to kg_modules for direct linking

  2. Changes to question_bank_assignments table
    - Add module_ids array to track which modules were tested
    - Add performance_breakdown jsonb for detailed per-module scoring

  3. New indexes
    - Index on question_bank_assignments.module_ids for faster lookups
    - Index on question_banks.subject and grade for better matching

  4. Updates
    - No data migration needed, new fields are optional
*/

-- Add metadata field to question_banks for question-level topic mapping
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_banks' AND column_name = 'question_metadata'
  ) THEN
    ALTER TABLE question_banks ADD COLUMN question_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add module reference to question_banks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_banks' AND column_name = 'primary_module_id'
  ) THEN
    ALTER TABLE question_banks ADD COLUMN primary_module_id uuid REFERENCES kg_modules(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add module tracking to question_bank_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_bank_assignments' AND column_name = 'tested_module_ids'
  ) THEN
    ALTER TABLE question_bank_assignments ADD COLUMN tested_module_ids uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;
END $$;

-- Add performance breakdown field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_bank_assignments' AND column_name = 'performance_breakdown'
  ) THEN
    ALTER TABLE question_bank_assignments ADD COLUMN performance_breakdown jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add mastery_updated flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_bank_assignments' AND column_name = 'mastery_updated'
  ) THEN
    ALTER TABLE question_bank_assignments ADD COLUMN mastery_updated boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_banks_primary_module
  ON question_banks(primary_module_id)
  WHERE primary_module_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_question_banks_subject_grade
  ON question_banks(subject, grade);

CREATE INDEX IF NOT EXISTS idx_qb_assignments_module_ids
  ON question_bank_assignments USING GIN(tested_module_ids)
  WHERE tested_module_ids IS NOT NULL AND array_length(tested_module_ids, 1) > 0;

CREATE INDEX IF NOT EXISTS idx_qb_assignments_mastery_updated
  ON question_bank_assignments(student_id, mastery_updated, completed_at)
  WHERE mastery_updated = true AND completed_at IS NOT NULL;

-- Add comment explaining the new fields
COMMENT ON COLUMN question_banks.question_metadata IS 'Stores question-level metadata including topic mappings: {"questions": [{"id": "q1", "topic": "Algebra", "module_id": "uuid"}]}';
COMMENT ON COLUMN question_banks.primary_module_id IS 'Primary knowledge graph module this question bank tests';
COMMENT ON COLUMN question_bank_assignments.tested_module_ids IS 'Array of kg_module IDs that were tested in this assignment';
COMMENT ON COLUMN question_bank_assignments.performance_breakdown IS 'Detailed performance per module: {"module_id": {"correct": 5, "wrong": 2, "percentage": 71.4}}';
COMMENT ON COLUMN question_bank_assignments.mastery_updated IS 'Flag indicating whether mastery scores were successfully updated after test completion';
