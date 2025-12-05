-- Create mistakes table
CREATE TABLE IF NOT EXISTS mistakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    question_id TEXT, -- Optional, if linked to a specific question in QB
    question_data JSONB NOT NULL, -- Stores the full snapshot of the question
    student_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    ai_analysis JSONB, -- Stores explanation, hint, related_topic
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'analyzed', 'mastered')),
    source_type TEXT NOT NULL CHECK (source_type IN ('test', 'assignment', 'quiz')),
    source_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;

-- Policy for students to view their own mistakes
CREATE POLICY "Students can view their own mistakes"
    ON mistakes FOR SELECT
    USING (auth.uid() = student_id);

-- Policy for tutors to view their students' mistakes
CREATE POLICY "Tutors can view their students' mistakes"
    ON mistakes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = mistakes.student_id
            AND students.tutor_id = auth.uid()
        )
    );

-- Policy for students to insert their own mistakes (e.g. after a test)
CREATE POLICY "Students can insert their own mistakes"
    ON mistakes FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Policy for students to update their own mistakes (e.g. mark as mastered)
CREATE POLICY "Students can update their own mistakes"
    ON mistakes FOR UPDATE
    USING (auth.uid() = student_id);

-- Indexes for performance
CREATE INDEX idx_mistakes_student_id ON mistakes(student_id);
CREATE INDEX idx_mistakes_status ON mistakes(status);
CREATE INDEX idx_mistakes_created_at ON mistakes(created_at);
