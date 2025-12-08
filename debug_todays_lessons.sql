-- Veritabanında bugünkü dersleri kontrol et
-- Supabase SQL Editor'da çalıştır

-- 1. Tüm dersleri göster (son 7 gün)
SELECT 
    id,
    tutor_id,
    student_name,
    start_time,
    end_time,
    subject,
    status,
    created_at
FROM private_lessons
WHERE start_time >= NOW() - INTERVAL '7 days'
ORDER BY start_time DESC
LIMIT 20;

-- 2. Bugünkü dersleri göster (Türkiye saati)
SELECT 
    id,
    student_name,
    start_time,
    start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul' as turkey_time,
    subject,
    status
FROM private_lessons
WHERE 
    DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') = CURRENT_DATE
    AND status != 'cancelled'
ORDER BY start_time;

-- 3. Gelecek dersleri göster
SELECT 
    id,
    student_name,
    start_time,
    start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul' as turkey_time,
    subject,
    status
FROM private_lessons
WHERE 
    start_time >= NOW()
    AND status != 'cancelled'
ORDER BY start_time
LIMIT 10;

-- 4. Tutor ID'nizi kontrol edin
-- Loglarda görünen user ID: 40695a5e-34f7-4da8-9bd6-2b5653203d60
SELECT 
    id,
    student_name,
    start_time,
    tutor_id
FROM private_lessons
WHERE tutor_id = '40695a5e-34f7-4da8-9bd6-2b5653203d60'
ORDER BY start_time DESC
LIMIT 10;
