/*
  # Mevcut Test Verilerinden Student_Mastery Doldurma
  
  Bu migration, mevcut test sonuçlarını analiz ederek student_mastery tablosunu doldurur.
  
  ## İşlem Adımları
  
  1. Tüm tamamlanmış testleri tarar
  2. Her testin topic breakdown verilerini alır
  3. Topic'leri kg_modules ile eşleştirir
  4. Her öğrenci-modül kombinasyonu için mastery_score hesaplar
  5. student_mastery tablosuna kayıt oluşturur
  
  ## Hesaplama Mantığı
  
  - mastery_score = toplam doğru / toplam soru
  - confidence_level = mastery_score (başlangıç için aynı)
  - attempts_count = o topic'te kaç test çözüldü
  - last_practiced_at = son test tarihi
  - first_practiced_at = ilk test tarihi
  
  ## Notlar
  
  - Bu işlem idempotent değildir (tekrar çalıştırıldığında yeniden doldurur)
  - Mevcut student_mastery kayıtlarını temizler
  - Topic matching case-insensitive yapılır
*/

-- Önce mevcut verilerden student_mastery oluşturmak için bir fonksiyon
CREATE OR REPLACE FUNCTION populate_student_mastery_from_tests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_record RECORD;
  topic_record RECORD;
  module_record RECORD;
  total_correct INTEGER;
  total_questions INTEGER;
  calculated_score NUMERIC;
BEGIN
  -- Her öğrenci için tüm testleri analiz et
  FOR test_record IN 
    SELECT 
      t.student_id,
      t.analysis,
      t.submission_date
    FROM tests t
    WHERE t.completed = true
    AND t.analysis IS NOT NULL
    AND t.analysis ? 'topicBreakdown'
  LOOP
    -- Her testteki topic breakdown'ı işle
    FOR topic_record IN
      SELECT 
        value->>'topic' as topic_name,
        (value->>'correct')::INTEGER as correct,
        (value->>'wrong')::INTEGER as wrong
      FROM jsonb_array_elements(test_record.analysis->'topicBreakdown')
    LOOP
      -- Topic'i kg_modules'te bul (case-insensitive)
      SELECT id INTO module_record
      FROM kg_modules
      WHERE LOWER(title) = LOWER(topic_record.topic_name)
      LIMIT 1;
      
      -- Eğer modül bulunduysa
      IF module_record.id IS NOT NULL THEN
        total_correct := topic_record.correct;
        total_questions := topic_record.correct + topic_record.wrong;
        
        -- Sıfır bölme kontrolü
        IF total_questions > 0 THEN
          calculated_score := ROUND((total_correct::NUMERIC / total_questions::NUMERIC), 2);
        ELSE
          calculated_score := 0.0;
        END IF;
        
        -- student_mastery'ye ekle veya güncelle
        INSERT INTO student_mastery (
          student_id,
          module_id,
          mastery_score,
          confidence_level,
          attempts_count,
          last_practiced_at,
          first_practiced_at,
          updated_at
        ) VALUES (
          test_record.student_id,
          module_record.id,
          calculated_score,
          calculated_score,
          1,
          test_record.submission_date,
          test_record.submission_date,
          NOW()
        )
        ON CONFLICT (student_id, module_id)
        DO UPDATE SET
          mastery_score = (
            -- Ağırlıklı ortalama: mevcut denemelerin ortalaması
            (student_mastery.mastery_score * student_mastery.attempts_count + calculated_score) 
            / (student_mastery.attempts_count + 1)
          ),
          confidence_level = (
            (student_mastery.confidence_level * student_mastery.attempts_count + calculated_score) 
            / (student_mastery.attempts_count + 1)
          ),
          attempts_count = student_mastery.attempts_count + 1,
          last_practiced_at = test_record.submission_date,
          first_practiced_at = LEAST(student_mastery.first_practiced_at, test_record.submission_date),
          updated_at = NOW();
          
        -- mastery_history'ye kaydet
        INSERT INTO mastery_history (
          student_id,
          module_id,
          mastery_score,
          change_reason,
          previous_score,
          test_id,
          recorded_at
        )
        SELECT
          test_record.student_id,
          module_record.id,
          calculated_score,
          'test_completed',
          sm.mastery_score,
          NULL, -- test_id'yi ekleyebiliriz ama şu an yok
          test_record.submission_date
        FROM student_mastery sm
        WHERE sm.student_id = test_record.student_id
        AND sm.module_id = module_record.id;
        
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Student mastery successfully populated from test data.';
END;
$$;

-- Fonksiyonu çalıştır
SELECT populate_student_mastery_from_tests();

-- Fonksiyonu temizle (artık gerekli değil)
DROP FUNCTION IF EXISTS populate_student_mastery_from_tests();
