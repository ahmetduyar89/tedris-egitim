-- Enable RLS on private_lessons table
ALTER TABLE private_lessons ENABLE ROW LEVEL SECURITY;

-- Update status check constraint to allow 'started' status
-- Note: If you are using an ENUM type, you might need to run: ALTER TYPE "LessonStatus" ADD VALUE 'started';
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'private_lessons_status_check') THEN
        ALTER TABLE private_lessons DROP CONSTRAINT private_lessons_status_check;
        ALTER TABLE private_lessons ADD CONSTRAINT private_lessons_status_check 
            CHECK (status IN ('scheduled', 'completed', 'cancelled', 'started'));
    END IF;
END $$;

-- Policy for Tutors (Teachers) to view their own lessons
DROP POLICY IF EXISTS "Tutors can view their own lessons" ON private_lessons;
CREATE POLICY "Tutors can view their own lessons" 
ON private_lessons FOR SELECT 
USING (auth.uid() = tutor_id);

-- Policy for Tutors to insert their own lessons
DROP POLICY IF EXISTS "Tutors can insert their own lessons" ON private_lessons;
CREATE POLICY "Tutors can insert their own lessons" 
ON private_lessons FOR INSERT 
WITH CHECK (auth.uid() = tutor_id);

-- Policy for Tutors to update their own lessons
DROP POLICY IF EXISTS "Tutors can update their own lessons" ON private_lessons;
CREATE POLICY "Tutors can update their own lessons" 
ON private_lessons FOR UPDATE 
USING (auth.uid() = tutor_id);

-- Policy for Tutors to delete their own lessons
DROP POLICY IF EXISTS "Tutors can delete their own lessons" ON private_lessons;
CREATE POLICY "Tutors can delete their own lessons" 
ON private_lessons FOR DELETE 
USING (auth.uid() = tutor_id);

-- Policy for Students to view their own lessons
DROP POLICY IF EXISTS "Students can view their own lessons" ON private_lessons;
CREATE POLICY "Students can view their own lessons" 
ON private_lessons FOR SELECT 
USING (auth.uid() = student_id);

-- Grant access to authenticated users
GRANT ALL ON private_lessons TO authenticated;
