-- Create pdf-tests storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-tests', 'pdf-tests', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for pdf-tests bucket
DROP POLICY IF EXISTS "Teachers can upload PDF tests" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view PDF tests" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own PDF tests" ON storage.objects;

-- Policy 1: Teachers can upload PDF tests
CREATE POLICY "Teachers can upload PDF tests"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdf-tests'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Policy 2: Anyone can view PDF tests (public bucket)
CREATE POLICY "Anyone can view PDF tests"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pdf-tests');

-- Policy 3: Teachers can delete their own PDF tests
CREATE POLICY "Teachers can delete own PDF tests"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdf-tests'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Policy 4: Teachers can update their own PDF tests
CREATE POLICY "Teachers can update own PDF tests"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdf-tests'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
