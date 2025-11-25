/*
  # Seed Knowledge Graph Data - Temel Öğrenme Modülleri

  Bu migration, dinamik öğrenme planı sistemi için gerekli temel verileri ekler.

  ## 1. Temel Modüller (kg_modules)
    8. Sınıf Matematik dersi için temel konular ekleniyor:
    - Doğal Sayılar ve İşlemler
    - Asal Sayılar ve Çarpanlar
    - EBOB ve EKOK
    - Üslü Sayılar
    - Kareköklü Sayılar
    - Denklemler
    - Eşitsizlikler
    - Geometri Temelleri

  ## 2. Ön Koşul İlişkileri (kg_prerequisites)
    Modüller arası mantıksal bağımlılıkları tanımlanıyor.
    Örneğin: EBOB-EKOK konusu için "Asal Çarpanlara Ayırma" kritik ön koşuldur.

  ## 3. Öğrenme İçerikleri (kg_content)
    Her modül için örnek öğrenme içerikleri ekleniyor:
    - Video dersler
    - Pratik alıştırmalar
    - Quiz'ler

  ## 4. Notlar
    - Bu veriler başlangıç seed verisidir
    - Gerçek uygulamada öğretmenler kendi içeriklerini ekleyebilir
    - Modül kodları (M1, M2, M3...) sistematik takip için kullanılır
*/

