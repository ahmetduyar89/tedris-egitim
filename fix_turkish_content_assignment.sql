/*
  # Türkçe İçerik Atama Sistemi Düzeltmesi
  
  ## Sorun
  Kelimeler, deyimler ve atasözleri öğrenciye atanmıyor çünkü:
  1. `flashcards` tablosunda `category` ve `week_assigned` kolonları yok
  2. Türkçe içerikler için özel bir atama tablosu yok
  
  ## Çözüm
  1. `flashcards` tablosuna eksik kolonları ekle
  2. Türkçe içerik atamaları için yeni bir tablo oluştur: `turkish_content_assignments`
  3. Öğrencilerin atanan içerikleri görebilmesi için RLS politikaları ekle
  
  ## Değişiklikler
  - `flashcards` tablosuna `category` ve `week_assigned` kolonları eklenir
  - `turkish_content_assignments` tablosu oluşturulur
  - Gerekli indeksler ve RLS politikaları eklenir
*/

-- 1. flashcards tablosuna eksik kolonları ekle
DO $$
BEGIN
  -- category kolonu ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flashcards' AND column_name = 'category'
  ) THEN
    ALTER TABLE flashcards ADD COLUMN category text;
  END IF;

  -- week_assigned kolonu ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flashcards' AND column_name = 'week_assigned'
  ) THEN
    ALTER TABLE flashcards ADD COLUMN week_assigned date;
  END IF;
END $$;

-- 2. Türkçe içerik atamaları tablosu oluştur
CREATE TABLE IF NOT EXISTS turkish_content_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES turkish_content_library(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  is_learned boolean DEFAULT false,
  learned_at timestamptz,
  review_count integer DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, content_id, week_start_date)
);

-- 3. İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_turkish_assignments_student 
  ON turkish_content_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_turkish_assignments_teacher 
  ON turkish_content_assignments(teacher_id);

CREATE INDEX IF NOT EXISTS idx_turkish_assignments_week 
  ON turkish_content_assignments(week_start_date);

CREATE INDEX IF NOT EXISTS idx_turkish_assignments_content 
  ON turkish_content_assignments(content_id);

CREATE INDEX IF NOT EXISTS idx_flashcards_category 
  ON flashcards(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_flashcards_week 
  ON flashcards(week_assigned) WHERE week_assigned IS NOT NULL;

-- 4. RLS politikaları
ALTER TABLE turkish_content_assignments ENABLE ROW LEVEL SECURITY;

-- Öğrenciler kendi atamalarını görebilir
CREATE POLICY "Students can view own turkish content assignments"
  ON turkish_content_assignments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Öğrenciler kendi atamalarını güncelleyebilir (öğrenme durumu)
CREATE POLICY "Students can update own turkish content assignments"
  ON turkish_content_assignments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Öğretmenler kendi öğrencilerinin atamalarını görebilir
CREATE POLICY "Teachers can view their students' turkish content assignments"
  ON turkish_content_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Öğretmenler kendi öğrencilerine atama yapabilir
CREATE POLICY "Teachers can insert turkish content assignments"
  ON turkish_content_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Öğretmenler kendi yaptığı atamaları güncelleyebilir
CREATE POLICY "Teachers can update own turkish content assignments"
  ON turkish_content_assignments FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Öğretmenler kendi yaptığı atamaları silebilir
CREATE POLICY "Teachers can delete own turkish content assignments"
  ON turkish_content_assignments FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- 5. Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_turkish_content_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_turkish_content_assignments_updated_at 
  ON turkish_content_assignments;

CREATE TRIGGER trigger_update_turkish_content_assignments_updated_at
  BEFORE UPDATE ON turkish_content_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_turkish_content_assignments_updated_at();

-- 6. Yorum ekle
COMMENT ON TABLE turkish_content_assignments IS 
  'Öğrencilere atanan Türkçe içerikleri (kelimeler, deyimler, atasözleri) takip eder';

COMMENT ON COLUMN turkish_content_assignments.is_learned IS 
  'Öğrencinin bu içeriği öğrenip öğrenmediği';

COMMENT ON COLUMN turkish_content_assignments.review_count IS 
  'Öğrencinin bu içeriği kaç kez tekrar ettiği';
