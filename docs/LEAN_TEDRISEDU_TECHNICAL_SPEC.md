# Lean TedrisEDU - Teknik Spesifikasyon Dokümanı

> **Versiyon:** 1.0
> **Tarih:** 2026-02-05
> **Durum:** Draft

---

## İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Sistem Mimarisi](#2-sistem-mimarisi)
3. [Veritabanı Tasarımı](#3-veritabanı-tasarımı)
4. [API Tasarımı](#4-api-tasarımı)
5. [Frontend Mimarisi](#5-frontend-mimarisi)
6. [State Management](#6-state-management)
7. [AI Entegrasyonu](#7-ai-entegrasyonu)
8. [Güvenlik](#8-güvenlik)
9. [Test Stratejisi](#9-test-stratejisi)
10. [Deployment](#10-deployment)
11. [Geliştirme Kılavuzu](#11-geliştirme-kılavuzu)

---

## 1. Proje Genel Bakış

### 1.1 Vizyon

Lean TedrisEDU, özel ders öğretmenlerinin öğrenci takibi ve AI destekli test oluşturma ihtiyaçlarını karşılayan **minimal, hızlı ve kullanılabilir** bir platformdur.

### 1.2 Temel İlkeler

| İlke | Açıklama |
|------|----------|
| **Simplicity First** | Her özellik mümkün olan en basit şekilde |
| **User-Centric** | Kullanıcı geri bildirimine dayalı geliştirme |
| **Performance** | 3 saniyede yüklenen, anlık tepki veren UI |
| **Maintainability** | Okunabilir, test edilebilir, belgelenmiş kod |

### 1.3 MVP Kapsamı (v1.0)

```
┌─────────────────────────────────────────────────────────────────┐
│                      MVP ÖZELLİKLERİ                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ DAHİL                          ❌ HARİÇ                     │
│  ─────────────────                 ─────────────────            │
│  • Kullanıcı girişi                • Flashcard                  │
│  • Öğrenci CRUD                    • Spaced repetition          │
│  • AI test oluşturma               • Kitap okuma                │
│  • Test çözme                      • Kompozisyon                │
│  • Otomatik değerlendirme          • Online ders                │
│  • İlerleme dashboard              • Özel ders takvimi          │
│  • Basit bildirimler               • Ödeme sistemi              │
│  • Temel raporlama                 • WhatsApp                   │
│                                    • Veli portalı               │
│                                    • Gamification               │
│                                    • Knowledge graph            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Kullanıcı Rolleri

| Rol | Yetkiler | v1.0 |
|-----|----------|------|
| **Tutor** | Öğrenci yönetimi, test oluşturma, analiz | ✅ |
| **Student** | Test çözme, ilerleme görüntüleme | ✅ |
| **Admin** | Sistem yönetimi | ❌ v2.0 |
| **Parent** | Çocuk takibi | ❌ v2.0 |

---

## 2. Sistem Mimarisi

### 2.1 Yüksek Seviye Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React SPA (Vite)                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │  Auth   │  │ Student │  │  Test   │  │Progress │      │  │
│  │  │ Feature │  │ Feature │  │ Feature │  │ Feature │      │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │  │
│  │                      │                                    │  │
│  │              ┌───────┴───────┐                           │  │
│  │              │ Zustand Store │                           │  │
│  │              └───────┬───────┘                           │  │
│  │                      │                                    │  │
│  │              ┌───────┴───────┐                           │  │
│  │              │  React Query  │                           │  │
│  │              └───────────────┘                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      SUPABASE                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │    Auth     │  │  Database   │  │   Storage   │       │  │
│  │  │   (JWT)     │  │ (PostgreSQL)│  │   (Files)   │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐                        │  │
│  │  │  Realtime   │  │    Edge     │                        │  │
│  │  │ (WebSocket) │  │  Functions  │                        │  │
│  │  └─────────────┘  └─────────────┘                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Call
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Google Gemini 2.0 Flash API                │    │
│  │              (Test Generation & Analysis)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Teknoloji Stack

| Katman | Teknoloji | Versiyon | Neden |
|--------|-----------|----------|-------|
| **Frontend** | React | 19.x | Modern, yaygın, performanslı |
| **Language** | TypeScript | 5.x | Tip güvenliği |
| **Build** | Vite | 6.x | Hızlı dev, optimized build |
| **Styling** | Tailwind CSS | 3.x | Utility-first, hızlı geliştirme |
| **State** | Zustand | 4.x | Basit, küçük, TypeScript uyumlu |
| **Data Fetching** | TanStack Query | 5.x | Cache, refetch, optimistic |
| **Backend** | Supabase | - | Auth, DB, Storage, Functions |
| **Database** | PostgreSQL | 15.x | Güvenilir, RLS desteği |
| **AI** | Gemini 2.0 Flash | - | Hızlı, ucuz, Türkçe desteği |
| **Hosting** | Vercel | - | Kolay deploy, preview |

### 2.3 Klasör Yapısı

```
lean-tedrisedu/
├── public/
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Root component
│   │   ├── Router.tsx              # Route definitions
│   │   └── Providers.tsx           # Context providers
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── stores/
│   │   │   │   └── authStore.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts            # Public exports
│   │   │
│   │   ├── students/
│   │   │   ├── components/
│   │   │   │   ├── StudentList.tsx
│   │   │   │   ├── StudentCard.tsx
│   │   │   │   ├── StudentForm.tsx
│   │   │   │   └── StudentDetail.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useStudents.ts
│   │   │   │   └── useStudent.ts
│   │   │   ├── services/
│   │   │   │   └── studentService.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── tests/
│   │   │   ├── components/
│   │   │   │   ├── TestCreator/
│   │   │   │   │   ├── TopicSelector.tsx
│   │   │   │   │   ├── DifficultySelector.tsx
│   │   │   │   │   ├── QuestionPreview.tsx
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── TestTaking/
│   │   │   │   │   ├── QuestionDisplay.tsx
│   │   │   │   │   ├── AnswerInput.tsx
│   │   │   │   │   ├── Timer.tsx
│   │   │   │   │   └── index.tsx
│   │   │   │   └── TestResults/
│   │   │   │       ├── ScoreSummary.tsx
│   │   │   │       ├── AnswerReview.tsx
│   │   │   │       └── index.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTests.ts
│   │   │   │   ├── useTestCreation.ts
│   │   │   │   └── useTestSubmission.ts
│   │   │   ├── services/
│   │   │   │   ├── testService.ts
│   │   │   │   └── aiService.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── progress/
│   │       ├── components/
│   │       │   ├── ProgressDashboard.tsx
│   │       │   ├── ProgressChart.tsx
│   │       │   ├── TopicMastery.tsx
│   │       │   └── RecentTests.tsx
│   │       ├── hooks/
│   │       │   └── useProgress.ts
│   │       ├── services/
│   │       │   └── progressService.ts
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── PageLayout.tsx
│   │   │   └── feedback/
│   │   │       ├── ErrorMessage.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── LoadingSkeleton.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useMediaQuery.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts               # classnames helper
│   │   │   ├── format.ts           # date, number formatters
│   │   │   ├── validation.ts       # form validation
│   │   │   └── constants.ts        # app constants
│   │   │
│   │   └── types/
│   │       └── common.ts           # shared types
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── queryClient.ts          # React Query config
│   │   └── gemini.ts               # AI client (edge only)
│   │
│   ├── styles/
│   │   └── globals.css             # Tailwind imports
│   │
│   └── index.tsx                   # Entry point
│
├── supabase/
│   ├── functions/
│   │   └── ai-generate/
│   │       └── index.ts
│   │
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   │
│   └── seed.sql                    # Test data
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   └── ...
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 3. Veritabanı Tasarımı

### 3.1 ER Diyagramı

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │    students     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │
│ email           │  │    │ tutor_id (FK)   │──┐
│ role            │  │    │ name            │  │
│ full_name       │  │    │ grade           │  │
│ avatar_url      │  │    │ subjects        │  │
│ created_at      │  └───▶│ status          │  │
│ updated_at      │       │ notes           │  │
└─────────────────┘       │ created_at      │  │
                          │ updated_at      │  │
                          └─────────────────┘  │
                                   │           │
                                   │           │
                          ┌────────┘           │
                          │                    │
                          ▼                    │
┌─────────────────┐       ┌─────────────────┐  │
│     topics      │       │     tests       │  │
├─────────────────┤       ├─────────────────┤  │
│ id (PK)         │       │ id (PK)         │  │
│ subject         │◀──────│ topic_id (FK)   │  │
│ grade           │       │ student_id (FK) │◀─┘
│ name            │       │ tutor_id (FK)   │
│ description     │       │ title           │
│ order_index     │       │ difficulty      │
│ parent_id (FK)  │──┐    │ questions       │
└─────────────────┘  │    │ status          │
         ▲           │    │ created_at      │
         └───────────┘    └─────────────────┘
                                   │
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  test_results   │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ test_id (FK)    │
                          │ student_id (FK) │
                          │ score           │
                          │ max_score       │
                          │ answers         │
                          │ time_spent      │
                          │ completed_at    │
                          └─────────────────┘
                                   │
                                   │
                                   ▼
                          ┌─────────────────┐
                          │    progress     │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ student_id (FK) │
                          │ topic_id (FK)   │
                          │ mastery_level   │
                          │ tests_taken     │
                          │ avg_score       │
                          │ last_test_at    │
                          │ updated_at      │
                          └─────────────────┘
```

### 3.2 Tablo Şemaları

```sql
-- ============================================
-- 1. USERS (Supabase Auth ile entegre)
-- ============================================
-- Not: Supabase auth.users tablosunu kullanır
-- Bu tablo sadece ek profil bilgileri için

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('tutor', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. STUDENTS (Öğrenciler)
-- ============================================

CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Temel bilgiler
    name TEXT NOT NULL,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
    subjects TEXT[] NOT NULL DEFAULT '{}',

    -- Durum
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

    -- Ek bilgiler
    notes TEXT,
    parent_phone TEXT,
    parent_email TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    CONSTRAINT unique_student_per_tutor UNIQUE (tutor_id, name, grade)
);

CREATE INDEX idx_students_tutor ON public.students(tutor_id);
CREATE INDEX idx_students_status ON public.students(status);

-- ============================================
-- 3. TOPICS (Müfredat Konuları)
-- ============================================

CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Konu bilgileri
    subject TEXT NOT NULL CHECK (subject IN ('matematik', 'turkce', 'fen', 'sosyal', 'ingilizce')),
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
    name TEXT NOT NULL,
    description TEXT,

    -- Hiyerarşi
    parent_id UUID REFERENCES public.topics(id),
    order_index INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_topic UNIQUE (subject, grade, name)
);

CREATE INDEX idx_topics_subject_grade ON public.topics(subject, grade);

-- ============================================
-- 4. TESTS (Testler)
-- ============================================

CREATE TABLE public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- İlişkiler
    tutor_id UUID NOT NULL REFERENCES public.profiles(id),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id),

    -- Test bilgileri
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    question_count INTEGER NOT NULL CHECK (question_count BETWEEN 1 AND 50),

    -- Sorular (JSONB)
    questions JSONB NOT NULL DEFAULT '[]',
    /*
    questions yapısı:
    [
        {
            "id": "uuid",
            "type": "multiple_choice" | "open_ended",
            "question": "Soru metni",
            "options": ["A", "B", "C", "D"],  // sadece multiple_choice için
            "correct_answer": "A" | "açık uçlu cevap",
            "explanation": "Açıklama",
            "points": 10
        }
    ]
    */

    -- Durum
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('draft', 'assigned', 'in_progress', 'completed', 'expired')),

    -- Zaman
    due_date TIMESTAMPTZ,
    time_limit_minutes INTEGER,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tests_tutor ON public.tests(tutor_id);
CREATE INDEX idx_tests_student ON public.tests(student_id);
CREATE INDEX idx_tests_status ON public.tests(status);

-- ============================================
-- 5. TEST_RESULTS (Test Sonuçları)
-- ============================================

CREATE TABLE public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- İlişkiler
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,

    -- Sonuçlar
    score INTEGER NOT NULL CHECK (score >= 0),
    max_score INTEGER NOT NULL CHECK (max_score > 0),
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score) * 100, 2)) STORED,

    -- Cevaplar (JSONB)
    answers JSONB NOT NULL DEFAULT '[]',
    /*
    answers yapısı:
    [
        {
            "question_id": "uuid",
            "answer": "A" | "açık uçlu cevap",
            "is_correct": true | false,
            "points_earned": 10,
            "time_spent_seconds": 45
        }
    ]
    */

    -- Zaman
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    time_spent_seconds INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
    ) STORED,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_result_per_test UNIQUE (test_id, student_id)
);

CREATE INDEX idx_results_student ON public.test_results(student_id);
CREATE INDEX idx_results_test ON public.test_results(test_id);

-- ============================================
-- 6. PROGRESS (İlerleme Takibi)
-- ============================================

CREATE TABLE public.progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- İlişkiler
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id),

    -- İstatistikler
    mastery_level TEXT NOT NULL DEFAULT 'not_started' CHECK (
        mastery_level IN ('not_started', 'beginner', 'intermediate', 'advanced', 'mastered')
    ),
    tests_taken INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER NOT NULL DEFAULT 0,
    avg_score DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN max_possible_score > 0
        THEN ROUND((total_score::DECIMAL / max_possible_score) * 100, 2)
        ELSE 0 END
    ) STORED,

    -- Zaman
    last_test_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_progress UNIQUE (student_id, topic_id)
);

