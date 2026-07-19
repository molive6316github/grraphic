/*
  # Convert design_analyses.is_public from text to boolean

  The column held mixed junk ('yes', 'no', 'false') because the app writes
  booleans while the column was text. Convert to a real boolean, mapping
  yes/true -> true and everything else -> false, and recreate the public
  visibility policy against the boolean.
*/

DROP POLICY IF EXISTS "Anyone can view public analyses" ON public.design_analyses;

ALTER TABLE public.design_analyses ALTER COLUMN is_public DROP DEFAULT;

ALTER TABLE public.design_analyses
  ALTER COLUMN is_public TYPE boolean
  USING (lower(coalesce(is_public, 'false')) IN ('yes', 'true', 't', '1'));

ALTER TABLE public.design_analyses
  ALTER COLUMN is_public SET DEFAULT false;

UPDATE public.design_analyses SET is_public = false WHERE is_public IS NULL;

ALTER TABLE public.design_analyses
  ALTER COLUMN is_public SET NOT NULL;

CREATE POLICY "Anyone can view public analyses" ON public.design_analyses
  FOR SELECT USING (is_public = true);