-- Insert kg_modules (Temel Matematik Modülleri - 8. Sınıf)
INSERT INTO kg_modules (id, code, title, subject, grade, unit, difficulty_level, description, estimated_duration_minutes, created_at)
VALUES
  (gen_random_uuid(), 'M1', 'Doğal Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 1, 'Doğal sayıların tanımı, özellikleri ve temel işlemler', 45, now()),
  (gen_random_uuid(), 'M2', 'Tam Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 2, 'Tam sayılar ve işlemler, mutlak değer', 60, now()),
  (gen_random_uuid(), 'M3', 'Asal Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 2, 'Asal sayılar, asal çarpanlara ayırma', 50, now()),
  (gen_random_uuid(), 'M4', 'EBOB ve EKOK', 'Matematik', 8, 'Sayılar ve İşlemler', 3, 'En büyük ortak bölen ve en küçük ortak kat', 70, now()),
  (gen_random_uuid(), 'M5', 'Üslü Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 3, 'Üslü sayılar ve işlemler, üs kuralları', 80, now()),
  (gen_random_uuid(), 'M6', 'Kareköklü Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 4, 'Karekök kavramı, karekök işlemleri', 90, now()),
  (gen_random_uuid(), 'M7', 'Cebirsel İfadeler', 'Matematik', 8, 'Cebir', 2, 'Değişken, terim, katsayı kavramları', 60, now()),
  (gen_random_uuid(), 'M8', 'Denklemler', 'Matematik', 8, 'Cebir', 3, 'Birinci dereceden bir bilinmeyenli denklemler', 75, now()),
  (gen_random_uuid(), 'M9', 'Eşitsizlikler', 'Matematik', 8, 'Cebir', 3, 'Birinci dereceden eşitsizlikler', 70, now()),
  (gen_random_uuid(), 'M10', 'Üçgenler', 'Matematik', 8, 'Geometri', 2, 'Üçgen çeşitleri, açı özellikleri', 65, now()),
  (gen_random_uuid(), 'M11', 'Dörtgenler', 'Matematik', 8, 'Geometri', 3, 'Dörtgen çeşitleri, alan ve çevre hesaplamaları', 70, now()),
  (gen_random_uuid(), 'M12', 'Dönüşüm Geometrisi', 'Matematik', 8, 'Geometri', 4, 'Öteleme, yansıma, dönme', 85, now())
ON CONFLICT (code) DO NOTHING;

-- Insert kg_prerequisites (Modüller Arası Bağımlılıklar)
-- Not: Önce modül ID'lerini alıp sonra ilişkilendiriyoruz
WITH module_ids AS (
  SELECT id, code FROM kg_modules WHERE code IN ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12')
)
INSERT INTO kg_prerequisites (id, module_id, prerequisite_module_id, relationship_type, strength, created_at)
SELECT
  gen_random_uuid(),
  m2.id,
  m1.id,
  'RECOMMENDED',
  0.7,
  now()
FROM module_ids m1
CROSS JOIN module_ids m2
WHERE (m1.code = 'M1' AND m2.code = 'M2')
   OR (m1.code = 'M2' AND m2.code = 'M3')
   OR (m1.code = 'M3' AND m2.code = 'M4')
   OR (m1.code = 'M2' AND m2.code = 'M5')
   OR (m1.code = 'M5' AND m2.code = 'M6')
   OR (m1.code = 'M1' AND m2.code = 'M7')
   OR (m1.code = 'M7' AND m2.code = 'M8')
   OR (m1.code = 'M8' AND m2.code = 'M9')
   OR (m1.code = 'M1' AND m2.code = 'M10')
   OR (m1.code = 'M10' AND m2.code = 'M11')
   OR (m1.code = 'M11' AND m2.code = 'M12')
ON CONFLICT DO NOTHING;

-- Kritik bağımlılıkları CRITICAL olarak güncelle
WITH module_ids AS (
  SELECT id, code FROM kg_modules WHERE code IN ('M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M12')
)
UPDATE kg_prerequisites
SET relationship_type = 'CRITICAL', strength = 0.9
WHERE id IN (
  SELECT p.id
  FROM kg_prerequisites p
  JOIN module_ids m1 ON p.prerequisite_module_id = m1.id
  JOIN module_ids m2 ON p.module_id = m2.id
  WHERE (m1.code = 'M3' AND m2.code = 'M4')
     OR (m1.code = 'M2' AND m2.code = 'M5')
     OR (m1.code = 'M5' AND m2.code = 'M6')
     OR (m1.code = 'M7' AND m2.code = 'M8')
     OR (m1.code = 'M8' AND m2.code = 'M9')
     OR (m1.code = 'M11' AND m2.code = 'M12')
);

-- Insert kg_content (Her Modül İçin Örnek İçerikler)
WITH module_ids AS (
  SELECT id, code, title FROM kg_modules WHERE code IN ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12')
)
INSERT INTO kg_content (id, module_id, content_type, title, description, difficulty_level, estimated_duration_minutes, metadata, created_at)
SELECT
  gen_random_uuid(),
  m.id,
  'video',
  m.title || ' - Temel Kavramlar',
  m.title || ' konusunun temel kavramlarını öğreten video ders',
  CASE
    WHEN m.code IN ('M1', 'M2', 'M7', 'M10') THEN 1
    WHEN m.code IN ('M3', 'M4', 'M8', 'M9', 'M11') THEN 2
    ELSE 3
  END,
  30,
  '{"source": "internal", "language": "tr", "format": "mp4"}'::jsonb,
  now()
FROM module_ids m
UNION ALL
SELECT
  gen_random_uuid(),
  m.id,
  'interactive',
  m.title || ' - Pratik Alıştırmalar',
  m.title || ' konusunda interaktif alıştırmalar ve örnekler',
  CASE
    WHEN m.code IN ('M1', 'M2', 'M7', 'M10') THEN 2
    WHEN m.code IN ('M3', 'M4', 'M8', 'M9', 'M11') THEN 3
    ELSE 4
  END,
  45,
  '{"type": "interactive_exercise", "question_count": 15}'::jsonb,
  now()
FROM module_ids m
UNION ALL
SELECT
  gen_random_uuid(),
  m.id,
  'quiz',
  m.title || ' - Değerlendirme Testi',
  m.title || ' konusunu değerlendirmek için quiz',
  CASE
    WHEN m.code IN ('M1', 'M2', 'M7', 'M10') THEN 2
    WHEN m.code IN ('M3', 'M4', 'M8', 'M9', 'M11') THEN 3
    ELSE 4
  END,
  20,
  '{"question_count": 10, "passing_score": 70}'::jsonb,
  now()
FROM module_ids m
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Knowledge Graph seed data başarıyla eklendi!';
  RAISE NOTICE '- % modül eklendi', (SELECT COUNT(*) FROM kg_modules);
  RAISE NOTICE '- % ön koşul ilişkisi eklendi', (SELECT COUNT(*) FROM kg_prerequisites);
  RAISE NOTICE '- % içerik eklendi', (SELECT COUNT(*) FROM kg_content);
END $$;
