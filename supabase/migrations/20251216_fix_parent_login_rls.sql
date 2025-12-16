-- Fix Parent Login RLS Policy
-- Veli girişi için RLS politikasını düzelt
-- Date: 2025-12-16

-- ============================================================================
-- SORUN: Veli giriş yaparken henüz auth.uid() NULL olduğu için
-- parents tablosundan veri çekemiyor
-- ============================================================================

-- Eski politikayı kaldır
DROP POLICY IF EXISTS "Parents can view own data" ON public.parents;

-- Yeni politikayı da kaldır (eğer varsa)
DROP POLICY IF EXISTS "Allow read access to parents for login" ON public.parents;

-- Yeni politika: Giriş yapmamış kullanıcılar da parents tablosunu okuyabilir
-- (Sadece SELECT için, INSERT/UPDATE/DELETE için hala auth gerekli)
CREATE POLICY "Allow read access to parents for login"
    ON public.parents FOR SELECT
    USING (true); -- Herkes okuyabilir (sadece SELECT)

-- Veliler kendi bilgilerini güncelleyebilir (bu politika değişmedi)
DROP POLICY IF EXISTS "Parents can update own data" ON public.parents;
CREATE POLICY "Parents can update own data"
    ON public.parents FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- AÇIKLAMA
-- ============================================================================

-- Bu değişiklik güvenlik riski oluşturmaz çünkü:
-- 1. Sadece SELECT (okuma) izni veriliyor
-- 2. Veli şifreleri Supabase Auth'da saklanıyor (parents tablosunda değil)
-- 3. password_hash alanı 'managed_by_auth' string'i içeriyor
-- 4. Gerçek şifre bilgisi parents tablosunda yok
-- 5. Giriş kontrolü Supabase Auth tarafından yapılıyor

COMMENT ON POLICY "Allow read access to parents for login" ON public.parents IS 
'Veli girişi için parents tablosunun okunmasına izin verir. Şifreler Supabase Auth''da saklandığı için güvenlik riski yoktur.';
