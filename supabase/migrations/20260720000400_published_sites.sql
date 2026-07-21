/*
  # Published sites (Site Designer one-click deploy)

  A deployed site is a single self-contained HTML document served by the
  Vercel API gateway at:
      https://api.grraphic.xyz/sites/{user_id}/{id}
  Re-deploying the same project (same slug) updates the same row, so the
  URL is stable. An optional custom_domain lets the gateway serve the site
  when the incoming Host header matches (after the domain is pointed at the
  project in Vercel + DNS).
*/

CREATE TABLE IF NOT EXISTS public.published_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text,
  html text NOT NULL,
  custom_domain text UNIQUE,
  published_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, slug)
);

ALTER TABLE public.published_sites ENABLE ROW LEVEL SECURITY;

-- Owners manage their own sites; the gateway reads with the service role
CREATE POLICY "Users manage own published sites" ON public.published_sites
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_published_sites_custom_domain
  ON public.published_sites(custom_domain) WHERE custom_domain IS NOT NULL;
