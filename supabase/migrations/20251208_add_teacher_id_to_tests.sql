-- Add missing teacher_id column to tests table
-- This allows tracking which teacher created/assigned each test

ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tests_teacher_id ON tests(teacher_id);

-- Grant necessary permissions
GRANT ALL ON tests TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