CREATE INDEX idx_progress_student ON public.progress(student_id);

-- ============================================
-- 7. NOTIFICATIONS (Bildirimler)
-- ============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Alıcı
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- İçerik
    type TEXT NOT NULL CHECK (type IN ('test_assigned', 'test_completed', 'test_graded', 'reminder', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Referans
    reference_type TEXT,  -- 'test', 'student', etc.
    reference_id UUID,

    -- Durum
    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tests_updated_at
    BEFORE UPDATE ON public.tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON public.progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Test tamamlandığında progress güncelleme
CREATE OR REPLACE FUNCTION update_progress_on_result()
RETURNS TRIGGER AS $$
DECLARE
    v_topic_id UUID;
BEGIN
    -- Test'in topic_id'sini al
    SELECT topic_id INTO v_topic_id FROM public.tests WHERE id = NEW.test_id;

    -- Progress tablosunu upsert et
    INSERT INTO public.progress (student_id, topic_id, tests_taken, total_score, max_possible_score, last_test_at)
    VALUES (NEW.student_id, v_topic_id, 1, NEW.score, NEW.max_score, NEW.completed_at)
    ON CONFLICT (student_id, topic_id) DO UPDATE SET
        tests_taken = public.progress.tests_taken + 1,
        total_score = public.progress.total_score + NEW.score,
        max_possible_score = public.progress.max_possible_score + NEW.max_score,
        last_test_at = NEW.completed_at;

    -- Mastery level güncelle
    UPDATE public.progress
    SET mastery_level = CASE
        WHEN avg_score >= 90 THEN 'mastered'
        WHEN avg_score >= 75 THEN 'advanced'
        WHEN avg_score >= 50 THEN 'intermediate'
        WHEN avg_score >= 25 THEN 'beginner'
        ELSE 'not_started'
    END
    WHERE student_id = NEW.student_id AND topic_id = v_topic_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress
    AFTER INSERT ON public.test_results
    FOR EACH ROW EXECUTE FUNCTION update_progress_on_result();
```

### 3.3 Row Level Security (RLS)

```sql
-- ============================================
-- RLS POLİTİKALARI
-- ============================================

-- Tüm tablolarda RLS aktif et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================

-- Herkes kendi profilini görebilir
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Herkes kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- STUDENTS
-- ============================================

-- Öğretmenler sadece kendi öğrencilerini görebilir
CREATE POLICY "Tutors can view own students"
    ON public.students FOR SELECT
    USING (tutor_id = auth.uid());

-- Öğretmenler kendi öğrencilerini ekleyebilir
CREATE POLICY "Tutors can insert own students"
    ON public.students FOR INSERT
    WITH CHECK (tutor_id = auth.uid());

-- Öğretmenler kendi öğrencilerini güncelleyebilir
CREATE POLICY "Tutors can update own students"
    ON public.students FOR UPDATE
    USING (tutor_id = auth.uid());

-- Öğretmenler kendi öğrencilerini silebilir
CREATE POLICY "Tutors can delete own students"
    ON public.students FOR DELETE
    USING (tutor_id = auth.uid());

-- ============================================
-- TOPICS
-- ============================================

-- Herkes konuları görebilir (public data)
CREATE POLICY "Anyone can view topics"
    ON public.topics FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- TESTS
-- ============================================

-- Öğretmenler kendi testlerini görebilir
CREATE POLICY "Tutors can view own tests"
    ON public.tests FOR SELECT
    USING (tutor_id = auth.uid());

-- Öğrenciler kendilerine atanan testleri görebilir
CREATE POLICY "Students can view assigned tests"
    ON public.tests FOR SELECT
    USING (
        student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE p.role = 'student'
        )
    );

-- Öğretmenler test oluşturabilir
CREATE POLICY "Tutors can create tests"
    ON public.tests FOR INSERT
    WITH CHECK (tutor_id = auth.uid());

-- Öğretmenler kendi testlerini güncelleyebilir
CREATE POLICY "Tutors can update own tests"
    ON public.tests FOR UPDATE
    USING (tutor_id = auth.uid());

-- ============================================
-- TEST_RESULTS
-- ============================================

-- Öğretmenler kendi öğrencilerinin sonuçlarını görebilir
CREATE POLICY "Tutors can view student results"
    ON public.test_results FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

-- Öğrenciler kendi sonuçlarını görebilir
CREATE POLICY "Students can view own results"
    ON public.test_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'student'
        )
    );

