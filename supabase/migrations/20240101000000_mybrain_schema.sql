-- MyBrain schema migration
-- Enables: profiles, links, quotes, concepts, projects, media, books, book_content
-- Security: RLS on all tables; book content locked to admins; search via security-definer fn

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique not null,
  avatar_url  text,
  bio         text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  theme       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- Anyone can read profiles (for public pages)
create policy "profiles_public_read" on profiles
  for select using (true);

-- Users can update their own profile
create policy "profiles_own_update" on profiles
  for update using (auth.uid() = id);

-- Users can insert their own profile (triggered on signup)
create policy "profiles_own_insert" on profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- LINKS
-- ============================================================
create table if not exists links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  label       text not null,
  url         text not null,
  icon        text,
  is_public   boolean not null default false,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table links enable row level security;

-- Owner can do everything
create policy "links_own_all" on links
  for all using (auth.uid() = user_id);

-- Public: anyone can read public links
create policy "links_public_read" on links
  for select using (is_public = true);

-- ============================================================
-- BOOKS (metadata only — content is in book_content)
-- ============================================================
create table if not exists books (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  author       text not null,
  release_date date,
  cover_url    text,
  tags         text[] not null default '{}',
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table books enable row level security;

-- Anyone can read book metadata
create policy "books_public_read" on books
  for select using (true);

-- Only admins can insert/update/delete books
create policy "books_admin_write" on books
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- ============================================================
-- BOOK CONTENT (full text — NEVER exposed to non-admins)
-- ============================================================
create table if not exists book_content (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references books(id) on delete cascade unique,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table book_content enable row level security;

-- ONLY admins can access book_content (enforced at DB level)
create policy "book_content_admin_only" on book_content
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- ============================================================
-- QUOTES
-- ============================================================
create table if not exists quotes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  text       text not null,
  author     text,
  book_id    uuid references books(id) on delete set null,
  tags       text[] not null default '{}',
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table quotes enable row level security;

create policy "quotes_own_all" on quotes
  for all using (auth.uid() = user_id);

create policy "quotes_public_read" on quotes
  for select using (is_public = true);

-- ============================================================
-- CONCEPTS
-- ============================================================
create table if not exists concepts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  body       text,
  tags       text[] not null default '{}',
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table concepts enable row level security;

create policy "concepts_own_all" on concepts
  for all using (auth.uid() = user_id);

create policy "concepts_public_read" on concepts
  for select using (is_public = true);

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'active' check (status in ('active', 'complete', 'paused')),
  url         text,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table projects enable row level security;

create policy "projects_own_all" on projects
  for all using (auth.uid() = user_id);

create policy "projects_public_read" on projects
  for select using (is_public = true);

-- ============================================================
-- MEDIA
-- ============================================================
create table if not exists media (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('game', 'book', 'show', 'music')),
  status     text,
  cover_url  text,
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table media enable row level security;

create policy "media_own_all" on media
  for all using (auth.uid() = user_id);

create policy "media_public_read" on media
  for select using (is_public = true);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at   before update on profiles   for each row execute function update_updated_at();
create trigger trg_links_updated_at      before update on links      for each row execute function update_updated_at();
create trigger trg_books_updated_at      before update on books      for each row execute function update_updated_at();
create trigger trg_quotes_updated_at     before update on quotes     for each row execute function update_updated_at();
create trigger trg_concepts_updated_at   before update on concepts   for each row execute function update_updated_at();
create trigger trg_projects_updated_at   before update on projects   for each row execute function update_updated_at();
create trigger trg_media_updated_at      before update on media      for each row execute function update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, role, theme)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    'user',
    '{}'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FULL-TEXT SEARCH ACROSS BOOK CONTENT (security-definer)
-- Returns snippets only — never the full content
-- Accessible to anyone (anon + authenticated)
-- ============================================================
create or replace function search_book_quotes(search_term text)
returns table (
  book_id     uuid,
  book_title  text,
  book_author text,
  snippet     text
)
language sql
security definer       -- runs as owner, bypasses RLS safely
stable
set search_path = public
as $$
  select
    b.id,
    b.title,
    b.author,
    ts_headline(
      'english',
      bc.content,
      plainto_tsquery('english', search_term),
      'MaxWords=60, MinWords=20, StartSel=<mark>, StopSel=</mark>, ShortWord=3'
    ) as snippet
  from books b
  join book_content bc on bc.book_id = b.id
  where
    to_tsvector('english', bc.content) @@ plainto_tsquery('english', search_term)
  limit 30;
$$;

-- Grant execute to all roles so anon users can search
grant execute on function search_book_quotes(text) to anon, authenticated;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_links_user_id      on links(user_id);
create index if not exists idx_links_public        on links(user_id, is_public);
create index if not exists idx_quotes_user_id      on quotes(user_id);
create index if not exists idx_quotes_public       on quotes(user_id, is_public);
create index if not exists idx_concepts_user_id    on concepts(user_id);
create index if not exists idx_concepts_public     on concepts(user_id, is_public);
create index if not exists idx_projects_user_id    on projects(user_id);
create index if not exists idx_projects_public     on projects(user_id, is_public);
create index if not exists idx_media_user_id       on media(user_id);
create index if not exists idx_media_public        on media(user_id, is_public);
create index if not exists idx_book_content_fts
  on book_content using gin(to_tsvector('english', content));
create index if not exists idx_profiles_username   on profiles(username);
