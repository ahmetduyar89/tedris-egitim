-- Fix Diagnosis Test System RLS and Missing Columns
-- Date: 2025-12-08

-- 1. Add missing columns to diagnosis_test_assignments
ALTER TABLE diagnosis_test_assignments 
ADD COLUMN IF NOT EXISTS total_correct INTEGER,
ADD COLUMN IF NOT EXISTS total_questions INTEGER;

-- 2. Add missing columns to diagnosis_test_answers
ALTER TABLE diagnosis_test_answers 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add missing columns to diagnosis_test_actions
ALTER TABLE diagnosis_test_actions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Ensure unique constraint for answers
ALTER TABLE diagnosis_test_answers 
DROP CONSTRAINT IF EXISTS unique_assignment_question;

ALTER TABLE diagnosis_test_answers 
ADD CONSTRAINT unique_assignment_question UNIQUE (assignment_id, question_id);

-- 5. Grant necessary permissions
GRANT ALL ON diagnosis_tests TO authenticated;
GRANT ALL ON diagnosis_test_questions TO authenticated;
GRANT ALL ON diagnosis_test_assignments TO authenticated;
GRANT ALL ON diagnosis_test_answers TO authenticated;
GRANT ALL ON diagnosis_test_actions TO authenticated;

-- 6. Refresh RLS policies to ensure they're active
ALTER TABLE diagnosis_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_actions ENABLE ROW LEVEL SECURITY;

-- 7. Add policy for students to update answers (upsert)
DROP POLICY IF EXISTS "Students can update their own answers" ON diagnosis_test_answers;
CREATE POLICY "Students can update their own answers"
    ON diagnosis_test_answers FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM diagnosis_test_assignments 
        WHERE diagnosis_test_assignments.id = diagnosis_test_answers.assignment_id 
        AND diagnosis_test_assignments.student_id = auth.uid()
    ));

-- 8. Refresh schema cache
NOTIFY pgrst, 'reload schema';