-- Test sonucu ekleme (authenticated users)
CREATE POLICY "Can insert test results"
    ON public.test_results FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- PROGRESS
-- ============================================

-- Öğretmenler kendi öğrencilerinin ilerlemesini görebilir
CREATE POLICY "Tutors can view student progress"
    ON public.progress FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

-- ============================================
-- NOTIFICATIONS
-- ============================================

-- Kullanıcılar kendi bildirimlerini görebilir
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

-- Kullanıcılar kendi bildirimlerini güncelleyebilir (okundu işareti)
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());
```

---

## 4. API Tasarımı

### 4.1 Supabase Client API

```typescript
// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.sessionStorage, // localStorage yerine sessionStorage
    flowType: 'pkce',
  },
});
```

### 4.2 Service Layer Pattern

```typescript
// features/students/services/studentService.ts

import { supabase } from '@/lib/supabase';
import type { Student, CreateStudentDTO, UpdateStudentDTO } from '../types';

export const studentService = {
  /**
   * Tüm öğrencileri getir
   */
  async getAll(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Tek öğrenci getir
   */
  async getById(id: string): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Öğrenci oluştur
   */
  async create(dto: CreateStudentDTO): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert(dto)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Öğrenci güncelle
   */
  async update(id: string, dto: UpdateStudentDTO): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Öğrenci sil (soft delete - status: archived)
   */
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  /**
   * Öğrenci ara
   */
  async search(query: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');

    if (error) throw new Error(error.message);
    return data;
  },
};
```

### 4.3 Edge Functions

```typescript
// supabase/functions/ai-generate/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateTestRequest {
  action: 'generate_test';
  topic: string;
  grade: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  questionTypes: ('multiple_choice' | 'open_ended')[];
}

