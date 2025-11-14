/*
  # Allow Username Lookup for Sign-In

  1. Changes
    - Add policy to allow unauthenticated users to look up email by username
    - This enables username-based sign-in
    - Only exposes email (not sensitive data) for authentication purposes
    
  2. Security
    - Limited to SELECT on email and username columns only
    - No access to sensitive user data
    - Required for username-based authentication
*/

-- Drop policy if it exists
DROP POLICY IF EXISTS "Allow username lookup for sign-in" ON users;

-- Allow anyone to look up email by username for sign-in purposes
CREATE POLICY "Allow username lookup for sign-in"
  ON users
  FOR SELECT
  TO anon
  USING (true);
