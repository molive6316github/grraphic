/*
  # Persistent OAuth provider connections

  Supabase only exposes provider_token in the session immediately after an
  OAuth sign-in - it is never stored. To make "connect GitHub once, stay
  connected forever" work, the app captures the token right after auth and
  saves it here, keyed by (user, provider).
*/

CREATE TABLE IF NOT EXISTS public.user_oauth_connections (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_token text,
  provider_username text,
  connected_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);

ALTER TABLE public.user_oauth_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.user_oauth_connections
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can add own connections" ON public.user_oauth_connections
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own connections" ON public.user_oauth_connections
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove own connections" ON public.user_oauth_connections
  FOR DELETE TO authenticated USING (user_id = auth.uid());
