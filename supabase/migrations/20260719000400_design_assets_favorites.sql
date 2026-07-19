/* Favorites for the Asset Vault */
ALTER TABLE public.design_assets ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
