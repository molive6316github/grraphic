/*
  # Fix Admin Policies - Remove ALL Recursion

  1. Changes
    - Drop ALL existing policies
    - Create single simple policy for SELECT
    - Users can only see their own admin record
    - This breaks the recursion cycle

  2. Security
    - Users can check if they are admin without recursion
    - Simple and secure
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view admins table" ON admins;
DROP POLICY IF EXISTS "Admins can add other admins" ON admins;
DROP POLICY IF EXISTS "Admins can remove other admins" ON admins;
DROP POLICY IF EXISTS "Users can check own admin status" ON admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can add admins" ON admins;
DROP POLICY IF EXISTS "Admins can remove admins" ON admins;
DROP POLICY IF EXISTS "Admins can view all admin records" ON admins;
DROP POLICY IF EXISTS "Admins can grant admin status" ON admins;
DROP POLICY IF EXISTS "Admins can revoke admin status" ON admins;

-- Simple policy: Users can only check if THEY are admin
-- This is used by useAdmin hook to determine if user is admin
CREATE POLICY "Check own admin status"
  ON admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- For admin panel - allow reading all admins if requesting user is in admins table
-- We use a security definer function to break the recursion
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = check_user_id
  );
$$;

-- Policy for viewing all admins in admin panel
CREATE POLICY "Admins view all"
  ON admins FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- Policy for inserting new admins
CREATE POLICY "Admins insert"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_user_admin(auth.uid()));

-- Policy for deleting admins
CREATE POLICY "Admins delete"
  ON admins FOR DELETE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) AND user_id != auth.uid());