-- Create pomodoro_sessions table to track student study time
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER NOT NULL,
    break_duration_minutes INTEGER NOT NULL DEFAULT 5,
    completed_cycles INTEGER NOT NULL DEFAULT 0,
    total_work_minutes INTEGER NOT NULL DEFAULT 0,
    total_break_minutes INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_student_id ON pomodoro_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at ON pomodoro_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own pomodoro sessions"
    ON pomodoro_sessions FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Students can insert their own pomodoro sessions"
    ON pomodoro_sessions FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Students can update their own pomodoro sessions"
    ON pomodoro_sessions FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Teachers can view their students' pomodoro sessions"
    ON pomodoro_sessions FOR SELECT
    USING (
        auth.uid() IN (
            SELECT t.user_id 
            FROM teachers t
            INNER JOIN students s ON s.id = pomodoro_sessions.student_id
            WHERE t.id = s.teacher_id
        )
    );
