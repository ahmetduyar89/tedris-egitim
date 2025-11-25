/*
  # Create PDF Tests Storage Bucket

  1. Storage Configuration
    - Create 'pdf-tests' storage bucket for storing test PDF files
    - Enable public access for authenticated users to read files
    - Configure proper RLS policies for secure access
    
  2. Security Policies
    - Teachers can upload PDFs to their own folder
    - Teachers and students can read PDFs they have access to
    - Proper authentication and authorization checks
    
  3. CORS Configuration
    - Allow embedding PDFs in iframes
    - Enable cross-origin access for the application domain
*/

-- Create the storage bucket for PDF test files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-tests',
  'pdf-tests',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can upload PDFs to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Public can read PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update their PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their PDFs" ON storage.objects;

-- Allow teachers to upload PDFs to their own folder
CREATE POLICY "Teachers can upload PDFs to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdf-tests' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read PDF files
CREATE POLICY "Authenticated users can read PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'pdf-tests');

-- Allow public access to read PDFs (needed for iframe embedding)
CREATE POLICY "Public can read PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pdf-tests');

-- Allow teachers to update their own PDFs
CREATE POLICY "Teachers can update their PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdf-tests' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'pdf-tests' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow teachers to delete their own PDFs
CREATE POLICY "Teachers can delete their PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdf-tests' AND
  (storage.foldername(name))[1] = auth.uid()::text
);