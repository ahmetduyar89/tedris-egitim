-- Drop the mistakes table and all its dependents (policies, indexes, etc.)
DROP TABLE IF EXISTS public.mistakes CASCADE;

-- Drop the function used for mistake analysis if it exists
DROP FUNCTION IF EXISTS public.analyze_mistake;

-- Remove valid_source_type constraint if it includes 'mistake' (optional cleanup)
-- ALTER TYPE "public"."source_type" DROP VALUE 'mistake'; -- Note: removing enum values is complex in Postgres, usually ignored.

-- Ensure no policies refer to mistakes (The CASCADE above handles policies ON the table, 
-- but we should check if other tables verify against it. Usually not.)

-- Confirms removal
SELECT 'Mistake module dropped successfully' as result;
