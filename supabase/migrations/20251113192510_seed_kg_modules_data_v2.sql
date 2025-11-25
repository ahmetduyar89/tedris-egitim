/*
  # Seed KG Modules Data - Version 2
  
  This migration seeds the initial module data for the knowledge graph system.
  Uses a security definer function to bypass RLS during seeding.
  
  ## Changes
  
  1. Create a temporary security definer function to insert data
  2. Insert 12 mathematics modules for grade 8
  3. Insert prerequisite relationships
  4. Insert sample content for each module
  5. Drop the temporary function
*/

-- Create a security definer function to insert modules bypassing RLS
CREATE OR REPLACE FUNCTION seed_kg_modules_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert kg_modules
  INSERT INTO kg_modules (code, title, subject, grade, unit, difficulty_level, description, estimated_duration_minutes)
  VALUES
    ('M1', 'Doğal Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 1, 'Doğal sayıların tanımı, özellikleri ve temel işlemler', 45),
    ('M2', 'Tam Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 2, 'Tam sayılar ve işlemler, mutlak değer', 60),
    ('M3', 'Asal Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 2, 'Asal sayılar, asal çarpanlara ayırma', 50),
    ('M4', 'EBOB ve EKOK', 'Matematik', 8, 'Sayılar ve İşlemler', 3, 'En büyük ortak bölen ve en küçük ortak kat', 70),
    ('M5', 'Üslü Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 3, 'Üslü sayılar ve işlemler, üs kuralları', 80),
    ('M6', 'Kareköklü Sayılar', 'Matematik', 8, 'Sayılar ve İşlemler', 4, 'Karekök kavramı, karekök işlemleri', 90),
    ('M7', 'Cebirsel İfadeler', 'Matematik', 8, 'Cebir', 2, 'Değişken, terim, katsayı kavramları', 60),
    ('M8', 'Denklemler', 'Matematik', 8, 'Cebir', 3, 'Birinci dereceden bir bilinmeyenli denklemler', 75),
    ('M9', 'Eşitsizlikler', 'Matematik', 8, 'Cebir', 3, 'Birinci dereceden eşitsizlikler', 70),
    ('M10', 'Üçgenler', 'Matematik', 8, 'Geometri', 2, 'Üçgen çeşitleri, açı özellikleri', 65),
    ('M11', 'Dörtgenler', 'Matematik', 8, 'Geometri', 3, 'Dörtgen çeşitleri, alan ve çevre hesaplamaları', 70),
    ('M12', 'Dönüşüm Geometrisi', 'Matematik', 8, 'Geometri', 4, 'Öteleme, yansıma, dönme', 85)
  ON CONFLICT (code) DO NOTHING;

  -- Insert prerequisites
  WITH module_ids AS (
    SELECT id, code FROM kg_modules WHERE code IN ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12')
  )
  INSERT INTO kg_prerequisites (module_id, prerequisite_module_id, relationship_type, strength)
  SELECT
    m2.id,
    m1.id,
    CASE
      WHEN (m1.code = 'M3' AND m2.code = 'M4') OR
           (m1.code = 'M2' AND m2.code = 'M5') OR
           (m1.code = 'M5' AND m2.code = 'M6') OR
           (m1.code = 'M7' AND m2.code = 'M8') OR
           (m1.code = 'M8' AND m2.code = 'M9') OR
           (m1.code = 'M11' AND m2.code = 'M12')
      THEN 'CRITICAL'
      ELSE 'RECOMMENDED'
    END,
    CASE
      WHEN (m1.code = 'M3' AND m2.code = 'M4') OR
           (m1.code = 'M2' AND m2.code = 'M5') OR
           (m1.code = 'M5' AND m2.code = 'M6') OR
           (m1.code = 'M7' AND m2.code = 'M8') OR
           (m1.code = 'M8' AND m2.code = 'M9') OR
           (m1.code = 'M11' AND m2.code = 'M12')
      THEN 0.9
      ELSE 0.7
    END
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

  -- Insert sample content
  WITH module_ids AS (
    SELECT id, code, title FROM kg_modules WHERE code IN ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12')
  )
  INSERT INTO kg_content (module_id, content_type, title, description, difficulty_level, estimated_duration_minutes, metadata)
  SELECT
    m.id,
    content_data.content_type,
    m.title || content_data.title_suffix,
    m.title || content_data.desc_suffix,
    CASE
      WHEN m.code IN ('M1', 'M2', 'M7', 'M10') THEN content_data.difficulty_easy
      WHEN m.code IN ('M3', 'M4', 'M8', 'M9', 'M11') THEN content_data.difficulty_medium
      ELSE content_data.difficulty_hard
    END,
    content_data.duration,
    content_data.metadata::jsonb
  FROM module_ids m
  CROSS JOIN (
    VALUES
      ('video', ' - Temel Kavramlar', ' konusunun temel kavramlarını öğreten video ders', 1, 2, 3, 30, '{"source": "internal", "language": "tr", "format": "mp4"}'),
      ('interactive', ' - Pratik Alıştırmalar', ' konusunda interaktif alıştırmalar ve örnekler', 2, 3, 4, 45, '{"type": "interactive_exercise", "question_count": 15}'),
      ('quiz', ' - Değerlendirme Testi', ' konusunu değerlendirmek için quiz', 2, 3, 4, 20, '{"question_count": 10, "passing_score": 70}')
  ) AS content_data(content_type, title_suffix, desc_suffix, difficulty_easy, difficulty_medium, difficulty_hard, duration, metadata)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Knowledge Graph seed data successfully inserted!';
END;
$$;

-- Execute the function to seed data
SELECT seed_kg_modules_data();

-- Drop the temporary function
DROP FUNCTION IF EXISTS seed_kg_modules_data();
