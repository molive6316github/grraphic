/*
  # Add Three Micro-SaaS Products

  ## New Products
  
  ### 1. PaletteX - Color Palette Generator & Manager
  Advanced color palette creation, extraction, and management tool
  
  ### 2. MockupStudio - Design Mockup Generator
  Create realistic mockups of designs in various contexts
  
  ### 3. AssetVault - Design Asset Library
  Store, organize, and manage design assets
  
  ## New Tables

  ### color_palettes (PaletteX)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `name` (text) - Palette name
  - `colors` (jsonb) - Array of color objects with hex, rgb, hsl
  - `source_image_url` (text, nullable) - Original image if extracted
  - `is_public` (boolean) - Whether palette is publicly shared
  - `likes_count` (integer) - Number of likes
  - `tags` (text[]) - Tags for searchability
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### palette_likes (PaletteX)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `palette_id` (uuid, foreign key to color_palettes)
  - `created_at` (timestamptz)

  ### mockup_projects (MockupStudio)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `title` (text) - Project title
  - `design_url` (text) - URL to the design
  - `mockup_type` (text) - phone, laptop, billboard, etc
  - `mockup_data` (jsonb) - Configuration and settings
  - `rendered_url` (text, nullable) - Final rendered mockup
  - `is_public` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### design_assets (AssetVault)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `name` (text) - Asset name
  - `description` (text) - Asset description
  - `asset_type` (text) - icon, image, vector, font, template
  - `file_url` (text) - URL to the asset file
  - `thumbnail_url` (text, nullable) - Preview thumbnail
  - `file_size` (bigint) - File size in bytes
  - `file_format` (text) - png, svg, jpg, etc
  - `category` (text) - Category/folder
  - `tags` (text[]) - Tags for search
  - `metadata` (jsonb) - Additional metadata
  - `is_public` (boolean)
  - `download_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### asset_collections (AssetVault)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `name` (text) - Collection name
  - `description` (text)
  - `asset_ids` (uuid[]) - Array of asset IDs
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public viewing of public items
*/

-- Create color_palettes table (PaletteX)
CREATE TABLE IF NOT EXISTS color_palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_image_url text,
  is_public boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE color_palettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own palettes"
  ON color_palettes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Anyone can view public palettes"
  ON color_palettes FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Users can create own palettes"
  ON color_palettes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own palettes"
  ON color_palettes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own palettes"
  ON color_palettes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create palette_likes table (PaletteX)
CREATE TABLE IF NOT EXISTS palette_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  palette_id uuid REFERENCES color_palettes(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, palette_id)
);

ALTER TABLE palette_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON palette_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own likes"
  ON palette_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON palette_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create mockup_projects table (MockupStudio)
CREATE TABLE IF NOT EXISTS mockup_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'Untitled Mockup',
  design_url text NOT NULL,
  mockup_type text NOT NULL,
  mockup_data jsonb DEFAULT '{}'::jsonb,
  rendered_url text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mockup_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mockups"
  ON mockup_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Anyone can view public mockups"
  ON mockup_projects FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Users can create own mockups"
  ON mockup_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mockups"
  ON mockup_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mockups"
  ON mockup_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create design_assets table (AssetVault)
CREATE TABLE IF NOT EXISTS design_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  asset_type text NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  file_size bigint DEFAULT 0,
  file_format text NOT NULL,
  category text DEFAULT 'uncategorized',
  tags text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE design_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON design_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Anyone can view public assets"
  ON design_assets FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Users can create own assets"
  ON design_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON design_assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON design_assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create asset_collections table (AssetVault)
CREATE TABLE IF NOT EXISTS asset_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  asset_ids uuid[] DEFAULT ARRAY[]::uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE asset_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asset collections"
  ON asset_collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own asset collections"
  ON asset_collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own asset collections"
  ON asset_collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own asset collections"
  ON asset_collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_color_palettes_user_id ON color_palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_color_palettes_is_public ON color_palettes(is_public);
CREATE INDEX IF NOT EXISTS idx_color_palettes_tags ON color_palettes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_palette_likes_palette_id ON palette_likes(palette_id);
CREATE INDEX IF NOT EXISTS idx_mockup_projects_user_id ON mockup_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_mockup_projects_is_public ON mockup_projects(is_public);
CREATE INDEX IF NOT EXISTS idx_design_assets_user_id ON design_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_design_assets_asset_type ON design_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_design_assets_category ON design_assets(category);
CREATE INDEX IF NOT EXISTS idx_design_assets_tags ON design_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_asset_collections_user_id ON asset_collections(user_id);