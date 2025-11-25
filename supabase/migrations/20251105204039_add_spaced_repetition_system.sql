/*
  # Spaced Repetition (Aralıklı Tekrar) Sistemi

  Bu migration, bilimsel olarak kanıtlanmış aralıklı tekrar sistemini ekler.
  Sistem, Ebbinghaus'un Unutma Eğrisi ve SM-2 (SuperMemo 2) algoritmasına dayanır.

  ## Yeni Tablolar

  ### 1. `flashcards` - Dijital Öğrenme Kartları
    - `id` (uuid, primary key) - Benzersiz kart kimliği
    - `teacher_id` (uuid, references users) - Kartı oluşturan öğretmen
    - `subject` (text) - Ders adı (Matematik, Fen, vb.)
    - `grade` (integer) - Sınıf seviyesi
    - `topic` (text) - Konu başlığı
    - `front_content` (text) - Kartın ön yüzü (soru/kavram)
    - `back_content` (text) - Kartın arka yüzü (cevap/açıklama)
    - `difficulty_level` (integer) - Zorluk seviyesi (1-5)
    - `created_at` (timestamptz) - Oluşturulma zamanı
    - `is_ai_generated` (boolean) - AI tarafından mı oluşturuldu?

  ### 2. `spaced_repetition_schedule` - Tekrar Programı
    - `id` (uuid, primary key) - Benzersiz program kimliği
    - `student_id` (uuid, references students) - Öğrenci
    - `flashcard_id` (uuid, references flashcards) - İlgili kart
    - `ease_factor` (decimal) - Kolaylık faktörü (SM-2 algoritması, başlangıç: 2.5)
    - `interval_days` (integer) - Bir sonraki tekrara kadar gün sayısı
    - `repetition_count` (integer) - Toplam tekrar sayısı
    - `last_reviewed_at` (timestamptz) - Son tekrar tarihi
    - `next_review_date` (date) - Bir sonraki tekrar tarihi
    - `mastery_level` (integer) - Ustalık seviyesi (0-5)
    - `created_at` (timestamptz) - İlk atama zamanı

  ### 3. `flashcard_reviews` - Tekrar Geçmişi
    - `id` (uuid, primary key) - Benzersiz inceleme kimliği
    - `schedule_id` (uuid, references spaced_repetition_schedule) - İlgili program
    - `student_id` (uuid, references students) - Öğrenci
    - `flashcard_id` (uuid, references flashcards) - İncelenen kart
    - `quality_rating` (integer) - Performans puanı (0-5, SM-2)
    - `time_spent_seconds` (integer) - Harcanan süre (saniye)
    - `reviewed_at` (timestamptz) - İnceleme zamanı
    - `was_correct` (boolean) - Doğru mu cevaplandı?

  ### 4. `mini_quizzes` - Günlük Mini Sınavlar
    - `id` (uuid, primary key) - Benzersiz sınav kimliği
    - `student_id` (uuid, references students) - Öğrenci
    - `subject` (text) - Ders
    - `topic` (text) - Konu
    - `flashcard_ids` (jsonb) - Kullanılan kartların ID'leri (array)
    - `score` (integer) - Puan (0-100)
    - `total_questions` (integer) - Toplam soru sayısı
    - `correct_answers` (integer) - Doğru cevap sayısı
    - `duration_seconds` (integer) - Süre (saniye)
    - `completed_at` (timestamptz) - Tamamlanma zamanı
    - `created_at` (timestamptz) - Oluşturulma zamanı

  ## Güvenlik

  - Her tabloda Row Level Security (RLS) etkin
  - Öğrenciler sadece kendi kayıtlarını görür/günceller
  - Öğretmenler kendi öğrencilerinin kayıtlarını görür
  - Flashcard'lar herkese açık (okuma), sadece öğretmen oluşturur

  ## Önemli Notlar

  1. **SM-2 Algoritması**: ease_factor ve interval_days SuperMemo 2 algoritmasıyla hesaplanır
  2. **Unutma Eğrisi**: next_review_date, öğrencinin performansına göre dinamik ayarlanır
  3. **Mastery Level**: 0 (Yeni) → 5 (Uzman) arasında ilerler
  4. **Quality Rating**: 0 (Tamamen Yanlış) → 5 (Mükemmel, Kolay) arası derecelendirme
*/

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  grade integer NOT NULL,
  topic text NOT NULL,
  front_content text NOT NULL,
  back_content text NOT NULL,
  difficulty_level integer DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_at timestamptz DEFAULT now(),
  is_ai_generated boolean DEFAULT false
);

-- Create spaced_repetition_schedule table
CREATE TABLE IF NOT EXISTS spaced_repetition_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  flashcard_id uuid REFERENCES flashcards(id) ON DELETE CASCADE,
  ease_factor decimal DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  interval_days integer DEFAULT 1,
  repetition_count integer DEFAULT 0,
  last_reviewed_at timestamptz,
  next_review_date date DEFAULT CURRENT_DATE,
  mastery_level integer DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, flashcard_id)
);

-- Create flashcard_reviews table
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES spaced_repetition_schedule(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  flashcard_id uuid REFERENCES flashcards(id) ON DELETE CASCADE,
  quality_rating integer NOT NULL CHECK (quality_rating >= 0 AND quality_rating <= 5),
  time_spent_seconds integer DEFAULT 0,
  reviewed_at timestamptz DEFAULT now(),
  was_correct boolean DEFAULT false
);

-- Create mini_quizzes table
CREATE TABLE IF NOT EXISTS mini_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text,
  flashcard_ids jsonb DEFAULT '[]'::jsonb,
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  total_questions integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashcards_subject_grade ON flashcards(subject, grade);
CREATE INDEX IF NOT EXISTS idx_flashcards_teacher ON flashcards(teacher_id);
CREATE INDEX IF NOT EXISTS idx_spaced_schedule_student ON spaced_repetition_schedule(student_id);
CREATE INDEX IF NOT EXISTS idx_spaced_schedule_next_review ON spaced_repetition_schedule(next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_student ON flashcard_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_mini_quizzes_student ON mini_quizzes(student_id);

-- Enable Row Level Security
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_quizzes ENABLE ROW LEVEL SECURITY;

-- Flashcards policies
CREATE POLICY "Everyone can view flashcards"
  ON flashcards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert own flashcards"
  ON flashcards FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own flashcards"
  ON flashcards FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own flashcards"
  ON flashcards FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Spaced repetition schedule policies
CREATE POLICY "Students can view own schedule"
  ON spaced_repetition_schedule FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Tutors can view their students' schedules"
  ON spaced_repetition_schedule FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own schedule"
  ON spaced_repetition_schedule FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Tutors can insert schedules for their students"
  ON spaced_repetition_schedule FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Flashcard reviews policies
CREATE POLICY "Students can view own reviews"
  ON flashcard_reviews FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Tutors can view their students' reviews"
  ON flashcard_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own reviews"
  ON flashcard_reviews FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Mini quizzes policies
CREATE POLICY "Students can view own quizzes"
  ON mini_quizzes FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Tutors can view their students' quizzes"
  ON mini_quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own quizzes"
  ON mini_quizzes FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own quizzes"
  ON mini_quizzes FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());