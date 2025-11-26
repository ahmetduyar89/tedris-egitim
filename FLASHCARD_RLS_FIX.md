# Flashcard RLS Sorunu - Çözüm Kılavuzu

## 🔴 Sorun
Öğretmen flashcard oluşturamıyor. Hata mesajı:
```
new row violates row-level security policy for table "flashcards"
```

## 🔍 Neden?
`flashcards` tablosunda sadece **SELECT** (okuma) policy'si var. **INSERT** (ekleme) policy'si eksik olduğu için öğretmen flashcard oluşturamıyor.

## ✅ Çözüm

### Yöntem 1: Supabase Dashboard'dan SQL Çalıştırma (ÖNERİLEN)

1. **Supabase Dashboard**'a git: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ü açın
4. Aşağıdaki SQL kodunu yapıştırın ve **RUN** butonuna tıklayın:

```sql
/*
  # Fix Flashcards RLS Policies
  
  Problem: Teachers cannot create flashcards because INSERT policy is missing
  
  Solution: Add comprehensive RLS policies for flashcards table
  - Teachers can INSERT, UPDATE, DELETE their own flashcards
  - Students can only SELECT flashcards assigned to them
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can manage own flashcards" ON public.flashcards;

-- Policy 1: Teachers can view their own flashcards
CREATE POLICY "Teachers can view own flashcards"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()));

-- Policy 2: Students can view assigned flashcards
CREATE POLICY "Students can view assigned flashcards"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT flashcard_id 
      FROM public.spaced_repetition_schedule
      WHERE student_id = (SELECT auth.uid())
    )
  );

-- Policy 3: Teachers can insert flashcards
CREATE POLICY "Teachers can insert flashcards"
  ON public.flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = (SELECT auth.uid()));

-- Policy 4: Teachers can update their own flashcards
CREATE POLICY "Teachers can update own flashcards"
  ON public.flashcards
  FOR UPDATE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()))
  WITH CHECK (teacher_id = (SELECT auth.uid()));

-- Policy 5: Teachers can delete their own flashcards
CREATE POLICY "Teachers can delete own flashcards"
  ON public.flashcards
  FOR DELETE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()));
```

### Yöntem 2: Migration Dosyası Kullanma

Migration dosyası zaten oluşturuldu:
- Dosya: `supabase/migrations/20251126182700_fix_flashcards_rls_policies.sql`
- Bu dosyayı Supabase'e push etmeniz gerekiyor

## 📋 Oluşturulan Policy'ler

1. ✅ **Teachers can view own flashcards** - Öğretmen kendi flashcard'larını görebilir
2. ✅ **Students can view assigned flashcards** - Öğrenci atanan flashcard'ları görebilir
3. ✅ **Teachers can insert flashcards** - Öğretmen flashcard oluşturabilir ⭐ (YENİ)
4. ✅ **Teachers can update own flashcards** - Öğretmen kendi flashcard'larını güncelleyebilir ⭐ (YENİ)
5. ✅ **Teachers can delete own flashcards** - Öğretmen kendi flashcard'larını silebilir ⭐ (YENİ)

## 🧪 Test Etme

SQL'i çalıştırdıktan sonra:
1. Öğretmen panelinde öğrenci detay sayfasına git
2. "Flashcard Oluştur" butonuna tıkla
3. AI ile veya manuel olarak flashcard oluştur
4. Artık hata almadan flashcard oluşturabilmelisiniz! ✅

## ⚠️ Önemli Not

Bu SQL'i **mutlaka çalıştırmanız** gerekiyor, aksi takdirde flashcard oluşturma özelliği çalışmayacak.
