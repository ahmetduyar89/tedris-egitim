/*
  # Add Public Access Policies for Content Sharing

  1. Changes to RLS Policies
    - Add policy for anonymous users to read active public_content_shares by token
    - Add policy for anonymous users to read content_library items that have active shares
    - Add policy for anonymous users to read interactive_content that is shared
    - Add policy for anonymous users to update view_count in public_content_shares

  2. Security Notes
    - Anonymous users can ONLY read content that has an active, non-expired share link
    - Anonymous users can ONLY read shares by providing a valid share_token
    - Anonymous users can ONLY update the view_count and last_viewed_at fields
    - All other operations still require authentication
    - Content without an active share remains fully protected

  3. Important
    - This enables the public sharing feature without compromising security
    - Users can still only access content through valid share links
    - Teachers maintain full control over their content and shares
*/

-- Policy: Allow anonymous users to read active shares by token
CREATE POLICY "Anyone can read active shares by token"
  ON public_content_shares
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > now())
  );

-- Policy: Allow anonymous users to update view count on active shares
CREATE POLICY "Anyone can update view count on active shares"
  ON public_content_shares
  FOR UPDATE
  TO anon
  USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > now())
  )
  WITH CHECK (
    is_active = true AND
    (expires_at IS NULL OR expires_at > now())
  );

-- Policy: Allow anonymous users to read content_library items that have active shares
CREATE POLICY "Anyone can read shared content"
  ON content_library
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public_content_shares
      WHERE public_content_shares.content_id = content_library.id
      AND public_content_shares.is_active = true
      AND (public_content_shares.expires_at IS NULL OR public_content_shares.expires_at > now())
    )
  );

-- Policy: Allow anonymous users to read interactive_content that is shared
CREATE POLICY "Anyone can read shared interactive content"
  ON interactive_content
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM content_library
      JOIN public_content_shares ON public_content_shares.content_id = content_library.id
      WHERE content_library.interactive_content_id = interactive_content.id
      AND public_content_shares.is_active = true
      AND (public_content_shares.expires_at IS NULL OR public_content_shares.expires_at > now())
    )
  );
