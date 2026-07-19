/*
  # Security Hardening

  1. Pin search_path on all public functions flagged by the database linter
  2. Lock down EXECUTE on SECURITY DEFINER functions so anonymous and
     signed-in users can only call what they actually need
  3. Replace the wide-open anonymous SELECT policy on users (exposed every
     user's email) with a narrow lookup RPC used only for username sign-in
  4. Tighten always-true INSERT policies on error_logs and gradi_chat_logs
     so rows can only be attributed to the caller
  5. Remove public listing of the design-images bucket (public URLs still
     work) and add the missing storage policies for the design-assets bucket
  6. Allow users to delete their own users row (account deletion)
*/

-- 1) Pin search_path (bodies only reference public.* unqualified; auth.* is qualified)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_monthly_credits() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_user_admin(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_pro_subscriptions() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_admin_emails() SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.update_gradi_session_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_boxt_design_updated_at() SET search_path = public, pg_temp;

-- 2) Function EXECUTE lockdown
REVOKE EXECUTE ON FUNCTION public.expire_pro_subscriptions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_monthly_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.get_admin_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_emails() TO service_role;
-- is_admin / is_user_admin stay executable by authenticated (RLS policies call them)
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_user_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;

-- 3) Kill the users-table dump for anonymous visitors
DROP POLICY IF EXISTS "Allow username lookup for sign-in" ON public.users;

-- Narrow replacement: resolve a username to its sign-in email, nothing else
CREATE OR REPLACE FUNCTION public.get_email_for_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT email FROM public.users
  WHERE lower(username) = lower(trim(p_username))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_email_for_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;

-- Signup-time availability check without exposing rows
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.users WHERE lower(username) = lower(trim(p_username))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

-- 4) Attribute log inserts to the caller
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
CREATE POLICY "Users can insert own error logs"
  ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone authenticated can insert chat logs" ON public.gradi_chat_logs;
CREATE POLICY "Users can insert own chat logs"
  ON public.gradi_chat_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 5) Storage: stop anonymous listing of design-images (public object URLs
--    are served without a SELECT policy on a public bucket)
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
CREATE POLICY "Users read own design images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'design-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- design-assets bucket previously had no policies at all (uploads failed)
CREATE POLICY "Users read own design assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own design assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own design assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own design assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6) Account deletion
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;
CREATE POLICY "Users can delete own data"
  ON public.users FOR DELETE TO authenticated
  USING (auth.uid() = id);
