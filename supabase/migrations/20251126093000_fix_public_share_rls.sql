/*
  Fix Public Share RLS Policies
  
  Sorun: Mevcut politikalar sadece 'anon' (giriş yapmamış) kullanıcılara izin veriyor.
  Eğer sisteme giriş yapmış bir kullanıcı (örneğin başka bir öğretmen veya öğrenci) linke tıklarsa,
  'authenticated' rolüne sahip olduğu için erişimi reddediliyor.
  
  Çözüm: Politikaları 'anon' yerine 'anon, authenticated' (veya public) olarak güncelleyerek
  herkesin (giriş yapmış veya yapmamış) erişebilmesini sağlıyoruz.
*/

-- 1. public_content_shares tablosu için politikalar
DROP POLICY IF EXISTS "Anyone can read active shares by token" ON public_content_shares;
DROP POLICY IF EXISTS "Anyone can update view count on active shares" ON public_content_shares;

CREATE POLICY "Anyone can read active shares by token"
  ON public_content_shares
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Anyone can update view count on active shares"
  ON public_content_shares
  FOR UPDATE
  TO anon, authenticated
  USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > now())
  )
  WITH CHECK (
    is_active = true AND
    (expires_at IS NULL OR expires_at > now())
  );

-- 2. content_library tablosu için politikalar
DROP POLICY IF EXISTS "Anyone can read shared content" ON content_library;

CREATE POLICY "Anyone can read shared content"
  ON content_library
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_content_shares
      WHERE public_content_shares.content_id = content_library.id
      AND public_content_shares.is_active = true
      AND (public_content_shares.expires_at IS NULL OR public_content_shares.expires_at > now())
    )
  );

-- 3. interactive_content tablosu için politikalar
DROP POLICY IF EXISTS "Anyone can read shared interactive content" ON interactive_content;

CREATE POLICY "Anyone can read shared interactive content"
  ON interactive_content
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_library
      JOIN public_content_shares ON public_content_shares.content_id = content_library.id
      WHERE content_library.interactive_content_id = interactive_content.id
      AND public_content_shares.is_active = true
      AND (public_content_shares.expires_at IS NULL OR public_content_shares.expires_at > now())
    )
  );
