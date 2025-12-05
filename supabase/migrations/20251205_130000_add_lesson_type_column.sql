-- Add type column to private_lessons table
ALTER TABLE private_lessons 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'face_to_face';

-- Update existing records to have 'face_to_face' if they are null
UPDATE private_lessons SET type = 'face_to_face' WHERE type IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_private_lessons_type ON private_lessons(type);
