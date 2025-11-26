/*
  Fix Infinite Recursion in Public Content Shares
  
  Sorun: 
  1. INSERT policy çok basit ve content_library kontrolü yapmıyor
  2. Bu durum sonsuz döngüye (infinite recursion) sebep oluyor
  
  Çözüm:
  1. INSERT policy'yi düzelt - content_library'den ownership kontrolü yap
  2. SELECT ve UPDATE policy'lerini authenticated kullanıcılar için de aç
*/

-- 1. INSERT policy'yi düzelt (sonsuz döngüyü önle)
DROP POLICY IF EXISTS "Tutors can create shares for own content" ON public_content_shares;

CREATE POLICY "Tutors can create shares for own content"
  ON public_content_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM content_library
      WHERE content_library.id = content_id
      AND content_library.teacher_id = auth.uid()
    )
  );

-- 2. SELECT policy'yi hem anon hem authenticated için güncelle
DROP POLICY IF EXISTS "Tutors can view own shares" ON public_content_shares;
DROP POLICY IF EXISTS "Anyone can read active shares by token" ON public_content_shares;

-- Tutorlar kendi share'lerini görebilir
CREATE POLICY "Tutors can view own shares"
  ON public_content_shares
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
  );

-- Herkes (anon + authenticated) aktif share'leri görebilir
CREATE POLICY "Anyone can read active shares by token"
  ON public_content_shares
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > now())
  );

-- 3. UPDATE policy'yi hem anon hem authenticated için güncelle
DROP POLICY IF EXISTS "Tutors can update own shares" ON public_content_shares;
DROP POLICY IF EXISTS "Anyone can update view count on active shares" ON public_content_shares;

-- Tutorlar kendi share'lerini güncelleyebilir
CREATE POLICY "Tutors can update own shares"
  ON public_content_shares
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Herkes (anon + authenticated) view count'u güncelleyebilir
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

-- 4. DELETE policy'yi koru (sadece tutor silebilir)
DROP POLICY IF EXISTS "Tutors can delete own shares" ON public_content_shares;

CREATE POLICY "Tutors can delete own shares"
  ON public_content_shares
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );
