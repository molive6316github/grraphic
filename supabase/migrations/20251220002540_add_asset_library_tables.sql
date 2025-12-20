/*
  # Add Asset Library Tables

  ## New Tables

  ### mockup_assets
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `name` (text) - Asset filename
  - `type` (text) - Asset type (image, video, audio, font)
  - `url` (text) - Public URL to asset
  - `thumbnail_url` (text, nullable) - Thumbnail for videos
  - `size` (bigint) - File size in bytes
  - `width` (integer, nullable) - Image/video width
  - `height` (integer, nullable) - Image/video height
  - `duration` (real, nullable) - Video/audio duration in seconds
  - `folder_id` (uuid, nullable, foreign key to mockup_folders)
  - `tags` (text[]) - Search tags
  - `is_favorite` (boolean) - Favorited by user
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### mockup_folders
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `name` (text) - Folder name
  - `color` (text) - UI color
  - `parent_id` (uuid, nullable, foreign key to mockup_folders)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own assets and folders
  - Create storage bucket for mockup assets
*/

-- Create mockup_folders table
CREATE TABLE IF NOT EXISTS mockup_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  parent_id uuid REFERENCES mockup_folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mockup_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON mockup_folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON mockup_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON mockup_folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON mockup_folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create mockup_assets table
CREATE TABLE IF NOT EXISTS mockup_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  thumbnail_url text,
  size bigint NOT NULL DEFAULT 0,
  width integer,
  height integer,
  duration real,
  folder_id uuid REFERENCES mockup_folders(id) ON DELETE SET NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mockup_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON mockup_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON mockup_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON mockup_assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON mockup_assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mockup_assets_user_id ON mockup_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_mockup_assets_folder_id ON mockup_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_mockup_assets_type ON mockup_assets(type);
CREATE INDEX IF NOT EXISTS idx_mockup_assets_is_favorite ON mockup_assets(is_favorite);
CREATE INDEX IF NOT EXISTS idx_mockup_assets_created_at ON mockup_assets(created_at);
CREATE INDEX IF NOT EXISTS idx_mockup_folders_user_id ON mockup_folders(user_id);
