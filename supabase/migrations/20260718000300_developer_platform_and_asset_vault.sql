/*
  # Developer platform (API keys + OAuth) and Asset Vault tables

  The DeveloperPortal, ApiDashboard, OAuth consent flow, edge functions and
  AssetVault all reference tables that were never created in this project.

  Security posture:
  - api_keys: owner-only CRUD via RLS
  - api_usage: owner-only SELECT; writes happen through edge functions
    (service role) or the increment_api_usage function
  - api_rate_limits, oauth_auth_codes, oauth_access_tokens,
    oauth_refresh_tokens: NO client policies — service-role only
  - oauth_clients: owner-only CRUD, but is_verified / approved status can
    only be set by admins (enforced by trigger, not trusting the client)
  - oauth_user_consents: owner can view and revoke their own grants
  - asset_folders: owner-only CRUD; design_assets gains folder_id
*/

-- ============ API keys ============
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  key_hash varchar(255) NOT NULL UNIQUE,
  key_prefix varchar(20) NOT NULL,
  scopes text[] DEFAULT ARRAY['read', 'write'],
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own API keys" ON public.api_keys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API keys" ON public.api_keys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);

-- ============ API usage (daily quotas) ============
CREATE TABLE IF NOT EXISTS public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint varchar(100) NOT NULL,
  method varchar(10) NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint, usage_date)
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API usage" ON public.api_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON public.api_usage(user_id, usage_date);

-- ============ API rate limits (service-role only) ============
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint varchar(100) NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE (api_key_id, endpoint, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_key_window ON public.api_rate_limits(api_key_id, window_start);

-- Usage counter used by edge middleware (service role)
CREATE OR REPLACE FUNCTION public.increment_api_usage(
  p_user_id uuid, p_api_key_id uuid, p_endpoint varchar, p_method varchar
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.api_usage (user_id, api_key_id, endpoint, method, usage_date, request_count)
  VALUES (p_user_id, p_api_key_id, p_endpoint, p_method, CURRENT_DATE, 1)
  ON CONFLICT (user_id, endpoint, usage_date)
  DO UPDATE SET
    request_count = api_usage.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_count;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_api_usage(uuid, uuid, varchar, varchar) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_usage(uuid, uuid, varchar, varchar) TO service_role;

-- ============ OAuth clients ============
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id varchar(64) NOT NULL UNIQUE,
  client_secret_hash varchar(255) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  logo_url text,
  homepage_url text,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  scopes text[] NOT NULL DEFAULT ARRAY['openid', 'profile', 'email'],
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  verification_status varchar(16) DEFAULT 'none'
    CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')),
  verification_reason text,
  verification_requested_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OAuth apps" ON public.oauth_clients
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()));
CREATE POLICY "Users can create own OAuth apps" ON public.oauth_clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own OAuth apps" ON public.oauth_clients
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_user_admin(auth.uid()));
CREATE POLICY "Users can delete own OAuth apps" ON public.oauth_clients
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_oauth_clients_user_id ON public.oauth_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON public.oauth_clients(client_id);

-- Verification flags are admin-only: a client owner must not be able to
-- mark their own app verified/approved and unlock privileged scopes.
CREATE OR REPLACE FUNCTION public.oauth_clients_guard_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_user_admin(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified := false;
      IF NEW.verification_status = 'approved' THEN
        NEW.verification_status := 'none';
      END IF;
    ELSE
      NEW.is_verified := OLD.is_verified;
      IF NEW.verification_status = 'approved' AND OLD.verification_status <> 'approved' THEN
        NEW.verification_status := OLD.verification_status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS oauth_clients_verification_guard ON public.oauth_clients;
CREATE TRIGGER oauth_clients_verification_guard
  BEFORE INSERT OR UPDATE ON public.oauth_clients
  FOR EACH ROW EXECUTE FUNCTION public.oauth_clients_guard_verification();

-- ============ OAuth codes / tokens (service-role only) ============
CREATE TABLE IF NOT EXISTS public.oauth_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(128) NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES public.oauth_clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  code_challenge text,
  code_challenge_method varchar(10),
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.oauth_auth_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON public.oauth_auth_codes(code);

CREATE TABLE IF NOT EXISTS public.oauth_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash varchar(255) NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES public.oauth_clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT '{}',
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.oauth_access_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_oauth_access_tokens_hash ON public.oauth_access_tokens(token_hash);

CREATE TABLE IF NOT EXISTS public.oauth_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash varchar(255) NOT NULL UNIQUE,
  access_token_id uuid REFERENCES public.oauth_access_tokens(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.oauth_clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_oauth_refresh_tokens_hash ON public.oauth_refresh_tokens(token_hash);

-- ============ OAuth user consents ============
CREATE TABLE IF NOT EXISTS public.oauth_user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.oauth_clients(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT '{}',
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (user_id, client_id)
);

ALTER TABLE public.oauth_user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.oauth_user_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can grant own consents" ON public.oauth_user_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consents" ON public.oauth_user_consents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_user_consents_user ON public.oauth_user_consents(user_id);

-- ============ Asset Vault ============
CREATE TABLE IF NOT EXISTS public.asset_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.asset_folders(id) ON DELETE CASCADE,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.asset_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asset folders" ON public.asset_folders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own asset folders" ON public.asset_folders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own asset folders" ON public.asset_folders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own asset folders" ON public.asset_folders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_asset_folders_user_id ON public.asset_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_parent_id ON public.asset_folders(parent_id);

ALTER TABLE public.design_assets
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.asset_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_design_assets_folder_id ON public.design_assets(folder_id);
