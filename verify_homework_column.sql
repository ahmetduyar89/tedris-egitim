-- Check and add homework column to private_lessons table if it doesn't exist
DO $$ 
BEGIN
    -- Check if homework column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'private_lessons' 
        AND column_name = 'homework'
    ) THEN
        -- Add homework column
        ALTER TABLE public.private_lessons 
        ADD COLUMN homework TEXT;
        
        RAISE NOTICE 'homework column added successfully';
    ELSE
        RAISE NOTICE 'homework column already exists';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'private_lessons' 
AND column_name IN ('homework', 'lesson_notes', 'topic');