interface AnalyzeTestRequest {
  action: 'analyze_test';
  questions: Question[];
  answers: Answer[];
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const body = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'generate_test':
        result = await generateTest(model, body as GenerateTestRequest);
        break;
      case 'analyze_test':
        result = await analyzeTest(model, body as AnalyzeTestRequest);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateTest(model: any, request: GenerateTestRequest) {
  const { topic, grade, difficulty, questionCount, questionTypes } = request;

  const prompt = `
Sen bir ${grade}. sınıf "${topic}" konusu için test hazırlayan bir eğitimcisin.

Lütfen aşağıdaki kriterlere uygun ${questionCount} adet soru oluştur:
- Zorluk seviyesi: ${difficulty === 'mixed' ? 'karışık (kolay, orta, zor)' : difficulty}
- Soru tipleri: ${questionTypes.join(', ')}
- Dil: Türkçe
- MEB müfredatına uygun

Her soru için şu JSON formatını kullan:
{
  "questions": [
    {
      "id": "benzersiz-uuid",
      "type": "multiple_choice" veya "open_ended",
      "question": "Soru metni",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],  // sadece multiple_choice için
      "correct_answer": "A" veya "tam cevap metni",
      "explanation": "Cevabın açıklaması",
      "points": 10,
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Sadece JSON döndür, başka açıklama ekleme.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // JSON parse
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }

  return JSON.parse(jsonMatch[0]);
}

async function analyzeTest(model: any, request: AnalyzeTestRequest) {
  const { questions, answers } = request;

  const prompt = `
Aşağıdaki test sonuçlarını analiz et ve öğrenci için geri bildirim hazırla.

SORULAR VE CEVAPLAR:
${questions.map((q, i) => `
Soru ${i + 1}: ${q.question}
Doğru Cevap: ${q.correct_answer}
Öğrenci Cevabı: ${answers[i]?.answer || 'Boş'}
Sonuç: ${answers[i]?.is_correct ? 'Doğru' : 'Yanlış'}
`).join('\n')}

Lütfen şu JSON formatında analiz döndür:
{
  "summary": "Genel değerlendirme (2-3 cümle)",
  "strengths": ["Güçlü yanlar listesi"],
  "weaknesses": ["Geliştirilmesi gereken alanlar"],
  "recommendations": ["Öneriler listesi"],
  "detailed_feedback": [
    {
      "question_id": "soru-id",
      "feedback": "Bu soru için özel geri bildirim"
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }

  return JSON.parse(jsonMatch[0]);
}
```

---

## 5. Frontend Mimarisi

### 5.1 App Entry Point

```tsx
// src/app/App.tsx

import { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Router } from './Router';
import { Toaster } from '@/shared/components/ui/Toast';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingScreen />}>
        <Router />
        <Toaster />
      </Suspense>
    </QueryClientProvider>
  );
}
```

### 5.2 Router

```tsx
// src/app/Router.tsx

