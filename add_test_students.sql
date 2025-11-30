-- Test için örnek öğrenciler ekle
-- Not: Bu script'i çalıştırmadan önce bir öğretmen hesabı ile giriş yapmalısınız

-- Önce mevcut öğretmen ID'sini bulalım (ilk öğretmeni kullanacağız)
DO $$
DECLARE
    tutor_id UUID;
BEGIN
    -- İlk öğretmeni bul
    SELECT id INTO tutor_id FROM public.users WHERE role = 'tutor' LIMIT 1;
    
    IF tutor_id IS NULL THEN
        RAISE EXCEPTION 'Sistemde öğretmen bulunamadı. Lütfen önce bir öğretmen hesabı oluşturun.';
    END IF;

    -- Örnek öğrenciler ekle
    INSERT INTO public.students (id, name, grade, tutor_id, contact, level, xp, learning_loop_status, created_at)
    VALUES
        (gen_random_uuid(), 'Ahmet Yılmaz', 8, tutor_id, '0555 123 4567', 'intermediate', 0, 'active', NOW()),
        (gen_random_uuid(), 'Ayşe Demir', 9, tutor_id, '0555 234 5678', 'advanced', 0, 'active', NOW()),
        (gen_random_uuid(), 'Mehmet Kaya', 7, tutor_id, '0555 345 6789', 'beginner', 0, 'active', NOW()),
        (gen_random_uuid(), 'Zeynep Çelik', 10, tutor_id, '0555 456 7890', 'intermediate', 0, 'active', NOW()),
        (gen_random_uuid(), 'Can Arslan', 8, tutor_id, '0555 567 8901', 'advanced', 0, 'active', NOW()),
        (gen_random_uuid(), 'Elif Şahin', 9, tutor_id, '0555 678 9012', 'intermediate', 0, 'active', NOW()),
        (gen_random_uuid(), 'Burak Öztürk', 11, tutor_id, '0555 789 0123', 'advanced', 0, 'active', NOW()),
        (gen_random_uuid(), 'Selin Yıldız', 8, tutor_id, '0555 890 1234', 'beginner', 0, 'active', NOW())
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Test öğrencileri başarıyla eklendi!';
END $$;
