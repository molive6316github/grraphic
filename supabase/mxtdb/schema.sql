-- MXT DB schema for Grraphic (trimmed app).
-- Adapted from the Supabase migrations for db.mxt.productions:
--   * auth.uid() returns the GateKey token `sub` as TEXT, so user columns are
--     uuid and compared with auth.uid()::uuid.
--   * No FKs to auth.users (GateKey user provisioning there is not relied on).
--   * RLS is on by default; service_role bypasses it. Policies are written
--     without a TO clause (the mx_* roles, not bare anon/authenticated, exist),
--     relying on auth.uid()/auth.role() checks. Server writes (Stripe webhook,
--     GateKey callback) use the service_role key and bypass RLS.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type stripe_subscription_status as enum
    ('not_started','incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stripe_order_status as enum ('pending','completed','canceled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- users (identity mirror + credits/subscription) — keyed by GateKey uid
-- ---------------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default auth.uid()::uuid,
  email text,
  username text unique,
  is_pro_subscriber boolean default false,
  pro_credits_remaining integer default 10,
  pro_credits_reset_date timestamptz,
  pro_subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table users enable row level security;
drop policy if exists users_select_own on users;
create policy users_select_own on users for select using (id = auth.uid()::uuid);
drop policy if exists users_insert_own on users;
create policy users_insert_own on users for insert with check (id = auth.uid()::uuid);
drop policy if exists users_update_own on users;
create policy users_update_own on users for update using (id = auth.uid()::uuid) with check (id = auth.uid()::uuid);

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
create table if not exists admins (
  user_id uuid primary key default auth.uid()::uuid,
  created_at timestamptz default now()
);
alter table admins enable row level security;

create or replace function is_user_admin(check_user_id uuid)
returns boolean language sql stable security definer set search_path = proj_jf0qdubnp0gi6yvc as $$
  select exists (select 1 from admins where user_id = check_user_id);
$$;

drop policy if exists admins_select on admins;
create policy admins_select on admins for select using (user_id = auth.uid()::uuid or is_user_admin(auth.uid()::uuid));

-- ---------------------------------------------------------------------------
-- design_analyses
-- ---------------------------------------------------------------------------
create table if not exists design_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  file_name text not null,
  analysis_data jsonb not null,
  image_url text,
  is_public boolean not null default false,
  team_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table design_analyses enable row level security;
drop policy if exists analyses_select on design_analyses;
create policy analyses_select on design_analyses for select using (user_id = auth.uid()::uuid or is_public = true);
drop policy if exists analyses_insert on design_analyses;
create policy analyses_insert on design_analyses for insert with check (user_id = auth.uid()::uuid);
drop policy if exists analyses_update on design_analyses;
create policy analyses_update on design_analyses for update using (user_id = auth.uid()::uuid);
drop policy if exists analyses_delete on design_analyses;
create policy analyses_delete on design_analyses for delete using (user_id = auth.uid()::uuid);
create index if not exists idx_analyses_user_id on design_analyses(user_id);
create index if not exists idx_analyses_is_public on design_analyses(is_public);

-- ---------------------------------------------------------------------------
-- design_comparisons
-- ---------------------------------------------------------------------------
create table if not exists design_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  analysis_ids uuid[] not null default '{}',
  title text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table design_comparisons enable row level security;
drop policy if exists comparisons_all on design_comparisons;
create policy comparisons_all on design_comparisons for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

-- ---------------------------------------------------------------------------
-- color_palettes + palette_likes
-- ---------------------------------------------------------------------------
create table if not exists color_palettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  name text not null,
  colors jsonb not null default '[]',
  source_image_url text,
  is_public boolean default false,
  likes_count integer default 0,
  tags text[] default '{}',
  team_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table color_palettes enable row level security;
drop policy if exists palettes_select on color_palettes;
create policy palettes_select on color_palettes for select using (user_id = auth.uid()::uuid or is_public = true);
drop policy if exists palettes_insert on color_palettes;
create policy palettes_insert on color_palettes for insert with check (user_id = auth.uid()::uuid);
drop policy if exists palettes_update on color_palettes;
create policy palettes_update on color_palettes for update using (user_id = auth.uid()::uuid);
drop policy if exists palettes_delete on color_palettes;
create policy palettes_delete on color_palettes for delete using (user_id = auth.uid()::uuid);
create index if not exists idx_palettes_user_id on color_palettes(user_id);

create table if not exists palette_likes (
  id uuid primary key default gen_random_uuid(),
  palette_id uuid not null references color_palettes(id) on delete cascade,
  user_id uuid not null default auth.uid()::uuid,
  created_at timestamptz default now(),
  unique (palette_id, user_id)
);
alter table palette_likes enable row level security;
drop policy if exists palette_likes_select on palette_likes;
create policy palette_likes_select on palette_likes for select using (true);
drop policy if exists palette_likes_insert on palette_likes;
create policy palette_likes_insert on palette_likes for insert with check (user_id = auth.uid()::uuid);
drop policy if exists palette_likes_delete on palette_likes;
create policy palette_likes_delete on palette_likes for delete using (user_id = auth.uid()::uuid);

-- ---------------------------------------------------------------------------
-- share_links (+ get_shared_resource)
-- ---------------------------------------------------------------------------
create table if not exists share_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()::uuid,
  resource_type text not null,
  resource_id uuid not null,
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now()
);
alter table share_links enable row level security;
drop policy if exists share_links_owner on share_links;
create policy share_links_owner on share_links for all using (owner_id = auth.uid()::uuid) with check (owner_id = auth.uid()::uuid);

