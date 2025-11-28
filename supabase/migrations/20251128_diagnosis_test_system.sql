-- Faz 1: Tanı Testi Sistemi - Veritabanı Migration
-- Öğretmen tarafından oluşturulan ve yönetilen tanı testleri

-- 1. Öğretmen tarafından oluşturulan tanı testleri
CREATE TABLE IF NOT EXISTS diagnosis_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Test içindeki sorular (AI tarafından üretilmiş)
CREATE TABLE IF NOT EXISTS diagnosis_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES diagnosis_tests(id) ON DELETE CASCADE,
    module_id VARCHAR(50),
    module_name VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- ["A) ...", "B) ...", "C) ...", "D) ..."]
    correct_answer VARCHAR(10) NOT NULL,
    difficulty INTEGER DEFAULT 3,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Öğrencilere atanan testler
CREATE TABLE IF NOT EXISTS diagnosis_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES diagnosis_tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    is_mandatory BOOLEAN DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    score INTEGER,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Öğrenci cevapları
CREATE TABLE IF NOT EXISTS diagnosis_test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES diagnosis_test_assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES diagnosis_test_questions(id) ON DELETE CASCADE,
    student_answer VARCHAR(10),
    is_correct BOOLEAN,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Öğretmen aksiyonları (test sonrası)
CREATE TABLE IF NOT EXISTS diagnosis_test_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES diagnosis_test_assignments(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'weekly_plan', 'homework', 'review_package', 'note'
    action_data JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İndeksler (Performans için)
CREATE INDEX IF NOT EXISTS idx_diagnosis_tests_teacher ON diagnosis_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_tests_subject_grade ON diagnosis_tests(subject, grade);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_questions_test ON diagnosis_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_student ON diagnosis_test_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_teacher ON diagnosis_test_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_status ON diagnosis_test_assignments(status);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_answers_assignment ON diagnosis_test_answers(assignment_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_actions_assignment ON diagnosis_test_actions(assignment_id);

-- RLS (Row Level Security) Politikaları
ALTER TABLE diagnosis_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_actions ENABLE ROW LEVEL SECURITY;

-- diagnosis_tests RLS
CREATE POLICY "Teachers can view their own tests"
    ON diagnosis_tests FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can create tests"
    ON diagnosis_tests FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can update their own tests"
    ON diagnosis_tests FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can delete their own tests"
    ON diagnosis_tests FOR DELETE
    USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

-- diagnosis_test_questions RLS
CREATE POLICY "Teachers can view questions of their tests"
    ON diagnosis_test_questions FOR SELECT
    USING (test_id IN (SELECT id FROM diagnosis_tests WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

CREATE POLICY "Teachers can insert questions to their tests"
    ON diagnosis_test_questions FOR INSERT
    WITH CHECK (test_id IN (SELECT id FROM diagnosis_tests WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

CREATE POLICY "Teachers can update questions of their tests"
    ON diagnosis_test_questions FOR UPDATE
    USING (test_id IN (SELECT id FROM diagnosis_tests WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

CREATE POLICY "Teachers can delete questions of their tests"
    ON diagnosis_test_questions FOR DELETE
    USING (test_id IN (SELECT id FROM diagnosis_tests WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

CREATE POLICY "Students can view questions of assigned tests"
    ON diagnosis_test_questions FOR SELECT
    USING (test_id IN (
        SELECT test_id FROM diagnosis_test_assignments 
        WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    ));

-- diagnosis_test_assignments RLS
CREATE POLICY "Teachers can view assignments they created"
    ON diagnosis_test_assignments FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can create assignments"
    ON diagnosis_test_assignments FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can update assignments they created"
    ON diagnosis_test_assignments FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Students can view their own assignments"
    ON diagnosis_test_assignments FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Students can update their own assignments"
    ON diagnosis_test_assignments FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

-- diagnosis_test_answers RLS
CREATE POLICY "Students can view their own answers"
    ON diagnosis_test_answers FOR SELECT
    USING (assignment_id IN (
        SELECT id FROM diagnosis_test_assignments 
        WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    ));

CREATE POLICY "Students can insert their own answers"
    ON diagnosis_test_answers FOR INSERT
    WITH CHECK (assignment_id IN (
        SELECT id FROM diagnosis_test_assignments 
        WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    ));

CREATE POLICY "Students can update their own answers"
    ON diagnosis_test_answers FOR UPDATE
    USING (assignment_id IN (
        SELECT id FROM diagnosis_test_assignments 
        WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    ));

CREATE POLICY "Teachers can view answers of their students"
    ON diagnosis_test_answers FOR SELECT
    USING (assignment_id IN (
        SELECT id FROM diagnosis_test_assignments 
        WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    ));

-- diagnosis_test_actions RLS
CREATE POLICY "Teachers can view their own actions"
    ON diagnosis_test_actions FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can create actions"
    ON diagnosis_test_actions FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can update their own actions"
    ON diagnosis_test_actions FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diagnosis_tests_updated_at BEFORE UPDATE ON diagnosis_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_test_assignments_updated_at BEFORE UPDATE ON diagnosis_test_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
