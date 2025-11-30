-- Otomatik öğretmen ID bulan versiyon
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

WITH tutor AS (
    SELECT id FROM public.users WHERE role = 'tutor' LIMIT 1
)
INSERT INTO public.students (name, grade, tutor_id, contact, level, xp, learning_loop_status, created_at)
SELECT 
    name, grade, tutor.id, contact, level, xp, learning_loop_status, created_at
FROM tutor, (VALUES
    ('Ahmet Yılmaz', 8, '0555 123 4567', 'intermediate', 0, 'active', NOW()),
    ('Ayşe Demir', 9, '0555 234 5678', 'advanced', 0, 'active', NOW()),
    ('Mehmet Kaya', 7, '0555 345 6789', 'beginner', 0, 'active', NOW()),
    ('Zeynep Çelik', 10, '0555 456 7890', 'intermediate', 0, 'active', NOW()),
    ('Can Arslan', 8, '0555 567 8901', 'advanced', 0, 'active', NOW()),
    ('Elif Şahin', 9, '0555 678 9012', 'intermediate', 0, 'active', NOW()),
    ('Burak Öztürk', 11, '0555 789 0123', 'advanced', 0, 'active', NOW()),
    ('Selin Yıldız', 8, '0555 890 1234', 'beginner', 0, 'active', NOW())
) AS s(name, grade, contact, level, xp, learning_loop_status, created_at);
