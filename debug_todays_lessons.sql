-- Check today's lessons in the database
-- Run this in Supabase SQL Editor to verify data exists

SELECT 
    id,
    student_name,
    start_time,
    end_time,
    subject,
    status,
    DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') as lesson_date,
    EXTRACT(HOUR FROM start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') as lesson_hour
FROM private_lessons
WHERE 
    DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') = CURRENT_DATE
    AND status != 'cancelled'
ORDER BY start_time;

-- Also check what timezone the data is stored in
SELECT 
    id,
    student_name,
    start_time,
    start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul' as turkey_time
FROM private_lessons
WHERE start_time >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY start_time
LIMIT 10;
