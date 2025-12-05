-- BU KODU SUPABASE SQL EDITOR'ÜNDE ÇALIŞTIRIN --
-- Bu kod, "tests" tablosundaki silme yetkilerini düzeltir ve öğretmenin öğrencisine ait testleri silebilmesini sağlar.

-- 1. Mevcut kısıtlı politikayı sil
DROP POLICY IF EXISTS "Tutors can delete tests" ON public.tests;
DROP POLICY IF EXISTS "Teachers can delete their own tests" ON public.tests;

-- 2. Yeni, kapsayıcı silme politikası oluştur
-- Bu politika, silinmek istenen testin sahibi olan öğrencinin "tutor_id"si
-- şu anki kullanıcı (auth.uid()) ise silme işlemine izin verir.
CREATE POLICY "Tutors can delete tests"
ON public.tests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = tests.student_id
    AND students.tutor_id = auth.uid()
  )
);

-- 3. Diğer işlemler (UPDATE/SELECT) için de benzer izinleri garantile
DROP POLICY IF EXISTS "Tutors can update tests" ON public.tests;
CREATE POLICY "Tutors can update tests"
ON public.tests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = tests.student_id
    AND students.tutor_id = auth.uid()
  )
);
