-- Turkish Learning System Migration
-- Date: 2025-12-08
-- Description: Adds comprehensive Turkish language learning system with vocabulary, idioms, proverbs, and book reading

-- ============================================================================
-- 1. EXTEND FLASHCARDS TABLE FOR TURKISH CONTENT
-- ============================================================================

-- Add category field to existing flashcards table
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general' 
CHECK (category IN ('general', 'vocabulary', 'idiom', 'proverb', 'book_related'));

-- Add metadata for additional information
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add week assignment tracking
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS week_assigned DATE;

-- Create indexes for Turkish content filtering
CREATE INDEX IF NOT EXISTS idx_flashcards_category ON flashcards(category);
CREATE INDEX IF NOT EXISTS idx_flashcards_topic_category ON flashcards(topic, category);
CREATE INDEX IF NOT EXISTS idx_flashcards_week_assigned ON flashcards(week_assigned);

-- ============================================================================
-- 2. BOOKS SYSTEM
-- ============================================================================

-- Books library
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    page_count INTEGER NOT NULL,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    estimated_reading_days INTEGER NOT NULL DEFAULT 7,
    cover_image_url TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- Book reading questions (form builder)
CREATE TABLE IF NOT EXISTS book_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'multiple_choice', 'yes_no', 'rating')),
    options JSONB DEFAULT '[]'::jsonb, -- For multiple choice: ["Option 1", "Option 2", ...]
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book assignments to students
CREATE TABLE IF NOT EXISTS book_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'reading', 'completed', 'reviewed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    teacher_feedback TEXT,
    teacher_score INTEGER CHECK (teacher_score >= 0 AND teacher_score <= 100),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(book_id, student_id, assigned_at)
);

-- Student answers to book questions
CREATE TABLE IF NOT EXISTS book_question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES book_assignments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES book_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, question_id)
);

-- ============================================================================
-- 3. WEEKLY TURKISH LEARNING GOALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_turkish_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    
    -- Vocabulary tracking
    vocabulary_target INTEGER DEFAULT 10,
    vocabulary_learned INTEGER DEFAULT 0,
    
    -- Idioms tracking
    idioms_target INTEGER DEFAULT 10,
    idioms_learned INTEGER DEFAULT 0,
    
    -- Proverbs tracking
    proverbs_target INTEGER DEFAULT 10,
    proverbs_learned INTEGER DEFAULT 0,
    
    -- Book reading tracking
    book_assignment_id UUID REFERENCES book_assignments(id) ON DELETE SET NULL,
    book_completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, week_start_date)
);

-- ============================================================================
-- 4. TURKISH CONTENT LIBRARY (for teacher's content pool)
-- ============================================================================

CREATE TABLE IF NOT EXISTS turkish_content_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('vocabulary', 'idiom', 'proverb')),
    front_content TEXT NOT NULL, -- Word/Idiom/Proverb
    back_content TEXT NOT NULL, -- Meaning/Explanation
    example_sentence TEXT,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_books_created_by ON books(created_by);
CREATE INDEX IF NOT EXISTS idx_book_questions_book_id ON book_questions(book_id);
CREATE INDEX IF NOT EXISTS idx_book_assignments_student ON book_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_book_assignments_teacher ON book_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_book_assignments_status ON book_assignments(status);
CREATE INDEX IF NOT EXISTS idx_book_question_answers_assignment ON book_question_answers(assignment_id);
CREATE INDEX IF NOT EXISTS idx_weekly_turkish_goals_student ON weekly_turkish_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_turkish_goals_week ON weekly_turkish_goals(week_start_date);
CREATE INDEX IF NOT EXISTS idx_turkish_content_library_teacher ON turkish_content_library(teacher_id);
CREATE INDEX IF NOT EXISTS idx_turkish_content_library_category ON turkish_content_library(category);

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Books policies
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active books" ON books;
CREATE POLICY "Everyone can view active books"
    ON books FOR SELECT
    TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Teachers can manage their own books" ON books;
CREATE POLICY "Teachers can manage their own books"
    ON books FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Book questions policies
