-- BAĞLANTIYI ZORLA ONARMA (Force Fix Relationship)

-- 1. Mevcut bağlantıyı (varsa) kesin olarak sil
ALTER TABLE diagnosis_test_assignments 
DROP CONSTRAINT IF EXISTS diagnosis_test_assignments_student_id_fkey;

-- 2. Bağlantıyı yeniden oluştur (students tablosuna)
ALTER TABLE diagnosis_test_assignments
ADD CONSTRAINT diagnosis_test_assignments_student_id_fkey
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- 3. Schema Cache'i Yenile (Supabase'in değişikliği görmesi için kritik)
NOTIFY pgrst, 'reload config';

-- Kontrol için (bunu çalıştırmanıza gerek yok, sadece bilgi amaçlı)
-- SELECT * FROM information_schema.table_constraints WHERE constraint_name = 'diagnosis_test_assignments_student_id_fkey';
