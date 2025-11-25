/*
  # Soru Bankası Atamaları - Notes Kolonu Ekleme

  1. Değişiklikler
    - `question_bank_assignments` tablosuna `notes` kolonu eklenir
    - `notes`: Öğretmenin öğrenciye özel notları (opsiyonel)
    - Örnek: "Bu testi dikkatlice yap", "Önceki konuyu tekrar et"

  2. Notlar
    - Kolon opsiyoneldir (NULL olabilir)
    - Text tipindedir (sınırsız uzunluk)
*/

-- notes kolonunu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_bank_assignments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE question_bank_assignments ADD COLUMN notes text;
  END IF;
END $$;