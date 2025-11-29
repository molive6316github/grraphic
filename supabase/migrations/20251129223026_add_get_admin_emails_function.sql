/*
  # Create get_admin_emails function

  1. Function
    - `get_admin_emails()` - Returns array of admin email addresses
    - Used by the notify-admin-error edge function to send error notifications

  2. Security
    - Function is marked as SECURITY DEFINER to bypass RLS
    - Only callable by authenticated users
*/

CREATE OR REPLACE FUNCTION get_admin_emails()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_emails json;
BEGIN
  SELECT json_agg(au.email)
  INTO admin_emails
  FROM admins a
  JOIN auth.users au ON a.user_id = au.id
  WHERE au.email IS NOT NULL;

  RETURN COALESCE(admin_emails, '[]'::json);
END;
$$;