create or replace function get_shared_resource(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = proj_jf0qdubnp0gi6yvc, pg_temp as $$
declare
  v_link share_links%rowtype;
  v_payload jsonb;
begin
  select * into v_link from share_links
  where token = p_token and revoked_at is null
    and (expires_at is null or expires_at > now());
  if v_link.id is null then
    return jsonb_build_object('success', false, 'error', 'Link not found, expired, or revoked');
  end if;

  case v_link.resource_type
    when 'analysis' then
      select to_jsonb(t) into v_payload from (
        select id, file_name, analysis_data, image_url, created_at
        from design_analyses where id = v_link.resource_id
      ) t;
    when 'palette' then
      select to_jsonb(t) into v_payload from (
        select id, name, colors, tags, created_at
        from color_palettes where id = v_link.resource_id
      ) t;
    when 'asset' then
      select to_jsonb(t) into v_payload from (
        select id, name, asset_type, file_url, thumbnail_url, file_format, file_size, created_at
        from design_assets where id = v_link.resource_id
      ) t;
    else
      v_payload := null;
  end case;

  if v_payload is null then
    return jsonb_build_object('success', false, 'error', 'Shared resource no longer exists');
  end if;
  return jsonb_build_object('success', true, 'resource_type', v_link.resource_type, 'resource', v_payload);
end;
$$;

-- ---------------------------------------------------------------------------
-- discount_codes
-- ---------------------------------------------------------------------------
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_percent integer,
  discount_amount integer,
  max_uses integer,
  current_uses integer default 0,
  is_active boolean default true,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table discount_codes enable row level security;
drop policy if exists discount_codes_admin on discount_codes;
create policy discount_codes_admin on discount_codes for all using (is_user_admin(auth.uid()::uuid)) with check (is_user_admin(auth.uid()::uuid));
drop policy if exists discount_codes_read_active on discount_codes;
create policy discount_codes_read_active on discount_codes for select using (is_active = true);

-- ---------------------------------------------------------------------------
-- error_logs
-- ---------------------------------------------------------------------------
create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid()::uuid,
  error_message text not null,
  error_stack text,
  context text not null,
  resolved boolean default false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz default now()
);
alter table error_logs enable row level security;
drop policy if exists error_logs_insert on error_logs;
create policy error_logs_insert on error_logs for insert with check (user_id = auth.uid()::uuid or user_id is null);
drop policy if exists error_logs_admin on error_logs;
create policy error_logs_admin on error_logs for select using (is_user_admin(auth.uid()::uuid));

-- ---------------------------------------------------------------------------
-- system_config
-- ---------------------------------------------------------------------------
create table if not exists system_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table system_config enable row level security;
drop policy if exists system_config_read on system_config;
create policy system_config_read on system_config for select using (true);
drop policy if exists system_config_admin on system_config;
create policy system_config_admin on system_config for all using (is_user_admin(auth.uid()::uuid)) with check (is_user_admin(auth.uid()::uuid));

