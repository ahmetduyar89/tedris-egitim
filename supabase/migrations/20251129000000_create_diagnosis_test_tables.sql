-- Migration: Create Diagnosis Test Tables
-- Date: 2025-01-28
-- Description: Creates all necessary tables for the diagnosis test system

-- 1. Diagnosis Tests Table (Teacher-created tests)
CREATE TABLE IF NOT EXISTS diagnosis_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade INTEGER NOT NULL,
    total_questions INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Diagnosis Test Questions Table (AI-generated questions)
CREATE TABLE IF NOT EXISTS diagnosis_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES diagnosis_tests(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- ["A) ...", "B) ...", "C) ...", "D) ..."]
    correct_answer VARCHAR(10) NOT NULL,
    difficulty INTEGER DEFAULT 3,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Diagnosis Test Assignments Table (Tests assigned to students)
CREATE TABLE IF NOT EXISTS diagnosis_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES diagnosis_tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    is_mandatory BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    score INTEGER,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Diagnosis Test Answers Table (Student answers)
CREATE TABLE IF NOT EXISTS diagnosis_test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES diagnosis_test_assignments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES diagnosis_test_questions(id) ON DELETE CASCADE,
    student_answer VARCHAR(10),
    is_correct BOOLEAN,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Diagnosis Test Actions Table (Teacher actions based on results)
CREATE TABLE IF NOT EXISTS diagnosis_test_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES diagnosis_test_assignments(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'weekly_plan', 'homework', 'review_package', 'note'
    action_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnosis_tests_teacher ON diagnosis_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_questions_test ON diagnosis_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_student ON diagnosis_test_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_teacher ON diagnosis_test_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_status ON diagnosis_test_assignments(status);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_answers_assignment ON diagnosis_test_answers(assignment_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_actions_assignment ON diagnosis_test_actions(assignment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE diagnosis_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagnosis_tests
CREATE POLICY "Teachers can view their own tests" 
    ON diagnosis_tests FOR SELECT 
    USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create tests" 
    ON diagnosis_tests FOR INSERT 
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own tests" 
    ON diagnosis_tests FOR UPDATE 
    USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own tests" 
    ON diagnosis_tests FOR DELETE 
    USING (teacher_id = auth.uid());

-- RLS Policies for diagnosis_test_questions
CREATE POLICY "Teachers can view questions for their tests" 
    ON diagnosis_test_questions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM diagnosis_tests 
        WHERE diagnosis_tests.id = diagnosis_test_questions.test_id 
        AND diagnosis_tests.teacher_id = auth.uid()
    ));

CREATE POLICY "Teachers can insert questions for their tests" 
    ON diagnosis_test_questions FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM diagnosis_tests 
        WHERE diagnosis_tests.id = diagnosis_test_questions.test_id 
        AND diagnosis_tests.teacher_id = auth.uid()
    ));

CREATE POLICY "Students can view questions for their assigned tests" 
    ON diagnosis_test_questions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM diagnosis_test_assignments 
        WHERE diagnosis_test_assignments.test_id = diagnosis_test_questions.test_id 
        AND diagnosis_test_assignments.student_id = auth.uid()
    ));

-- RLS Policies for diagnosis_test_assignments
CREATE POLICY "Teachers can view assignments they created" 
    ON diagnosis_test_assignments FOR SELECT 
    USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their own assignments" 
    ON diagnosis_test_assignments FOR SELECT 
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can create assignments" 
    ON diagnosis_test_assignments FOR INSERT 
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their assignments" 
    ON diagnosis_test_assignments FOR UPDATE 
    USING (teacher_id = auth.uid());

CREATE POLICY "Students can update their assignment status" 
    ON diagnosis_test_assignments FOR UPDATE 
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- RLS Policies for diagnosis_test_answers
CREATE POLICY "Students can view their own answers" 
    ON diagnosis_test_answers FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM diagnosis_test_assignments 
        WHERE diagnosis_test_assignments.id = diagnosis_test_answers.assignment_id 
        AND diagnosis_test_assignments.student_id = auth.uid()
    ));

CREATE POLICY "Teachers can view answers for their assignments" 
    ON diagnosis_test_answers FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM diagnosis_test_assignments 
        WHERE diagnosis_test_assignments.id = diagnosis_test_answers.assignment_id 
        AND diagnosis_test_assignments.teacher_id = auth.uid()
    ));

CREATE POLICY "Students can insert their own answers" 
    ON diagnosis_test_answers FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM diagnosis_test_assignments 
        WHERE diagnosis_test_assignments.id = diagnosis_test_answers.assignment_id 
        AND diagnosis_test_assignments.student_id = auth.uid()
    ));

-- RLS Policies for diagnosis_test_actions
CREATE POLICY "Teachers can view their own actions" 
    ON diagnosis_test_actions FOR SELECT 
    USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create actions" 
    ON diagnosis_test_actions FOR INSERT 
    WITH CHECK (teacher_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_diagnosis_test_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_diagnosis_tests_updated_at
    BEFORE UPDATE ON diagnosis_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_diagnosis_test_updated_at();

CREATE TRIGGER update_diagnosis_test_assignments_updated_at
    BEFORE UPDATE ON diagnosis_test_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_diagnosis_test_updated_at();
