-- CEVAP KAYDETME HATASINI DÜZELTME (Unique Constraint Fix)

-- 1. diagnosis_test_answers tablosuna benzersizlik kısıtlaması ekle
-- Bu, bir öğrencinin aynı soruya birden fazla cevap satırı oluşturmasını engeller
-- ve "upsert" işleminin (varsa güncelle, yoksa ekle) çalışmasını sağlar.

DO $$
BEGIN
    -- Eğer constraint zaten varsa hata vermemesi için kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_assignment_question_answer'
    ) THEN
        ALTER TABLE diagnosis_test_answers
        ADD CONSTRAINT unique_assignment_question_answer UNIQUE (assignment_id, question_id);
    END IF;
END $$;

-- 2. Schema Cache'i Yenile
NOTIFY pgrst, 'reload config';
