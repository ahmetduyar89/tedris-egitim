-- Migration to add parent contact details to students table

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Update RLS policies if necessary (usually not needed for adding columns if "update" policy exists)
-- Just in case, ensure the tutor can update these new columns
-- (Assuming existing policy handles "UPDATE" on all columns for the tutor)
