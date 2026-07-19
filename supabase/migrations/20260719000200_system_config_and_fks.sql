/*
  # system_config table + missing foreign keys

  - system_config: admin-editable settings (AdminSettings UI reads/writes
    it; the Gradi system prompt lives here)
  - Add real FKs from user-owned content tables to users so PostgREST can
    embed profiles (e.g. design_analyses -> profiles:user_id) and so
    deleting a user cascades correctly. Verified zero orphan rows first.
*/

CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(key);

INSERT INTO public.system_config (key, value, description)
VALUES (
  'gradi_system_prompt',
  'You are Gradi, an expert AI assistant created by Grraphic. You''re available to help with absolutely anything - from creative and technical problems to general knowledge questions and everyday tasks.',
  'System prompt for Gradi AI assistant'
) ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read system_config" ON public.system_config
  FOR SELECT TO authenticated USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Admins can update system_config" ON public.system_config
  FOR UPDATE TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));
CREATE POLICY "Admins can insert system_config" ON public.system_config
  FOR INSERT TO authenticated WITH CHECK (public.is_user_admin(auth.uid()));

-- Missing FKs (checked: no orphan rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_analyses_user_id_fkey') THEN
    ALTER TABLE public.design_analyses
      ADD CONSTRAINT design_analyses_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gradi_chat_sessions_user_id_fkey') THEN
    ALTER TABLE public.gradi_chat_sessions
      ADD CONSTRAINT gradi_chat_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boxt_designs_user_id_fkey') THEN
    ALTER TABLE public.boxt_designs
      ADD CONSTRAINT boxt_designs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;