import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { PageLayout } from '@/shared/components/layout/PageLayout';

// Lazy loaded pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/progress/pages/DashboardPage'));
const StudentsPage = lazy(() => import('@/features/students/pages/StudentsPage'));
const StudentDetailPage = lazy(() => import('@/features/students/pages/StudentDetailPage'));
const TestCreatePage = lazy(() => import('@/features/tests/pages/TestCreatePage'));
const TestTakePage = lazy(() => import('@/features/tests/pages/TestTakePage'));
const TestResultPage = lazy(() => import('@/features/tests/pages/TestResultPage'));

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PageLayout />}>
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Students */}
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />

            {/* Tests */}
            <Route path="/tests/create" element={<TestCreatePage />} />
            <Route path="/tests/:id" element={<TestTakePage />} />
            <Route path="/tests/:id/result" element={<TestResultPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 5.3 Shared UI Components

```tsx
// src/shared/components/ui/Button.tsx

import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner className="mr-2 h-4 w-4" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

```tsx
// src/shared/components/ui/Card.tsx

import { cn } from '@/shared/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-white',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
  };

  return (
    <div
      className={cn('rounded-xl p-6', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}
```

```tsx
// src/shared/components/ui/Modal.tsx

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
}: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all',
                  sizes[size]
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    {title && (
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-gray-500">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 5.4 Feature Component Example

```tsx
// src/features/students/components/StudentList.tsx

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { StudentCard } from './StudentCard';
import { StudentForm } from './StudentForm';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';

export function StudentList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: students, isLoading, error } = useStudents();

  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSkeleton count={6} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Hata oluştu"
        description="Öğrenciler yüklenirken bir hata oluştu."
        action={
          <Button onClick={() => window.location.reload()}>
            Yeniden Dene
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Öğrenciler</h1>
          <p className="mt-1 text-sm text-gray-500">
            {students?.length || 0} öğrenci kayıtlı
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Yeni Öğrenci
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          placeholder="Öğrenci ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filteredStudents?.length === 0 ? (
        <EmptyState
          title="Öğrenci bulunamadı"
          description={
            searchQuery
              ? 'Arama kriterlerinize uygun öğrenci bulunamadı.'
              : 'Henüz öğrenci eklememişsiniz.'
          }
          action={
            !searchQuery && (
              <Button onClick={() => setIsFormOpen(true)}>
                İlk Öğrenciyi Ekle
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents?.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Yeni Öğrenci Ekle"
        size="lg"
      >
        <StudentForm onSuccess={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  );
}
```

---

## 6. State Management

### 6.1 Zustand Store

```typescript
// src/features/auth/stores/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setProfile: (profile) =>
        set({ profile }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      logout: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Sadece gerekli alanları persist et
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 6.2 React Query Hooks

```typescript
// src/features/students/hooks/useStudents.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/studentService';
import type { CreateStudentDTO, UpdateStudentDTO } from '../types';
import { toast } from '@/shared/components/ui/Toast';

// Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: string) => [...studentKeys.lists(), { filters }] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

// Hooks
export function useStudents() {
  return useQuery({
    queryKey: studentKeys.lists(),
    queryFn: () => studentService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateStudentDTO) => studentService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success('Öğrenci başarıyla eklendi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStudentDTO }) =>
      studentService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.setQueryData(studentKeys.detail(data.id), data);
      toast.success('Öğrenci güncellendi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });
}

export function useArchiveStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success('Öğrenci arşivlendi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });
}
```

---

## 7. AI Entegrasyonu

### 7.1 AI Service (Frontend)

```typescript
// src/features/tests/services/aiService.ts

import { supabase } from '@/lib/supabase';
import type { Question, GenerateTestParams, AnalyzeTestParams, AIAnalysis } from '../types';

const AI_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`;

export const aiService = {
  /**
   * AI ile test soruları oluştur
   */
  async generateQuestions(params: GenerateTestParams): Promise<Question[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(AI_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'generate_test',
        ...params,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'AI request failed');
    }

    const data = await response.json();
    return data.questions;
  },

  /**
   * Test sonuçlarını analiz et
   */
  async analyzeTest(params: AnalyzeTestParams): Promise<AIAnalysis> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(AI_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'analyze_test',
        ...params,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'AI analysis failed');
    }

    return response.json();
  },
};
```

### 7.2 Test Creation Hook

```typescript
// src/features/tests/hooks/useTestCreation.ts

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import { testService } from '../services/testService';
import type { Question, CreateTestDTO } from '../types';
import { toast } from '@/shared/components/ui/Toast';

interface TestCreationState {
  step: 'config' | 'preview' | 'saving';
  questions: Question[];
}

export function useTestCreation() {
  const [state, setState] = useState<TestCreationState>({
    step: 'config',
    questions: [],
  });

  const generateMutation = useMutation({
    mutationFn: aiService.generateQuestions,
    onSuccess: (questions) => {
      setState({ step: 'preview', questions });
      toast.success('Sorular oluşturuldu');
    },
    onError: (error: Error) => {
      toast.error(`Soru oluşturma hatası: ${error.message}`);
    },
  });

  const saveMutation = useMutation({
    mutationFn: testService.create,
    onSuccess: () => {
      toast.success('Test başarıyla kaydedildi');
    },
    onError: (error: Error) => {
      toast.error(`Kaydetme hatası: ${error.message}`);
    },
  });

  const generateQuestions = async (params: Parameters<typeof aiService.generateQuestions>[0]) => {
    await generateMutation.mutateAsync(params);
  };

  const updateQuestion = (index: number, question: Question) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? question : q)),
    }));
  };

  const removeQuestion = (index: number) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const saveTest = async (dto: Omit<CreateTestDTO, 'questions'>) => {
    setState((prev) => ({ ...prev, step: 'saving' }));
    await saveMutation.mutateAsync({
      ...dto,
      questions: state.questions,
    });
  };

  const reset = () => {
    setState({ step: 'config', questions: [] });
  };

  return {
    step: state.step,
    questions: state.questions,
    isGenerating: generateMutation.isPending,
    isSaving: saveMutation.isPending,
    generateQuestions,
    updateQuestion,
    removeQuestion,
    saveTest,
    reset,
  };
}
```

---

## 8. Güvenlik

### 8.1 Authentication Flow

```typescript
// src/features/auth/services/authService.ts

import { supabase } from '@/lib/supabase';
import type { LoginCredentials, SignupCredentials } from '../types';

export const authService = {
  /**
   * Email/password ile giriş
   */
  async login({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Yeni kullanıcı kaydı
   */
  async signup({ email, password, fullName, role }: SignupCredentials) {
    // 1. Auth user oluştur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // 2. Profile oluştur
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      });

      if (profileError) throw profileError;
    }

    return authData;
  },

  /**
   * Çıkış
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Mevcut oturumu kontrol et
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Profil bilgilerini getir
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },
};
```

### 8.2 Protected Route

```tsx
// src/features/auth/components/ProtectedRoute.tsx

import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authService.getSession();

        if (session?.user) {
          setUser(session.user);
          const profile = await authService.getProfile(session.user.id);
          setProfile(profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

### 8.3 Input Sanitization

```typescript
// src/shared/utils/sanitize.ts

import DOMPurify from 'dompurify';

/**
 * HTML içeriği temizle
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Kullanıcı girdisini temizle (XSS önleme)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * AI prompt injection önleme
 */
export function sanitizePrompt(input: string): string {
  // Tehlikeli pattern'leri kaldır
  const dangerousPatterns = [
    /ignore (previous|all|above) instructions/gi,
    /disregard (previous|all|above)/gi,
    /forget (everything|all)/gi,
    /you are now/gi,
    /act as/gi,
    /pretend to be/gi,
    /system:/gi,
    /assistant:/gi,
    /user:/gi,
  ];

  let sanitized = input;
  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
}
```

---

## 9. Test Stratejisi

### 9.1 Unit Tests

```typescript
// tests/unit/services/studentService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentService } from '@/features/students/services/studentService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('studentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all students', async () => {
      const mockStudents = [
        { id: '1', name: 'Ali', grade: 5 },
        { id: '2', name: 'Ayşe', grade: 6 },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockStudents, error: null }),
        }),
      } as any);

      const result = await studentService.getAll();

      expect(result).toEqual(mockStudents);
      expect(supabase.from).toHaveBeenCalledWith('students');
    });

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
        }),
      } as any);

      await expect(studentService.getAll()).rejects.toThrow('DB Error');
    });
  });

  describe('create', () => {
    it('should create a student', async () => {
      const newStudent = { name: 'Mehmet', grade: 7, subjects: ['matematik'] };
      const createdStudent = { id: '3', ...newStudent };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdStudent, error: null }),
          }),
        }),
      } as any);

      const result = await studentService.create(newStudent);

      expect(result).toEqual(createdStudent);
    });
  });
});
```

### 9.2 Component Tests

```typescript
// tests/unit/components/StudentCard.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentCard } from '@/features/students/components/StudentCard';
import { BrowserRouter } from 'react-router-dom';

