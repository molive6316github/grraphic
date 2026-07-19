/*
  # profiles compatibility view

  The app queries a `profiles` table that never existed in this project —
  the real data lives in `users` (+ `admins`). This view presents the shape
  the app expects and INSTEAD OF triggers map writes back onto `users`:

  - subscription_tier: computed from is_pro_subscriber + expiry
  - is_admin: computed via is_user_admin()
  - security_invoker so the RLS of `users` governs every access
*/

CREATE OR REPLACE VIEW public.profiles
WITH (security_invoker = on) AS
SELECT
  u.id,
  u.email,
  u.username,
  u.created_at,
  u.updated_at,
  CASE
    WHEN u.is_pro_subscriber
         AND (u.pro_subscription_expires_at IS NULL OR u.pro_subscription_expires_at > now())
    THEN 'pro' ELSE 'free'
  END AS subscription_tier,
  public.is_user_admin(u.id) AS is_admin,
  true AS is_verified
FROM public.users u;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.profiles_view_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, is_pro_subscriber)
  VALUES (NEW.id, NEW.email, NEW.username, COALESCE(NEW.subscription_tier, 'free') = 'pro');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_view_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users SET
    email = NEW.email,
    username = NEW.username,
    updated_at = now()
  WHERE id = OLD.id;

  -- Only touch subscription state when the tier actually changed, so a
  -- username edit can't clobber an active subscription's expiry date.
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    UPDATE public.users SET
      is_pro_subscriber = (NEW.subscription_tier = 'pro'),
      pro_subscription_expires_at = CASE WHEN NEW.subscription_tier = 'pro' THEN NULL
                                         ELSE pro_subscription_expires_at END
    WHERE id = OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_view_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS profiles_instead_insert ON public.profiles;
CREATE TRIGGER profiles_instead_insert
  INSTEAD OF INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_view_insert();

DROP TRIGGER IF EXISTS profiles_instead_update ON public.profiles;
CREATE TRIGGER profiles_instead_update
  INSTEAD OF UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_view_update();

DROP TRIGGER IF EXISTS profiles_instead_delete ON public.profiles;
CREATE TRIGGER profiles_instead_delete
  INSTEAD OF DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_view_delete();