ALTER TABLE book_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view questions for accessible books" ON book_questions;
CREATE POLICY "Users can view questions for accessible books"
    ON book_questions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_questions.book_id 
            AND (books.is_active = true OR books.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Teachers can manage questions for their books" ON book_questions;
CREATE POLICY "Teachers can manage questions for their books"
    ON book_questions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_questions.book_id 
            AND books.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_questions.book_id 
            AND books.created_by = auth.uid()
        )
    );

-- Book assignments policies
ALTER TABLE book_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own assignments" ON book_assignments;
CREATE POLICY "Students can view their own assignments"
    ON book_assignments FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view their students' assignments" ON book_assignments;
CREATE POLICY "Teachers can view their students' assignments"
    ON book_assignments FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can create assignments for their students" ON book_assignments;
CREATE POLICY "Teachers can create assignments for their students"
    ON book_assignments FOR INSERT
    TO authenticated
    WITH CHECK (
        teacher_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_id 
            AND students.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers can update their assignments" ON book_assignments;
CREATE POLICY "Teachers can update their assignments"
    ON book_assignments FOR UPDATE
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their assignment status" ON book_assignments;
CREATE POLICY "Students can update their assignment status"
    ON book_assignments FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can delete their assignments" ON book_assignments;
CREATE POLICY "Teachers can delete their assignments"
    ON book_assignments FOR DELETE
    TO authenticated
    USING (teacher_id = auth.uid());

-- Book question answers policies
ALTER TABLE book_question_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own answers" ON book_question_answers;
CREATE POLICY "Students can view their own answers"
    ON book_question_answers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM book_assignments 
            WHERE book_assignments.id = book_question_answers.assignment_id 
            AND book_assignments.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers can view their students' answers" ON book_question_answers;
CREATE POLICY "Teachers can view their students' answers"
    ON book_question_answers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM book_assignments 
            WHERE book_assignments.id = book_question_answers.assignment_id 
            AND book_assignments.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can submit their own answers" ON book_question_answers;
CREATE POLICY "Students can submit their own answers"
    ON book_question_answers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM book_assignments 
            WHERE book_assignments.id = assignment_id 
            AND book_assignments.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can update their own answers" ON book_question_answers;
CREATE POLICY "Students can update their own answers"
    ON book_question_answers FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM book_assignments 
            WHERE book_assignments.id = assignment_id 
            AND book_assignments.student_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM book_assignments 
            WHERE book_assignments.id = assignment_id 
            AND book_assignments.student_id = auth.uid()
        )
    );

-- Weekly Turkish goals policies
ALTER TABLE weekly_turkish_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own goals" ON weekly_turkish_goals;
CREATE POLICY "Students can view their own goals"
    ON weekly_turkish_goals FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view their students' goals" ON weekly_turkish_goals;
CREATE POLICY "Teachers can view their students' goals"
    ON weekly_turkish_goals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_id 
            AND students.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can update their own goals" ON weekly_turkish_goals;
CREATE POLICY "Students can update their own goals"
    ON weekly_turkish_goals FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage their students' goals" ON weekly_turkish_goals;
CREATE POLICY "Teachers can manage their students' goals"
    ON weekly_turkish_goals FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_id 
            AND students.tutor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_id 
            AND students.tutor_id = auth.uid()
        )
    );

-- Turkish content library policies
ALTER TABLE turkish_content_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view their own content" ON turkish_content_library;
CREATE POLICY "Teachers can view their own content"
    ON turkish_content_library FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage their own content" ON turkish_content_library;
CREATE POLICY "Teachers can manage their own content"
    ON turkish_content_library FOR ALL
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

-- ============================================================================
-- 7. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update weekly_turkish_goals.updated_at on changes
CREATE OR REPLACE FUNCTION update_weekly_turkish_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_weekly_turkish_goals_updated_at ON weekly_turkish_goals;
CREATE TRIGGER trigger_update_weekly_turkish_goals_updated_at
    BEFORE UPDATE ON weekly_turkish_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_turkish_goals_updated_at();

-- Grant necessary permissions
GRANT ALL ON books TO authenticated;
GRANT ALL ON book_questions TO authenticated;
GRANT ALL ON book_assignments TO authenticated;
GRANT ALL ON book_question_answers TO authenticated;
GRANT ALL ON weekly_turkish_goals TO authenticated;
GRANT ALL ON turkish_content_library TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
