/*
  # Populate Student Mastery from Existing Tests

  Bu migration, mevcut test sonuçlarından öğrenci mastery skorlarını hesaplar ve kaydeder.

  ## 1. İşlem Adımları
    - Tamamlanmış testleri ve soru bankası testlerini analiz et
    - Her test için topicBreakdown verilerini kontrol et
    - Topic'leri kg_modules ile eşleştir
    - Her öğrenci-modül için mastery skoru hesapla (doğru cevap oranı)
    - student_mastery tablosuna kaydet
    - mastery_history tablosuna log ekle

  ## 2. Mastery Skoru Hesaplama
    - Mastery Score = (Toplam Doğru / Toplam Soru) için her topic
    - Eğer bir öğrenci aynı konuyu birden fazla teste görmüşse, en son performansı kullan
    - Confidence level = Minimum(deneme sayısı / 3, 1.0)

  ## 3. Güvenlik
    - Bu migration mevcut verileri okur ve analiz eder
    - Sadece INSERT işlemi yapar, hiçbir veri silinmez
    - ON CONFLICT durumunda mevcut kayıt güncellenir (daha yeni veri varsa)

  ## 4. Notlar
    - Bu migration ilk kurulumda çalıştırılmalıdır
    - Sonraki testler için otomatik mastery güncelleme edge function kullanılacak
    - LearningMap bileşeni topic'leri modüllerle eşleştirmeye çalışır
*/

-- Function to match topic names to module titles (fuzzy matching)
CREATE OR REPLACE FUNCTION match_topic_to_module(topic_name TEXT)
RETURNS UUID AS $$
DECLARE
  module_id UUID;
BEGIN
  -- Exact match
  SELECT id INTO module_id
  FROM kg_modules
  WHERE LOWER(title) = LOWER(topic_name)
  LIMIT 1;

  IF module_id IS NOT NULL THEN
    RETURN module_id;
  END IF;

  -- Partial match (topic contains module title or vice versa)
  SELECT id INTO module_id
  FROM kg_modules
  WHERE LOWER(topic_name) LIKE '%' || LOWER(title) || '%'
     OR LOWER(title) LIKE '%' || LOWER(topic_name) || '%'
  ORDER BY
    CASE
      WHEN LOWER(title) = LOWER(topic_name) THEN 1
      WHEN LOWER(topic_name) LIKE LOWER(title) || '%' THEN 2
      WHEN LOWER(title) LIKE LOWER(topic_name) || '%' THEN 3
      ELSE 4
    END
  LIMIT 1;

  RETURN module_id;
END;
$$ LANGUAGE plpgsql;

-- Temporary table to hold test analysis results
CREATE TEMP TABLE temp_test_mastery AS
WITH test_data AS (
  -- Get completed tests from regular tests table
  SELECT
    t.student_id,
    t.id as test_id,
    t.submission_date,
    COALESCE(t.analysis->'topicBreakdown', '[]'::jsonb) as topic_breakdown,
    'regular_test' as source
  FROM tests t
  WHERE t.completed = true
    AND t.analysis IS NOT NULL
    AND t.analysis->'topicBreakdown' IS NOT NULL
    AND jsonb_array_length(COALESCE(t.analysis->'topicBreakdown', '[]'::jsonb)) > 0

  UNION ALL

  -- Get completed question bank tests
  SELECT
    qba.student_id,
    qba.id as test_id,
    qba.completed_at as submission_date,
    COALESCE(qba.answers, '[]'::jsonb) as topic_breakdown,
    'question_bank' as source
  FROM question_bank_assignments qba
  WHERE qba.status = 'Tamamlandı'
    AND qba.answers IS NOT NULL
    AND jsonb_array_length(COALESCE(qba.answers, '[]'::jsonb)) > 0
),
expanded_topics_regular AS (
  SELECT
    td.student_id,
    td.test_id,
    td.submission_date,
    elem->>'topic' as topic_name,
    COALESCE((elem->>'correct')::integer, 0) as correct,
    COALESCE((elem->>'correct')::integer, 0) + COALESCE((elem->>'wrong')::integer, 0) as total
  FROM test_data td
  CROSS JOIN LATERAL jsonb_array_elements(td.topic_breakdown) as elem
  WHERE td.source = 'regular_test'
    AND elem->>'topic' IS NOT NULL
),
expanded_topics_qbank AS (
  SELECT
    td.student_id,
    td.test_id,
    td.submission_date,
    COALESCE(elem->>'topic', 'Genel') as topic_name,
    CASE WHEN (elem->>'isCorrect')::boolean THEN 1 ELSE 0 END as correct,
    1 as total
  FROM test_data td
  CROSS JOIN LATERAL jsonb_array_elements(td.topic_breakdown) as elem
  WHERE td.source = 'question_bank'
),
expanded_topics AS (
  SELECT * FROM expanded_topics_regular
  UNION ALL
  SELECT * FROM expanded_topics_qbank
)
SELECT
  et.student_id,
  match_topic_to_module(et.topic_name) as module_id,
  et.topic_name,
  SUM(et.correct) as total_correct,
  SUM(et.total) as total_questions,
  CASE
    WHEN SUM(et.total) > 0
    THEN CAST(SUM(et.correct) AS NUMERIC) / CAST(SUM(et.total) AS NUMERIC)
    ELSE 0.0
  END as mastery_score,
  COUNT(DISTINCT et.test_id) as attempts_count,
  MAX(et.submission_date) as last_practiced_at,
  MIN(et.submission_date) as first_practiced_at
