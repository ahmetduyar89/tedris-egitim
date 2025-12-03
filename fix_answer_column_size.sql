-- SÜTUN BOYUTUNU ARTIRMA (Fix Column Size)

-- student_answer sütununun boyutunu artırarak uzun cevapların kaydedilmesini sağla
ALTER TABLE diagnosis_test_answers 
ALTER COLUMN student_answer TYPE TEXT;

-- Schema Cache'i Yenile
NOTIFY pgrst, 'reload config';
