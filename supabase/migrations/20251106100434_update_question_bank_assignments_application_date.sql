/*
  # Soru Bankası Atamaları - Uygulama Tarihi Güncellemesi

  1. Değişiklikler
    - `question_bank_assignments` tablosunda `due_date` kolonunu `application_date` olarak yeniden adlandır
    - `application_date`: Testin öğrenciye hangi gün uygulanacağını belirtir
    - Bu tarih haftalık programdaki ilgili güne test görevini otomatik ekler

  2. Notlar
    - Mevcut veriler korunur
    - İndeksler ve RLS politikaları etkilenmez
    - Geriye dönük uyumluluk: Eski kayıtlar aynı değerlerle devam eder
*/

-- Kolon adını değiştir: due_date -> application_date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_bank_assignments' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE question_bank_assignments RENAME COLUMN due_date TO application_date;
  END IF;
END $$;