FROM expanded_topics et
WHERE et.topic_name IS NOT NULL
  AND et.topic_name != ''
  AND et.total > 0
GROUP BY et.student_id, match_topic_to_module(et.topic_name), et.topic_name
HAVING match_topic_to_module(et.topic_name) IS NOT NULL;

-- Insert or update student_mastery records
INSERT INTO student_mastery (
  id,
  student_id,
  module_id,
  mastery_score,
  confidence_level,
  attempts_count,
  last_practiced_at,
  first_practiced_at,
  streak_days,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  ttm.student_id,
  ttm.module_id,
  ttm.mastery_score,
  LEAST(CAST(ttm.attempts_count AS NUMERIC) / 3.0, 1.0) as confidence_level,
  ttm.attempts_count,
  ttm.last_practiced_at,
  ttm.first_practiced_at,
  CASE
    WHEN ttm.last_practiced_at::date = CURRENT_DATE THEN 1
    WHEN ttm.last_practiced_at::date = CURRENT_DATE - INTERVAL '1 day' THEN 1
    ELSE 0
  END as streak_days,
  now(),
  now()
FROM temp_test_mastery ttm
ON CONFLICT (student_id, module_id)
DO UPDATE SET
  mastery_score = EXCLUDED.mastery_score,
  confidence_level = EXCLUDED.confidence_level,
  attempts_count = EXCLUDED.attempts_count,
  last_practiced_at = EXCLUDED.last_practiced_at,
  streak_days = EXCLUDED.streak_days,
  updated_at = now()
WHERE student_mastery.last_practiced_at < EXCLUDED.last_practiced_at;

-- Insert mastery history records
INSERT INTO mastery_history (
  id,
  student_id,
  module_id,
  mastery_score,
  change_reason,
  previous_score,
  recorded_at
)
SELECT
  gen_random_uuid(),
  ttm.student_id,
  ttm.module_id,
  ttm.mastery_score,
  'test_completed',
  0.0,
  ttm.last_practiced_at
FROM temp_test_mastery ttm
ON CONFLICT DO NOTHING;

-- Drop temporary function
DROP FUNCTION IF EXISTS match_topic_to_module(TEXT);

-- Report results
DO $$
DECLARE
  mastery_count INTEGER;
  history_count INTEGER;
  student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mastery_count FROM student_mastery;
  SELECT COUNT(*) INTO history_count FROM mastery_history;
  SELECT COUNT(DISTINCT student_id) INTO student_count FROM student_mastery;

  RAISE NOTICE 'Mastery skorları başarıyla hesaplandı!';
  RAISE NOTICE '- % öğrenci için mastery kaydı oluşturuldu', student_count;
  RAISE NOTICE '- Toplam % modül mastery kaydı', mastery_count;
  RAISE NOTICE '- Toplam % mastery geçmişi kaydı', history_count;
END $$;
