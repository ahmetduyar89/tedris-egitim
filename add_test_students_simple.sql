-- Basit test öğrencileri ekleme
-- Önce öğretmen ID'nizi bulun ve aşağıdaki 'YOUR_TUTOR_ID_HERE' yerine yapıştırın

-- ADIM 1: Öğretmen ID'nizi bulmak için bu sorguyu çalıştırın:
-- SELECT id, email FROM public.users WHERE role = 'tutor';

-- ADIM 2: Yukarıdaki sorgudan aldığınız ID'yi aşağıya yapıştırın
-- Örnek: '123e4567-e89b-12d3-a456-426614174000'

INSERT INTO public.students (name, grade, tutor_id, contact, level, xp, learning_loop_status, created_at)
VALUES
    ('Ahmet Yılmaz', 8, 'YOUR_TUTOR_ID_HERE', '0555 123 4567', 'intermediate', 0, 'active', NOW()),
    ('Ayşe Demir', 9, 'YOUR_TUTOR_ID_HERE', '0555 234 5678', 'advanced', 0, 'active', NOW()),
    ('Mehmet Kaya', 7, 'YOUR_TUTOR_ID_HERE', '0555 345 6789', 'beginner', 0, 'active', NOW()),
    ('Zeynep Çelik', 10, 'YOUR_TUTOR_ID_HERE', '0555 456 7890', 'intermediate', 0, 'active', NOW()),
    ('Can Arslan', 8, 'YOUR_TUTOR_ID_HERE', '0555 567 8901', 'advanced', 0, 'active', NOW()),
    ('Elif Şahin', 9, 'YOUR_TUTOR_ID_HERE', '0555 678 9012', 'intermediate', 0, 'active', NOW()),
    ('Burak Öztürk', 11, 'YOUR_TUTOR_ID_HERE', '0555 789 0123', 'advanced', 0, 'active', NOW()),
    ('Selin Yıldız', 8, 'YOUR_TUTOR_ID_HERE', '0555 890 1234', 'beginner', 0, 'active', NOW());
