/*
  # Allow Admins to View All Users

  1. Changes
    - Add policy allowing admins to view all user records
    - Add policy allowing admins to update any user (for granting Pro status)

  2. Security
    - Only users in the admins table can view/modify all users
    - Regular users can still only view/update their own data
*/

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- Policy: Admins can update any user
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()));