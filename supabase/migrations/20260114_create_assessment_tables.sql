-- Migration: Create New Assessment System Tables
-- Date: 2026-01-14

-- 1. questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL CHECK (subject IN ('math', 'science')),
    topic TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. test_sessions table
CREATE TABLE IF NOT EXISTS public.test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. answers table
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    student_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. topic_scores table
CREATE TABLE IF NOT EXISTS public.topic_scores (
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy NUMERIC(5,2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, subject, topic)
);

-- Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_scores ENABLE ROW LEVEL SECURITY;

-- Policies for questions (Read-only for all authenticated)
DROP POLICY IF EXISTS "Questions are viewable by all authenticated users" ON public.questions;
CREATE POLICY "Questions are viewable by all authenticated users"
    ON public.questions FOR SELECT
    TO authenticated
    USING (true);

-- Policies for test_sessions (Students see own sessions, tutors/parents see their students)
DROP POLICY IF EXISTS "Users can manage their own test sessions" ON public.test_sessions;
CREATE POLICY "Users can manage their own test sessions"
    ON public.test_sessions FOR ALL
    TO authenticated
    USING (
        auth.uid() = student_id OR
        EXISTS (SELECT 1 FROM public.students s WHERE s.id = test_sessions.student_id AND (s.tutor_id = auth.uid() OR s.parent_id = auth.uid()))
    );

-- Policies for answers
DROP POLICY IF EXISTS "Users can manage their own answers" ON public.answers;
CREATE POLICY "Users can manage their own answers"
    ON public.answers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.test_sessions ts 
            WHERE ts.id = answers.test_session_id 
            AND (ts.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = ts.student_id AND (s.tutor_id = auth.uid() OR s.parent_id = auth.uid())))
        )
    );

-- Policies for topic_scores
DROP POLICY IF EXISTS "Users can view relevant topic scores" ON public.topic_scores;
CREATE POLICY "Users can view relevant topic scores"
    ON public.topic_scores FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.students s WHERE s.id = topic_scores.student_id AND (s.tutor_id = auth.uid() OR s.parent_id = auth.uid()))
    );

-- Create simple trigger to update accuracy in topic_scores
CREATE OR REPLACE FUNCTION update_topic_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_questions > 0 THEN
        NEW.accuracy := (NEW.correct_answers::NUMERIC / NEW.total_questions::NUMERIC) * 100;
    ELSE
        NEW.accuracy := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_accuracy ON public.topic_scores;
CREATE TRIGGER trigger_update_accuracy
BEFORE INSERT OR UPDATE ON public.topic_scores
FOR EACH ROW EXECUTE FUNCTION update_topic_accuracy();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON public.questions(subject, topic);
CREATE INDEX IF NOT EXISTS idx_test_sessions_student ON public.test_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_session ON public.answers(test_session_id);
CREATE INDEX IF NOT EXISTS idx_topic_scores_student ON public.topic_scores(student_id);

-- Seed Data for Questions
INSERT INTO public.questions (subject, topic, difficulty, question_text, correct_answer) VALUES
('math', 'Algebra', 'easy', 'Solve for x: 2x + 5 = 13', '4'),
('math', 'Algebra', 'medium', 'What is the value of x in 3(x - 4) = 15?', '9'),
('math', 'Geometry', 'easy', 'What is the sum of angles in a triangle?', '180'),
('math', 'Geometry', 'medium', 'Find the area of a rectangle with length 5 and width 8.', '40'),
('math', 'Numbers', 'easy', 'What is the square root of 64?', '8'),
('math', 'Numbers', 'medium', 'What is 15% of 200?', '30'),
('math', 'Fractions', 'easy', 'What is 1/2 + 1/4?', '3/4'),
('math', 'Fractions', 'medium', 'Simplify 12/16', '3/4'),
('math', 'Equations', 'easy', 'If y = 2x + 1, find y when x = 3', '7'),
('math', 'Equations', 'medium', 'Solve for x: x/2 - 4 = 6', '20'),
('science', 'Biology', 'easy', 'What is the power house of the cell?', 'Mitochondria'),
('science', 'Biology', 'medium', 'Which blood cells carry oxygen?', 'Red blood cells'),
('science', 'Physics', 'easy', 'What is the unit of force?', 'Newton'),
('science', 'Physics', 'medium', 'What is the speed of light approximately?', '300,000 km/s'),
('science', 'Chemistry', 'easy', 'What is the chemical symbol for Water?', 'H2O'),
('science', 'Chemistry', 'medium', 'What is the pH of pure water?', '7'),
('science', 'Space', 'easy', 'Which planet is known as the Red Planet?', 'Mars'),
('science', 'Space', 'medium', 'What is the largest planet in our solar system?', 'Jupiter'),
('science', 'Environment', 'easy', 'What gas do plants absorb from the atmosphere?', 'Carbon Dioxide'),
('science', 'Environment', 'medium', 'Which layer of the atmosphere protects us from UV rays?', 'Ozone layer');