-- ---------------------------------------------------------------------------
-- Stripe (billing)
-- ---------------------------------------------------------------------------
create table if not exists stripe_customers (
  id bigint primary key generated always as identity,
  user_id uuid not null unique default auth.uid()::uuid,
  customer_id text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
alter table stripe_customers enable row level security;
drop policy if exists stripe_customers_select on stripe_customers;
create policy stripe_customers_select on stripe_customers for select using (user_id = auth.uid()::uuid and deleted_at is null);

create table if not exists stripe_subscriptions (
  id bigint primary key generated always as identity,
  customer_id text not null unique,
  subscription_id text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean default false,
  payment_method_brand text,
  payment_method_last4 text,
  status stripe_subscription_status not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
alter table stripe_subscriptions enable row level security;
drop policy if exists stripe_subscriptions_select on stripe_subscriptions;
create policy stripe_subscriptions_select on stripe_subscriptions for select using (
  customer_id in (select customer_id from stripe_customers where user_id = auth.uid()::uuid and deleted_at is null)
  and deleted_at is null
);

create table if not exists stripe_orders (
  id bigint primary key generated always as identity,
  checkout_session_id text not null,
  payment_intent_id text not null,
  customer_id text not null,
  amount_subtotal bigint not null,
  amount_total bigint not null,
  currency text not null,
  payment_status text not null,
  status stripe_order_status not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
alter table stripe_orders enable row level security;
drop policy if exists stripe_orders_select on stripe_orders;
create policy stripe_orders_select on stripe_orders for select using (
  customer_id in (select customer_id from stripe_customers where user_id = auth.uid()::uuid and deleted_at is null)
  and deleted_at is null
);

-- Views used by the client (run with owner rights, filter by auth.uid() inside)
create or replace view stripe_user_subscriptions as
  select c.customer_id, s.subscription_id, s.status as subscription_status, s.price_id,
         s.current_period_start, s.current_period_end, s.cancel_at_period_end,
         s.payment_method_brand, s.payment_method_last4
  from stripe_customers c
  left join stripe_subscriptions s on s.customer_id = c.customer_id
  where c.user_id = auth.uid()::uuid and c.deleted_at is null;

create or replace view stripe_user_orders as
  select c.customer_id, o.id as order_id, o.checkout_session_id, o.payment_intent_id,
         o.amount_subtotal, o.amount_total, o.currency, o.payment_status, o.status as order_status,
         o.created_at as order_date
  from stripe_customers c
  left join stripe_orders o on o.customer_id = c.customer_id
  where c.user_id = auth.uid()::uuid and c.deleted_at is null;

-- ---------------------------------------------------------------------------
-- Asset vault / collections (storage-flagged, still used by the app)
-- ---------------------------------------------------------------------------
create table if not exists asset_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  name text not null,
  parent_folder_id uuid references asset_folders(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table asset_folders enable row level security;
drop policy if exists asset_folders_all on asset_folders;
create policy asset_folders_all on asset_folders for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

create table if not exists design_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  folder_id uuid references asset_folders(id) on delete set null,
  name text,
  asset_type text,
  file_url text,
  thumbnail_url text,
  file_format text,
  file_size bigint,
  storage_url text,
  file_name text,
  file_path text,
  file_type text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table design_assets enable row level security;
drop policy if exists design_assets_all on design_assets;
create policy design_assets_all on design_assets for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

create table if not exists design_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table design_collections enable row level security;
drop policy if exists design_collections_all on design_collections;
create policy design_collections_all on design_collections for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

create table if not exists design_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references design_collections(id) on delete cascade,
  analysis_id uuid,
  user_id uuid not null default auth.uid()::uuid,
  created_at timestamptz default now()
);
alter table design_collection_items enable row level security;
drop policy if exists design_collection_items_all on design_collection_items;
create policy design_collection_items_all on design_collection_items for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

create table if not exists design_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  analysis_id uuid,
  created_at timestamptz default now()
);
alter table design_favorites enable row level security;
drop policy if exists design_favorites_all on design_favorites;
create policy design_favorites_all on design_favorites for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

create table if not exists design_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  analysis_id uuid,
  tag text not null,
  created_at timestamptz default now()
);
alter table design_tags enable row level security;
drop policy if exists design_tags_all on design_tags;
create policy design_tags_all on design_tags for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

create or replace function get_storage_usage()
returns jsonb language sql stable security definer set search_path = proj_jf0qdubnp0gi6yvc as $$
  select jsonb_build_object(
    'total_bytes', coalesce(sum(file_size), 0),
    'file_count', count(*)
  )
  from design_assets where user_id = auth.uid()::uuid;
$$;

-- ---------------------------------------------------------------------------
-- user_oauth_connections (linked provider accounts; auth-coupled)
-- ---------------------------------------------------------------------------
create table if not exists user_oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()::uuid,
  provider text not null,
  provider_account_id text,
  provider_email text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, provider)
);
alter table user_oauth_connections enable row level security;
drop policy if exists user_oauth_connections_all on user_oauth_connections;
create policy user_oauth_connections_all on user_oauth_connections for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);

-- ---------------------------------------------------------------------------
-- profiles (compat view over users; username lookups + public sharing)
-- ---------------------------------------------------------------------------
create or replace view profiles as
  select u.id,
         u.username,
         u.email,
         is_user_admin(u.id) as is_admin,
         true as is_verified,
         case when u.is_pro_subscriber then 'pro' else 'free' end as subscription_tier,
         u.created_at,
         u.updated_at
  from users u;

-- ---------------------------------------------------------------------------
-- Username helpers (anon-callable, SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function get_email_for_username(p_username text)
returns text language sql stable security definer set search_path = proj_jf0qdubnp0gi6yvc, pg_temp as $$
  select email from users where lower(username) = lower(trim(p_username)) limit 1;
$$;

create or replace function is_username_available(p_username text)
returns boolean language sql stable security definer set search_path = proj_jf0qdubnp0gi6yvc, pg_temp as $$
  select not exists (select 1 from users where lower(username) = lower(trim(p_username)));
$$;
