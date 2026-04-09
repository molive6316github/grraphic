-- Grraphic Database Schema - Complete Rebuild
-- This migration creates all tables for Grraphic with proper RLS policies
-- Admin user: maxoliverorg will be marked as admin on signup

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text,
  is_admin boolean default false,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Users can view all profiles (for public sharing)
create policy "profiles_select_all" on public.profiles for select using (true);

-- Users can insert their own profile
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Only admins can update is_admin status
create policy "profiles_update_admin_only" on public.profiles for update 
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ============================================================================
-- 2. DESIGN ANALYSES TABLE
-- ============================================================================
create table if not exists public.design_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  analysis_data jsonb not null,
  image_url text,
  is_public boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.design_analyses enable row level security;

-- Users can view their own analyses
create policy "analyses_select_own" on public.design_analyses for select 
  using (auth.uid() = user_id or is_public = true);

-- Users can insert their own analyses
create policy "analyses_insert_own" on public.design_analyses for insert 
  with check (auth.uid() = user_id);

-- Users can update their own analyses
create policy "analyses_update_own" on public.design_analyses for update 
  using (auth.uid() = user_id);

-- Users can delete their own analyses
create policy "analyses_delete_own" on public.design_analyses for delete 
  using (auth.uid() = user_id);

-- ============================================================================
-- 3. API KEYS TABLE
-- ============================================================================
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  scopes text[] default array['analysis', 'gradi', 'site-designer'],
  is_active boolean default true,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.api_keys enable row level security;

-- Users can view their own API keys
create policy "api_keys_select_own" on public.api_keys for select 
  using (auth.uid() = user_id);

-- Users can insert their own API keys
create policy "api_keys_insert_own" on public.api_keys for insert 
  with check (auth.uid() = user_id);

-- Users can update their own API keys
create policy "api_keys_update_own" on public.api_keys for update 
  using (auth.uid() = user_id);

-- Users can delete their own API keys
create policy "api_keys_delete_own" on public.api_keys for delete 
  using (auth.uid() = user_id);

-- ============================================================================
-- 4. API USAGE TABLE
-- ============================================================================
create table if not exists public.api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  endpoint text not null,
  method text not null,
  usage_date date not null,
  request_count integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.api_usage enable row level security;

-- Users can view their own usage
create policy "api_usage_select_own" on public.api_usage for select 
  using (auth.uid() = user_id);

-- Users can insert their own usage (only via Edge Function)
create policy "api_usage_insert_own" on public.api_usage for insert 
  with check (auth.uid() = user_id);

-- ============================================================================
-- 5. ASSET FOLDERS TABLE
-- ============================================================================
create table if not exists public.asset_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_folder_id uuid references public.asset_folders(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, parent_folder_id, name)
);

alter table public.asset_folders enable row level security;

-- Users can view their own folders
create policy "folders_select_own" on public.asset_folders for select 
  using (auth.uid() = user_id);

-- Users can insert their own folders
create policy "folders_insert_own" on public.asset_folders for insert 
  with check (auth.uid() = user_id);

-- Users can update their own folders
create policy "folders_update_own" on public.asset_folders for update 
  using (auth.uid() = user_id);

-- Users can delete their own folders
create policy "folders_delete_own" on public.asset_folders for delete 
  using (auth.uid() = user_id);

-- ============================================================================
-- 6. DESIGN ASSETS TABLE
-- ============================================================================
create table if not exists public.design_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.asset_folders(id) on delete set null,
  file_name text not null,
  file_path text not null unique,
  file_size integer,
  file_type text,
  storage_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.design_assets enable row level security;

-- Users can view their own assets
create policy "assets_select_own" on public.design_assets for select 
  using (auth.uid() = user_id);

-- Users can insert their own assets
create policy "assets_insert_own" on public.design_assets for insert 
  with check (auth.uid() = user_id);

-- Users can delete their own assets
create policy "assets_delete_own" on public.design_assets for delete 
  using (auth.uid() = user_id);

-- ============================================================================
-- 7. GRADI CONVERSATIONS TABLE
-- ============================================================================
create table if not exists public.gradi_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New Conversation',
  messages jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.gradi_conversations enable row level security;

-- Users can view their own conversations
create policy "gradi_select_own" on public.gradi_conversations for select 
  using (auth.uid() = user_id);

-- Users can insert their own conversations
create policy "gradi_insert_own" on public.gradi_conversations for insert 
  with check (auth.uid() = user_id);

-- Users can update their own conversations
create policy "gradi_update_own" on public.gradi_conversations for update 
  using (auth.uid() = user_id);

-- Users can delete their own conversations
create policy "gradi_delete_own" on public.gradi_conversations for delete 
  using (auth.uid() = user_id);

-- ============================================================================
-- 8. TRIGGER: Auto-create profile and set admin on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_user boolean;
begin
  -- Check if username is 'maxoliverorg' - if so, mark as admin
  is_admin_user := (new.raw_user_meta_data ->> 'username' = 'maxoliverorg');
  
  insert into public.profiles (id, username, email, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', new.email),
    new.email,
    is_admin_user
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- 9. INDEXES for Performance
-- ============================================================================
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_is_admin on public.profiles(is_admin);
create index if not exists idx_analyses_user_id on public.design_analyses(user_id);
create index if not exists idx_analyses_is_public on public.design_analyses(is_public);
create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_keys_is_active on public.api_keys(is_active);
create index if not exists idx_api_usage_user_id on public.api_usage(user_id);
create index if not exists idx_api_usage_usage_date on public.api_usage(usage_date);
create index if not exists idx_assets_user_id on public.design_assets(user_id);
create index if not exists idx_gradi_user_id on public.gradi_conversations(user_id);