const mockStudent = {
  id: '1',
  name: 'Ali Yılmaz',
  grade: 5,
  subjects: ['matematik', 'turkce'],
  status: 'active' as const,
  created_at: '2024-01-01',
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('StudentCard', () => {
  it('renders student name', () => {
    renderWithRouter(<StudentCard student={mockStudent} />);
    expect(screen.getByText('Ali Yılmaz')).toBeInTheDocument();
  });

  it('renders grade', () => {
    renderWithRouter(<StudentCard student={mockStudent} />);
    expect(screen.getByText('5. Sınıf')).toBeInTheDocument();
  });

  it('renders subjects', () => {
    renderWithRouter(<StudentCard student={mockStudent} />);
    expect(screen.getByText('matematik')).toBeInTheDocument();
    expect(screen.getByText('turkce')).toBeInTheDocument();
  });

  it('navigates to detail on click', () => {
    renderWithRouter(<StudentCard student={mockStudent} />);
    const card = screen.getByRole('link');
    expect(card).toHaveAttribute('href', '/students/1');
  });
});
```

### 9.3 E2E Tests

```typescript
// tests/e2e/student-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new student', async ({ page }) => {
    await page.goto('/students');

    // Open form
    await page.click('text=Yeni Öğrenci');

    // Fill form
    await page.fill('[name="name"]', 'Test Öğrenci');
    await page.selectOption('[name="grade"]', '5');
    await page.click('text=Matematik');

    // Submit
    await page.click('button[type="submit"]');

    // Verify
    await expect(page.locator('text=Test Öğrenci')).toBeVisible();
  });

  test('should search students', async ({ page }) => {
    await page.goto('/students');

    await page.fill('[placeholder="Öğrenci ara..."]', 'Ali');

    // Wait for search results
    await page.waitForTimeout(500);

    // Verify filtered results
    const cards = page.locator('[data-testid="student-card"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Ali');
    }
  });
});
```

---

## 10. Deployment

### 10.1 Environment Variables

```bash
# .env.example

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App
VITE_APP_URL=https://your-domain.com

