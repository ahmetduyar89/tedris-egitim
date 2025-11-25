/*
  # Public Content Sharing System

  1. New Tables
    - `public_content_shares`
      - `id` (uuid, primary key) - Unique share identifier
      - `content_id` (uuid, foreign key) - References contentLibrary
      - `share_token` (text, unique) - Unique token for public access
      - `created_by` (uuid, foreign key) - References users table
      - `created_at` (timestamptz) - When the share was created
      - `expires_at` (timestamptz, nullable) - Optional expiration date
      - `is_active` (boolean) - Whether the share is currently active
      - `view_count` (integer) - Number of times the content was viewed
      - `last_viewed_at` (timestamptz, nullable) - Last view timestamp

  2. Security
    - Enable RLS on `public_content_shares` table
    - Add policy for tutors to create shares for their own content
    - Add policy for tutors to read their own shares
    - Add policy for tutors to update/delete their own shares
    - Public access does NOT require authentication when using valid share_token

  3. Indexes
    - Index on `share_token` for fast lookups
    - Index on `content_id` for querying shares by content
    - Index on `created_by` for user-specific queries

  4. Notes
    - Share tokens are randomly generated unique strings
    - Content can have multiple active shares with different expiration dates
    - Shares can be deactivated without deletion for tracking purposes
    - View count increments each time the public link is accessed
*/

-- Create the public_content_shares table
CREATE TABLE IF NOT EXISTS public_content_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_library(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  last_viewed_at timestamptz
);

-- Enable RLS
ALTER TABLE public_content_shares ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_content_shares_share_token ON public_content_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_public_content_shares_content_id ON public_content_shares(content_id);
CREATE INDEX IF NOT EXISTS idx_public_content_shares_created_by ON public_content_shares(created_by);

-- Policy: Tutors can create shares for their own content
CREATE POLICY "Tutors can create shares for own content"
  ON public_content_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM content_library
      WHERE content_library.id = public_content_shares.content_id
      AND content_library.teacher_id = auth.uid()
    )
  );

-- Policy: Tutors can view their own shares
CREATE POLICY "Tutors can view own shares"
  ON public_content_shares
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Policy: Tutors can update their own shares
CREATE POLICY "Tutors can update own shares"
  ON public_content_shares
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy: Tutors can delete their own shares
CREATE POLICY "Tutors can delete own shares"
  ON public_content_shares
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
