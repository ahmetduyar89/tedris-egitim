-- SELİN ATLI detaylı kontrol

-- 1. Parents tablosunda tam olarak nasıl kayıtlı?
SELECT 
    id,
    name,
    email,
    phone,
    created_at,
    length(name) as isim_uzunlugu,
    -- Karakterleri tek tek göster
    encode(name::bytea, 'hex') as name_hex
FROM parents 
WHERE name ILIKE '%selin%atli%';

-- 2. Tam eşleşme kontrolü (büyük/küçük harf duyarlı)
SELECT 
    'Exact match (case sensitive)' as test_type,
    COUNT(*) as sonuc
FROM parents 
WHERE name = 'SELİN ATLI'
UNION ALL
SELECT 
    'Case insensitive match' as test_type,
    COUNT(*) as sonuc
FROM parents 
WHERE name ILIKE 'SELİN ATLI'
UNION ALL
SELECT 
    'With trim' as test_type,
    COUNT(*) as sonuc
FROM parents 
WHERE TRIM(name) ILIKE 'SELİN ATLI';

-- 3. Tüm veli isimlerini göster (boşluk ve özel karakter kontrolü için)
SELECT 
    id,
    name,
    '|' || name || '|' as name_with_pipes,
    length(name) as uzunluk,
    email
FROM parents
ORDER BY name;

-- 4. SELİN ATLI'nın email ve auth durumu
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    CASE 
        WHEN p.email IS NULL THEN '❌ Email NULL'
        WHEN p.email = '' THEN '❌ Email BOŞ'
        ELSE '✅ Email: ' || p.email
    END as email_durumu
FROM parents p
WHERE p.name ILIKE '%selin%atli%';

-- 5. Veli-öğrenci ilişkisi
SELECT 
    p.id as parent_id,
    p.name as parent_name,
    p.email as parent_email,
    s.id as student_id,
    s.name as student_name,
    psr.relationship_type
FROM parent_student_relations psr
JOIN parents p ON p.id = psr.parent_id
JOIN students s ON s.id = psr.student_id
WHERE p.name ILIKE '%selin%atli%';