# Edge Functions (Supabase Dashboard'dan ayarla)
# GEMINI_API_KEY=your-gemini-key
# ALLOWED_ORIGIN=https://your-domain.com
```

### 10.2 Vercel Configuration

```json
// vercel.json

{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### 10.3 GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml

name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test:unit

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 11. Geliştirme Kılavuzu

### 11.1 Başlangıç

```bash
# 1. Repo'yu klonla
git clone https://github.com/your-org/lean-tedrisedu.git
cd lean-tedrisedu

# 2. Bağımlılıkları yükle
npm install

# 3. Environment variables
cp .env.example .env
# .env dosyasını düzenle

# 4. Supabase CLI kur (opsiyonel, local dev için)
npm install -g supabase
supabase start

# 5. Development server
npm run dev
```

### 11.2 Kod Standartları

```typescript
// 1. Dosya isimlendirme
// - Components: PascalCase (StudentCard.tsx)
// - Hooks: camelCase with use prefix (useStudents.ts)
// - Services: camelCase with Service suffix (studentService.ts)
// - Types: PascalCase (types.ts içinde)

// 2. Component yapısı
// features/students/components/StudentCard.tsx

import { memo } from 'react';                    // React imports
import { Link } from 'react-router-dom';         // External imports
import { cn } from '@/shared/utils/cn';          // Internal imports
import type { Student } from '../types';         // Type imports

interface StudentCardProps {                      // Props interface
  student: Student;
  className?: string;
}

export const StudentCard = memo(function StudentCard({  // Named export, memo
  student,
  className,
}: StudentCardProps) {
  // Hooks first
  // Then handlers
  // Then render

  return (
    <div className={cn('...', className)}>
      {/* JSX */}
    </div>
  );
});

// 3. Hook yapısı
// features/students/hooks/useStudents.ts

export function useStudents(options?: UseStudentsOptions) {
  // Return type açıkça belirtilmeli
  return useQuery({...});
}

// 4. Service yapısı
// features/students/services/studentService.ts

export const studentService = {
  async getAll(): Promise<Student[]> {
    // Implementation
  },
};
```

### 11.3 Git Workflow

```bash
# Feature branch
git checkout -b feature/add-student-search

# Conventional commits
git commit -m "feat(students): add search functionality"
git commit -m "fix(tests): correct score calculation"
git commit -m "docs: update API documentation"

# Pull request
gh pr create --title "feat(students): add search functionality" --body "..."
```

### 11.4 Checklist

Yeni özellik eklerken:

- [ ] Types tanımlandı mı?
- [ ] Service fonksiyonları yazıldı mı?
- [ ] React Query hook'ları oluşturuldu mu?
- [ ] Component'lar yazıldı mı?
- [ ] Unit testler yazıldı mı?
- [ ] Loading/error state'leri handle edildi mi?
- [ ] TypeScript hataları yok mu?
- [ ] ESLint hataları yok mu?
- [ ] Responsive tasarım kontrol edildi mi?

---

## Sonraki Adımlar

1. **Faz 0 (Şimdi)**: Bu dokümanı incele, eksikleri belirle
2. **Faz 1 (Hafta 1)**: Proje setup, auth implementasyonu
3. **Faz 2 (Hafta 2)**: Student CRUD
4. **Faz 3 (Hafta 3)**: AI test oluşturma
5. **Faz 4 (Hafta 4)**: Test çözme ve sonuçlar
6. **Faz 5 (Hafta 5)**: Dashboard ve ilerleme
7. **Faz 6 (Hafta 6)**: Test, bug fix, deploy

---

*Bu doküman yaşayan bir dokümandır. Geliştirme sürecinde güncellenecektir.*
