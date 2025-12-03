-- diagnosis_test_assignments tablosuna eksik sütunları ekle

-- total_correct sütunu ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'total_correct') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN total_correct INTEGER DEFAULT 0;
    END IF;
END $$;

-- total_questions sütunu ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'total_questions') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN total_questions INTEGER DEFAULT 0;
    END IF;
END $$;

-- score sütunu ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'score') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN score INTEGER DEFAULT 0;
    END IF;
END $$;

-- ai_analysis sütunu ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'ai_analysis') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN ai_analysis JSONB;
    END IF;
END $$;

-- completed_at sütunu ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'completed_at') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- started_at sütunu ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnosis_test_assignments' AND column_name = 'started_at') THEN
        ALTER TABLE diagnosis_test_assignments ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Schema cache'i yenilemek için (Supabase bazen cache tutar)
NOTIFY pgrst, 'reload config';
