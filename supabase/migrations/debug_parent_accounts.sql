-- Veli Hesaplarını Kontrol ve Düzeltme Script'i
-- Bu script'i Supabase SQL Editor'da çalıştırarak veli hesaplarını kontrol edebilirsiniz

-- ============================================================================
-- 1. TÜM VELİ KAYITLARINI GÖRÜNTÜLE
-- ============================================================================

SELECT 
    p.id,
    p.name as veli_adi,
    p.email,
    p.phone as telefon,
    p.created_at as olusturulma_tarihi,
    COUNT(psr.student_id) as ogrenci_sayisi
FROM parents p
LEFT JOIN parent_student_relations psr ON p.id = psr.parent_id
GROUP BY p.id, p.name, p.email, p.phone, p.created_at
ORDER BY p.created_at DESC;

-- ============================================================================
-- 2. VELİ-ÖĞRENCİ İLİŞKİLERİNİ GÖRÜNTÜLE
-- ============================================================================

SELECT 
    p.name as veli_adi,
    p.email as veli_email,
    p.phone as veli_telefon,
    s.name as ogrenci_adi,
    s.grade as sinif,
    psr.relationship_type as iliski_tipi,
    psr.created_at as iliski_tarihi
FROM parent_student_relations psr
JOIN parents p ON p.id = psr.parent_id
JOIN students s ON s.id = psr.student_id
ORDER BY p.name, s.name;

-- ============================================================================
-- 3. VELİ HESABI OLMAYAN ÖĞRENCİLERİ BUL
-- ============================================================================

SELECT 
    s.id,
    s.name as ogrenci_adi,
    s.grade as sinif,
    s.parent_name as veli_adi_students_tablosunda,
    s.parent_phone as veli_telefon,
    CASE 
        WHEN psr.parent_id IS NULL THEN '❌ Veli hesabı yok'
        ELSE '✅ Veli hesabı var'
    END as durum
FROM students s
LEFT JOIN parent_student_relations psr ON s.id = psr.student_id
WHERE s.parent_name IS NOT NULL AND s.parent_name != ''
ORDER BY durum, s.name;

-- ============================================================================
-- 4. BELİRLİ BİR VELİYİ ARA (Ad-soyada göre)
-- ============================================================================

-- Örnek kullanım: 'Ahmet Yılmaz' yerine aradığınız veli adını yazın
SELECT 
    p.*,
    array_agg(s.name) as ogrenciler
FROM parents p
LEFT JOIN parent_student_relations psr ON p.id = psr.parent_id
LEFT JOIN students s ON s.id = psr.student_id
WHERE p.name ILIKE '%Ahmet%' -- Buraya aradığınız ismi yazın
GROUP BY p.id;

-- ============================================================================
-- 5. EMAIL OLMAYAN VELİLERİ BUL
-- ============================================================================

SELECT 
    p.id,
    p.name as veli_adi,
    p.phone as telefon,
    p.email,
    CASE 
        WHEN p.email IS NULL THEN '❌ Email yok'
        WHEN p.email = '' THEN '❌ Email boş'
        ELSE '✅ Email var'
    END as email_durumu
FROM parents p
WHERE p.email IS NULL OR p.email = ''
ORDER BY p.name;

-- ============================================================================
-- 6. SUPABASE AUTH'DA OLMAYAN VELİLERİ BUL
-- ============================================================================

-- Not: Bu sorgu auth.users tablosuna erişim gerektirir
-- Eğer hata alırsanız, bu normal bir durumdur (RLS nedeniyle)
SELECT 
    p.id,
    p.name as veli_adi,
    p.email,
    CASE 
        WHEN au.id IS NULL THEN '❌ Auth kaydı yok'
        ELSE '✅ Auth kaydı var'
    END as auth_durumu
FROM parents p
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY auth_durumu, p.name;

-- ============================================================================
-- 7. ÖRNEK VELİ HESABI OLUŞTURMA (Manuel)
-- ============================================================================

-- DİKKAT: Bu kodu çalıştırmadan önce değerleri düzenleyin!
-- Bu sadece bir örnektir, gerçek kullanımda öğretmen arayüzünden oluşturun

/*
-- Önce Supabase Auth'da kullanıcı oluşturmanız gerekir
-- Ardından aşağıdaki kodu çalıştırın:

INSERT INTO parents (id, name, email, phone, password_hash)
VALUES (
    'AUTH_USER_ID_BURAYA', -- Supabase Auth'dan alınan user ID
    'Veli Adı Soyadı',
    'parent.email@tedris.app',
    '5XX XXX XX XX',
    'managed_by_auth'
);

-- Veli-öğrenci ilişkisi oluştur
INSERT INTO parent_student_relations (parent_id, student_id, relationship_type)
VALUES (
    'PARENT_ID_BURAYA',
    'STUDENT_ID_BURAYA',
    'vasi' -- veya 'anne', 'baba'
);
*/

-- ============================================================================
-- 8. VELİ İSTATİSTİKLERİ
-- ============================================================================

SELECT 
    COUNT(*) as toplam_veli_sayisi,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as email_olan_veli_sayisi,
    COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as email_olmayan_veli_sayisi,
    COUNT(DISTINCT psr.student_id) as veli_hesabi_olan_ogrenci_sayisi
FROM parents p
LEFT JOIN parent_student_relations psr ON p.id = psr.parent_id;

-- ============================================================================
-- 9. ÖĞRENCİ İSTATİSTİKLERİ
-- ============================================================================

SELECT 
    COUNT(*) as toplam_ogrenci_sayisi,
    COUNT(CASE WHEN parent_name IS NOT NULL AND parent_name != '' THEN 1 END) as veli_bilgisi_olan_ogrenci,
    COUNT(CASE WHEN psr.parent_id IS NOT NULL THEN 1 END) as veli_hesabi_bagli_ogrenci,
    COUNT(CASE WHEN parent_name IS NOT NULL AND parent_name != '' AND psr.parent_id IS NULL THEN 1 END) as veli_bilgisi_var_ama_hesap_yok
FROM students s
LEFT JOIN parent_student_relations psr ON s.id = psr.student_id;
