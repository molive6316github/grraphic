/*
  # Add Public Analysis Access Policy

  1. Changes
    - Add RLS policy to allow anyone (authenticated or not) to view public analyses
    - This enables the share link feature to work for unauthenticated users

  2. Security
    - Only analyses with is_public = 'yes' can be viewed by anyone
    - Private analyses (is_public = 'no') remain restricted to the owner
*/

-- Allow anyone to view public analyses
CREATE POLICY "Anyone can view public analyses"
  ON design_analyses
  FOR SELECT
  TO public
  USING (is_public = 'yes');
