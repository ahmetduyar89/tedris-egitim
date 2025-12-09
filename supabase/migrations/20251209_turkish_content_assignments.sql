-- Turkish Content Assignment System Migration
-- Creates tables for the new 3-stage learning flow (Learning → Practice → Mastery)

-- ============================================================================
-- TURKISH CONTENT ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.turkish_content_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_ids TEXT[] NOT NULL, -- Array of TurkishContentLibraryItem IDs
    category TEXT NOT NULL CHECK (category IN ('vocabulary', 'idiom', 'proverb')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    
    -- Learning phase
    learning_status TEXT NOT NULL DEFAULT 'not_started' CHECK (learning_status IN ('not_started', 'learning', 'practicing', 'mastered')),
    learned_content_ids TEXT[] NOT NULL DEFAULT '{}', -- Array of content IDs marked as learned
    
    -- Practice phase
    practice_attempts INTEGER NOT NULL DEFAULT 0,
    practice_score NUMERIC(5,2), -- 0-100
    practice_completed_at TIMESTAMPTZ,
    
    -- Mastery phase
    mastered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TURKISH CONTENT PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.turkish_content_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.turkish_content_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL, -- Reference to TurkishContentLibraryItem
    
    -- Learning tracking
    view_count INTEGER NOT NULL DEFAULT 0,
    marked_as_learned BOOLEAN NOT NULL DEFAULT FALSE,
    learned_at TIMESTAMPTZ,
    
    -- Practice tracking
    practice_attempts INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    last_practice_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one progress record per assignment-content pair
    UNIQUE(assignment_id, content_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_turkish_assignments_student 
    ON public.turkish_content_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_turkish_assignments_teacher 
    ON public.turkish_content_assignments(teacher_id);

CREATE INDEX IF NOT EXISTS idx_turkish_assignments_status 
    ON public.turkish_content_assignments(learning_status);

CREATE INDEX IF NOT EXISTS idx_turkish_assignments_due_date 
    ON public.turkish_content_assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_turkish_progress_assignment 
    ON public.turkish_content_progress(assignment_id);

CREATE INDEX IF NOT EXISTS idx_turkish_progress_student 
    ON public.turkish_content_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_turkish_progress_content 
    ON public.turkish_content_progress(content_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_turkish_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_turkish_assignment_updated_at
    BEFORE UPDATE ON public.turkish_content_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_turkish_assignment_updated_at();

CREATE TRIGGER trigger_update_turkish_progress_updated_at
    BEFORE UPDATE ON public.turkish_content_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_turkish_assignment_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.turkish_content_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turkish_content_progress ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own assignments
CREATE POLICY turkish_assignments_teacher_policy ON public.turkish_content_assignments
    FOR ALL
    USING (teacher_id = auth.uid());

-- Students can view their own assignments
CREATE POLICY turkish_assignments_student_view_policy ON public.turkish_content_assignments
    FOR SELECT
    USING (student_id = auth.uid());

-- Students can update their own assignment progress
CREATE POLICY turkish_assignments_student_update_policy ON public.turkish_content_assignments
    FOR UPDATE
    USING (student_id = auth.uid());

-- Teachers can view all progress for their assignments
CREATE POLICY turkish_progress_teacher_policy ON public.turkish_content_progress
    FOR ALL
    USING (assignment_id IN (
        SELECT id FROM public.turkish_content_assignments WHERE teacher_id = auth.uid()
    ));

-- Students can manage their own progress
CREATE POLICY turkish_progress_student_policy ON public.turkish_content_progress
    FOR ALL
    USING (student_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.turkish_content_assignments IS 'Stores Turkish learning content assignments with 3-stage learning flow';
COMMENT ON TABLE public.turkish_content_progress IS 'Tracks individual student progress for each content item in an assignment';
COMMENT ON COLUMN public.turkish_content_assignments.learning_status IS 'Current phase: not_started, learning, practicing, or mastered';
COMMENT ON COLUMN public.turkish_content_assignments.content_ids IS 'Array of TurkishContentLibraryItem IDs assigned to student';
COMMENT ON COLUMN public.turkish_content_assignments.learned_content_ids IS 'Array of content IDs that student marked as learned';
COMMENT ON COLUMN public.turkish_content_progress.view_count IS 'Number of times student viewed this content during learning phase';
COMMENT ON COLUMN public.turkish_content_progress.marked_as_learned IS 'Whether student clicked "Öğrendim" button for this content';
