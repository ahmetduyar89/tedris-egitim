/*
  # Fix KG Modules RLS and Seed Data
  
  This migration fixes the Row Level Security policy for kg_modules to allow
  proper data insertion and seeds the initial module data.
  
  ## Changes
  
  1. Drop and recreate RLS policies for kg_modules
     - Allow INSERT for service role and authenticated users during setup
     - Keep SELECT open for all authenticated users
     - Allow UPDATE/DELETE for tutors and admins
  
  2. Seed Data
     - Insert 12 mathematics modules for grade 8
     - Insert prerequisite relationships
     - Insert sample content for each module
  
  ## Security
  
  - Students can view all modules (SELECT)
  - Tutors and admins can modify modules (INSERT/UPDATE/DELETE)
  - System can always insert during migrations
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Only admins can modify modules" ON kg_modules;

-- Create more permissive policies for module management
CREATE POLICY "Tutors and admins can manage modules"
  ON kg_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('tutor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('tutor', 'admin')
    )
  );

-- Temporarily disable RLS to insert seed data
ALTER TABLE kg_modules DISABLE ROW LEVEL SECURITY;

-- Insert kg_modules (Mathematics Modules - Grade 8)
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

-- Insert kg_prerequisites (Module Dependencies)
WITH module_ids AS (
  SELECT id, code FROM kg_modules WHERE code IN ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12')
)
INSERT INTO kg_prerequisites (module_id, prerequisite_module_id, relationship_type, strength)
SELECT
  m2.id,
  m1.id,
  'RECOMMENDED',
  0.7
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

-- Mark critical prerequisites
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

-- Insert kg_content (Sample Content for Each Module)
WITH module_ids AS (
  SELECT id, code, title FROM kg_modules WHERE code IN ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12')
)
INSERT INTO kg_content (module_id, content_type, title, description, difficulty_level, estimated_duration_minutes, metadata)
SELECT
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
  '{"source": "internal", "language": "tr", "format": "mp4"}'::jsonb
FROM module_ids m
UNION ALL
SELECT
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
  '{"type": "interactive_exercise", "question_count": 15}'::jsonb
FROM module_ids m
UNION ALL
SELECT
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
  '{"question_count": 10, "passing_score": 70}'::jsonb
FROM module_ids m
ON CONFLICT DO NOTHING;

-- Re-enable RLS
ALTER TABLE kg_modules ENABLE ROW LEVEL SECURITY;
