-- Migration: Create Parent Portal Tables and Policies
-- Date: 2025-12-15
-- Description: Veli portalı için gerekli tablolar, ilişkiler ve RLS politikaları

-- ============================================================================
-- TABLES
-- ============================================================================

-- Veli tablosu
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Veli-Öğrenci ilişkileri tablosu
CREATE TABLE IF NOT EXISTS public.parent_student_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship_type TEXT CHECK (relationship_type IN ('anne', 'baba', 'vasi')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on parents table
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on parent_student_relations table
ALTER TABLE public.parent_student_relations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PARENTS TABLE
-- ============================================================================

-- Veliler sadece kendi bilgilerini görebilir
DROP POLICY IF EXISTS "Parents can view own data" ON public.parents;
CREATE POLICY "Parents can view own data"
    ON public.parents FOR SELECT
    USING (auth.uid() = id);

-- Veliler kendi bilgilerini güncelleyebilir
DROP POLICY IF EXISTS "Parents can update own data" ON public.parents;
CREATE POLICY "Parents can update own data"
    ON public.parents FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES - PARENT_STUDENT_RELATIONS TABLE
-- ============================================================================

-- Veliler kendi çocuklarını görebilir
DROP POLICY IF EXISTS "Parents can view their students" ON public.parent_student_relations;
CREATE POLICY "Parents can view their students"
    ON public.parent_student_relations FOR SELECT
    USING (auth.uid() = parent_id);

-- ============================================================================
-- RLS POLICIES - PRIVATE_LESSONS TABLE (Özel Ders Notları)
-- ============================================================================

-- Veliler çocuklarının ders notlarını görebilir
DROP POLICY IF EXISTS "Parents can view student lessons" ON public.private_lessons;
CREATE POLICY "Parents can view student lessons"
    ON public.private_lessons FOR SELECT
    USING (
        student_id IN (
            SELECT student_id 
            FROM public.parent_student_relations 
            WHERE parent_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES - STUDENTS TABLE
-- ============================================================================

-- Veliler çocuklarının bilgilerini görebilir
DROP POLICY IF EXISTS "Parents can view their children" ON public.students;
CREATE POLICY "Parents can view their children"
    ON public.students FOR SELECT
    USING (
        id IN (
            SELECT student_id 
            FROM public.parent_student_relations 
            WHERE parent_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES - TESTS TABLE (Test Sonuçları)
-- ============================================================================

-- Veliler çocuklarının test sonuçlarını görebilir
DROP POLICY IF EXISTS "Parents can view student tests" ON public.tests;
CREATE POLICY "Parents can view student tests"
    ON public.tests FOR SELECT
    USING (
        student_id IN (
            SELECT student_id 
            FROM public.parent_student_relations 
            WHERE parent_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES - ASSIGNMENTS TABLE (Ödevler)
-- ============================================================================

-- Veliler çocuklarının ödevlerini görebilir
DROP POLICY IF EXISTS "Parents can view student assignments" ON public.assignments;
CREATE POLICY "Parents can view student assignments"
    ON public.assignments FOR SELECT
    USING (
        student_id IN (
            SELECT student_id 
            FROM public.parent_student_relations 
            WHERE parent_id = auth.uid()
        )
    );

-- ============================================================================
-- INDEXES (Performans Optimizasyonu)
-- ============================================================================

-- Parent-Student Relations için indeksler
CREATE INDEX IF NOT EXISTS idx_parent_student_relations_parent 
    ON public.parent_student_relations(parent_id);

CREATE INDEX IF NOT EXISTS idx_parent_student_relations_student 
    ON public.parent_student_relations(student_id);

-- Parents tablosu için indeksler
CREATE INDEX IF NOT EXISTS idx_parents_email 
    ON public.parents(email);

-- ============================================================================
-- COMMENTS (Dokümantasyon)
-- ============================================================================

COMMENT ON TABLE public.parents IS 'Veli bilgileri tablosu';
COMMENT ON TABLE public.parent_student_relations IS 'Veli-Öğrenci ilişkileri tablosu';

COMMENT ON COLUMN public.parents.name IS 'Veli adı soyadı';
COMMENT ON COLUMN public.parents.email IS 'Veli e-posta adresi (opsiyonel)';
COMMENT ON COLUMN public.parents.phone IS 'Veli telefon numarası';
COMMENT ON COLUMN public.parents.password_hash IS 'Şifrelenmiş veli şifresi';

COMMENT ON COLUMN public.parent_student_relations.relationship_type IS 'İlişki tipi: anne, baba veya vasi';
