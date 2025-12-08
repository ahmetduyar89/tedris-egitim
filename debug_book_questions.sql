-- Debug script for book questions issue
-- Run this in Supabase SQL Editor to check if questions are being saved

-- 1. Check all books
SELECT 
    id,
    title,
    author,
    created_by,
    created_at,
    is_active
FROM books
WHERE is_active = true
ORDER BY created_at DESC;

-- 2. Check all book questions
SELECT 
    bq.id,
    bq.book_id,
    b.title as book_title,
    bq.question_text,
    bq.question_type,
    bq.order_index,
    bq.is_required,
    bq.created_at
FROM book_questions bq
LEFT JOIN books b ON b.id = bq.book_id
ORDER BY bq.created_at DESC;

-- 3. Check book assignments
SELECT 
    ba.id,
    ba.book_id,
    b.title as book_title,
    ba.student_id,
    s.name as student_name,
    ba.status,
    ba.assigned_at,
    ba.due_date
FROM book_assignments ba
LEFT JOIN books b ON b.id = ba.book_id
LEFT JOIN students s ON s.id = ba.student_id
ORDER BY ba.assigned_at DESC;

-- 4. Check if there are any questions for assigned books
SELECT 
    ba.id as assignment_id,
    b.title as book_title,
    s.name as student_name,
    ba.status,
    COUNT(bq.id) as question_count
FROM book_assignments ba
LEFT JOIN books b ON b.id = ba.book_id
LEFT JOIN students s ON s.id = ba.student_id
LEFT JOIN book_questions bq ON bq.book_id = ba.book_id
GROUP BY ba.id, b.title, s.name, ba.status
ORDER BY ba.assigned_at DESC;

-- 5. Check RLS policies for book_questions table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'book_questions';
