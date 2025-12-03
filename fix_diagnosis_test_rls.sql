-- Tanı Testleri için Güvenlik Politikaları (RLS) Düzeltmesi

-- 1. Mevcut politikaları temizle (çakışmayı önlemek için)
DROP POLICY IF EXISTS "Teachers can manage their own tests" ON diagnosis_tests;
DROP POLICY IF EXISTS "Students can view assigned tests" ON diagnosis_tests;
DROP POLICY IF EXISTS "Teachers can manage their own questions" ON diagnosis_test_questions;
DROP POLICY IF EXISTS "Students can view questions of assigned tests" ON diagnosis_test_questions;
DROP POLICY IF EXISTS "Teachers can manage assignments" ON diagnosis_test_assignments;
DROP POLICY IF EXISTS "Students can view their own assignments" ON diagnosis_test_assignments;
DROP POLICY IF EXISTS "Students can update their own assignments" ON diagnosis_test_assignments;
DROP POLICY IF EXISTS "Students can manage their own answers" ON diagnosis_test_answers;
DROP POLICY IF EXISTS "Teachers can view answers of their assignments" ON diagnosis_test_answers;

-- 2. RLS'i Aktif Et (Eğer değilse)
ALTER TABLE diagnosis_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_test_answers ENABLE ROW LEVEL SECURITY;

-- 3. diagnosis_tests Politikaları
-- Öğretmenler kendi testlerini yönetebilir
CREATE POLICY "Teachers can manage their own tests" ON diagnosis_tests
    FOR ALL USING (auth.uid() = teacher_id);

-- Öğrenciler kendilerine atanmış testleri görebilir
CREATE POLICY "Students can view assigned tests" ON diagnosis_tests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM diagnosis_test_assignments
            WHERE diagnosis_test_assignments.test_id = diagnosis_tests.id
            AND diagnosis_test_assignments.student_id = auth.uid()
        )
    );

-- 4. diagnosis_test_questions Politikaları
-- Öğretmenler kendi testlerinin sorularını yönetebilir
CREATE POLICY "Teachers can manage their own questions" ON diagnosis_test_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM diagnosis_tests
            WHERE diagnosis_tests.id = diagnosis_test_questions.test_id
            AND diagnosis_tests.teacher_id = auth.uid()
        )
    );

-- Öğrenciler kendilerine atanmış testlerin sorularını görebilir
CREATE POLICY "Students can view questions of assigned tests" ON diagnosis_test_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM diagnosis_test_assignments
            WHERE diagnosis_test_assignments.test_id = diagnosis_test_questions.test_id
            AND diagnosis_test_assignments.student_id = auth.uid()
        )
    );

-- 5. diagnosis_test_assignments Politikaları
-- Öğretmenler atamaları yönetebilir
CREATE POLICY "Teachers can manage assignments" ON diagnosis_test_assignments
    FOR ALL USING (auth.uid() = teacher_id);

-- Öğrenciler kendi atamalarını görebilir
CREATE POLICY "Students can view their own assignments" ON diagnosis_test_assignments
    FOR SELECT USING (auth.uid() = student_id);

-- Öğrenciler kendi atamalarını güncelleyebilir (başlatma/bitirme)
CREATE POLICY "Students can update their own assignments" ON diagnosis_test_assignments
    FOR UPDATE USING (auth.uid() = student_id);

-- 6. diagnosis_test_answers Politikaları
-- Öğrenciler kendi cevaplarını yönetebilir (ekleme/güncelleme)
CREATE POLICY "Students can manage their own answers" ON diagnosis_test_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM diagnosis_test_assignments
            WHERE diagnosis_test_assignments.id = diagnosis_test_answers.assignment_id
            AND diagnosis_test_assignments.student_id = auth.uid()
        )
    );

-- Öğretmenler atadıkları testlerin cevaplarını görebilir
CREATE POLICY "Teachers can view answers of their assignments" ON diagnosis_test_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM diagnosis_test_assignments
            WHERE diagnosis_test_assignments.id = diagnosis_test_answers.assignment_id
            AND diagnosis_test_assignments.teacher_id = auth.uid()
        )
    );
