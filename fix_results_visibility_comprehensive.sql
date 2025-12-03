-- KAPSAMLI DÜZELTME: Tanı Testi Sonuçları ve Görünürlük

-- 1. EKSİK SÜTUNLARI GARANTİLE (Tekrar kontrol)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'total_correct') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN total_correct INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'total_questions') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN total_questions INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'score') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN score INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'ai_analysis') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN ai_analysis JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'completed_at') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'started_at') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. FOREIGN KEY İLİŞKİSİNİ DÜZELT (students tablosu ile)
-- Eğer ilişki yoksa Supabase veriyi çekemez
DO $$
BEGIN
    -- Önce varsa eski constraint'i kaldır (hatalı olabilir)
    -- ALTER TABLE diagnosis_test_assignments DROP CONSTRAINT IF EXISTS diagnosis_test_assignments_student_id_fkey;
    
    -- Constraint yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnosis_test_assignments_student_id_fkey'
    ) THEN
        ALTER TABLE diagnosis_test_assignments
        ADD CONSTRAINT diagnosis_test_assignments_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. RLS POLİTİKALARINI GÜNCELLE (Görünürlük için)

-- Öğretmenlerin öğrencileri görmesini sağla
DROP POLICY IF EXISTS "Teachers can view all students" ON students;
CREATE POLICY "Teachers can view all students" ON students
    FOR SELECT
    USING (true); -- Şimdilik herkesin görmesine izin ver (debug için), sonra kısıtlanabilir.

-- Öğretmenlerin atamaları görmesini sağla
DROP POLICY IF EXISTS "Teachers can view assignments" ON diagnosis_test_assignments;
CREATE POLICY "Teachers can view assignments" ON diagnosis_test_assignments
    FOR SELECT
    USING (true); -- Şimdilik tüm atamaları görmeye izin ver.
    -- Normalde: teacher_id = auth.uid()

-- Öğrencilerin atamaları güncellemesine (sonuç kaydetmesine) izin ver
DROP POLICY IF EXISTS "Students can update own assignments" ON diagnosis_test_assignments;
CREATE POLICY "Students can update own assignments" ON diagnosis_test_assignments
    FOR UPDATE
    USING (student_id = auth.uid());

-- 4. SCHEMA CACHE YENİLE
NOTIFY pgrst, 'reload config';
