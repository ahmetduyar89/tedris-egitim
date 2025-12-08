-- Add DELETE policy for book assignments
-- This allows teachers to delete book assignments they created

DROP POLICY IF EXISTS "Teachers can delete their assignments" ON book_assignments;
CREATE POLICY "Teachers can delete their assignments"
    ON book_assignments FOR DELETE
    TO authenticated
    USING (teacher_id = auth.uid());
