-- Fix Question Bank Assignment Metadata in Weekly Programs
-- This script fixes the issue where questionBankAssignmentId is stored as an object instead of a string

-- First, let's see the problematic tasks
SELECT 
    id,
    student_id,
    week,
    jsonb_pretty(days) as days_data
FROM weekly_programs
WHERE days::text LIKE '%questionBankAssignmentId%'
LIMIT 5;

-- Update function to fix the metadata
DO $$
DECLARE
    program_record RECORD;
    day_record RECORD;
    task_record RECORD;
    updated_days JSONB;
    updated_tasks JSONB;
    assignment_id TEXT;
BEGIN
    -- Loop through all weekly programs
    FOR program_record IN 
        SELECT id, days 
        FROM weekly_programs 
        WHERE days::text LIKE '%questionBankAssignmentId%'
    LOOP
        updated_days := '[]'::jsonb;
        
        -- Loop through each day
        FOR day_record IN 
            SELECT * FROM jsonb_array_elements(program_record.days)
        LOOP
            updated_tasks := '[]'::jsonb;
            
            -- Loop through each task in the day
            FOR task_record IN 
                SELECT * FROM jsonb_array_elements(day_record.value->'tasks')
            LOOP
                -- Check if task has questionBankAssignmentId in metadata
                IF task_record.value->'metadata'->>'questionBankAssignmentId' IS NOT NULL THEN
                    -- Try to extract the ID if it's an object
                    IF jsonb_typeof(task_record.value->'metadata'->'questionBankAssignmentId') = 'object' THEN
                        assignment_id := task_record.value->'metadata'->'questionBankAssignmentId'->>'id';
                        
                        RAISE NOTICE 'Fixing task % - Converting object to string: %', 
                            task_record.value->>'id', assignment_id;
                        
                        -- Update the task with the fixed metadata
                        updated_tasks := updated_tasks || jsonb_build_array(
                            jsonb_set(
                                task_record.value,
                                '{metadata,questionBankAssignmentId}',
                                to_jsonb(assignment_id)
                            )
                        );
                    ELSE
                        -- Already a string, keep as is
                        updated_tasks := updated_tasks || jsonb_build_array(task_record.value);
                    END IF;
                ELSE
                    -- No questionBankAssignmentId, keep task as is
                    updated_tasks := updated_tasks || jsonb_build_array(task_record.value);
                END IF;
            END LOOP;
            
            -- Update the day with fixed tasks
            updated_days := updated_days || jsonb_build_array(
                jsonb_set(day_record.value, '{tasks}', updated_tasks)
            );
        END LOOP;
        
        -- Update the program with fixed days
        UPDATE weekly_programs 
        SET days = updated_days 
        WHERE id = program_record.id;
        
        RAISE NOTICE 'Updated program: %', program_record.id;
    END LOOP;
END $$;

-- Verify the fix
SELECT 
    id,
    student_id,
    week,
    jsonb_pretty(days) as days_data
FROM weekly_programs
WHERE days::text LIKE '%questionBankAssignmentId%'
LIMIT 5;

-- Show summary
SELECT 
    COUNT(*) as total_programs,
    COUNT(CASE WHEN days::text LIKE '%questionBankAssignmentId%' THEN 1 END) as programs_with_qb_tasks
FROM weekly_programs;
