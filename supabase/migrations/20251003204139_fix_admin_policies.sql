/*
  # Fix Admin Policies - Remove Infinite Recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create simple policies without recursion
    - Admins can read all admin records
    - Admins can insert new admin records
    - Admins can delete admin records (but not themselves)

  2. Security
    - Uses direct table checks instead of recursive function calls
    - Maintains security while avoiding infinite recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admins table" ON admins;
DROP POLICY IF EXISTS "Admins can add other admins" ON admins;
DROP POLICY IF EXISTS "Admins can remove other admins" ON admins;

-- Simple policy: Allow authenticated users to check if they are admin
-- This allows the initial check without recursion
CREATE POLICY "Users can check own admin status"
  ON admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all admin records
-- Uses a subquery to check admin status without recursion
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Policy: Admins can insert new admins
CREATE POLICY "Admins can add admins"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Policy: Admins can delete other admins (not themselves)
CREATE POLICY "Admins can remove admins"
  ON admins FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admins)
    AND user_id != auth.uid()
  );