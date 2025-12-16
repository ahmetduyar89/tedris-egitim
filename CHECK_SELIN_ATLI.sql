-- SELİN ATLI velisini kontrol et

-- 1. Parents tablosunda SELİN ATLI var mı?
SELECT * FROM parents WHERE name ILIKE '%selin%atli%';

-- 2. Students tablosunda SELİN ATLI'nın çocuğu var mı?
SELECT 
    id,
    name as ogrenci_adi,
    parent_name as veli_adi,
    parent_phone as veli_telefon,
    grade as sinif
FROM students 
WHERE parent_name ILIKE '%selin%atli%';

-- 3. Tüm velileri listele
SELECT id, name, email, phone FROM parents ORDER BY name;

-- 4. Veli hesabı olmayan ama veli bilgisi olan öğrenciler
SELECT 
    s.id,
    s.name as ogrenci_adi,
    s.parent_name as veli_adi,
    s.parent_phone as veli_telefon,
    CASE 
        WHEN psr.parent_id IS NULL THEN '❌ Veli hesabı YOK'
        ELSE '✅ Veli hesabı VAR'
    END as durum
FROM students s
LEFT JOIN parent_student_relations psr ON s.id = psr.student_id
WHERE s.parent_name IS NOT NULL AND s.parent_name != ''
ORDER BY durum, s.parent_name;
