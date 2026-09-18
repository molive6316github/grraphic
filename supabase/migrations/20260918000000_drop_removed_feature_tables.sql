-- Drop database tables for feature areas removed when Grraphic was
-- narrowed to design analysis + palette generation.
--
-- STAGED FOR REVIEW — NOT YET APPLIED. Review carefully before running
-- against any environment; DROP TABLE is destructive and irreversible.
--
-- Deliberately NOT dropped (kept or extracted separately):
--   * Design analysis:  design_analyses, design_comparisons
--   * Palettes:         color_palettes, palette_likes
--   * Generic sharing:  share_links  (public share links for analyses/palettes)
--   * Billing:          stripe_customers, stripe_subscriptions, stripe_orders,
--                       discount_codes
--   * Admin (basics):   admin_emails (admin allowlist), system_config, error_logs
--   * AUTH  → MXT Auth (flagged, do not drop here):
--                       users, profiles, user_2fa, user_sessions,
--                       user_preferences, email_verifications, magic_links,
--                       user_oauth_connections
--   * STORAGE → separate service (flagged, do not drop here):
--                       design_assets, asset_folders, asset_collections,
--                       design_collections, design_collection_items,
--                       design_favorites, design_tags, design_exports

BEGIN;

-- Boxt (Canva-clone design editor)
DROP TABLE IF EXISTS boxt_designs CASCADE;
DROP TABLE IF EXISTS boxt_templates CASCADE;

-- Mockup Studio
DROP TABLE IF EXISTS mockup_projects CASCADE;
DROP TABLE IF EXISTS mockup_assets CASCADE;
DROP TABLE IF EXISTS mockup_folders CASCADE;
DROP TABLE IF EXISTS mockup_templates CASCADE;

-- Gradi AI chat
DROP TABLE IF EXISTS gradi_chat_logs CASCADE;
DROP TABLE IF EXISTS gradi_chat_sessions CASCADE;
DROP TABLE IF EXISTS gradi_messages CASCADE;
DROP TABLE IF EXISTS gradi_usage CASCADE;
DROP TABLE IF EXISTS gradi_conversations CASCADE;

-- Gradi AI agents
DROP TABLE IF EXISTS gradi_agent_tasks CASCADE;
DROP TABLE IF EXISTS gradi_agent_schedules CASCADE;
DROP TABLE IF EXISTS gradi_agent_team_members CASCADE;
DROP TABLE IF EXISTS gradi_agent_teams CASCADE;
DROP TABLE IF EXISTS gradi_agents CASCADE;

-- Site Designer (AI site generation)
DROP TABLE IF EXISTS published_sites CASCADE;

-- Teams / projects / workspace  (share_links intentionally retained)
DROP TABLE IF EXISTS team_invites CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS project_items CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Developer API platform (third-party OAuth provider + API keys/usage)
DROP TABLE IF EXISTS oauth_access_tokens CASCADE;
DROP TABLE IF EXISTS oauth_refresh_tokens CASCADE;
DROP TABLE IF EXISTS oauth_auth_codes CASCADE;
DROP TABLE IF EXISTS oauth_user_consents CASCADE;
DROP TABLE IF EXISTS oauth_clients CASCADE;
DROP TABLE IF EXISTS api_rate_limits CASCADE;
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;

COMMIT;
