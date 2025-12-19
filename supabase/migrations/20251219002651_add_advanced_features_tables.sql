/*
  # Add Advanced Features Tables

  ## New Tables

  ### design_collections
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `name` (text) - Collection name
  - `description` (text, nullable) - Collection description
  - `color` (text) - Collection color for UI
  - `icon` (text) - Icon name for UI
  - `is_default` (boolean) - Whether this is the default collection
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### design_collection_items
  - `id` (uuid, primary key)
  - `collection_id` (uuid, foreign key to design_collections)
  - `analysis_id` (uuid, foreign key to design_analyses)
  - `added_at` (timestamptz)

  ### design_favorites
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `analysis_id` (uuid, foreign key to design_analyses)
  - `created_at` (timestamptz)

  ### design_tags
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `analysis_id` (uuid, foreign key to design_analyses)
  - `tag_name` (text) - Tag name
  - `created_at` (timestamptz)

  ### design_comparisons
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `title` (text) - Comparison title
  - `analysis_ids` (uuid[]) - Array of analysis IDs being compared
  - `notes` (text, nullable) - Comparison notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### user_preferences
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users, unique)
  - `analysis_focus` (jsonb) - Which aspects to focus on
  - `export_format` (text) - Default export format
  - `auto_save` (boolean) - Auto-save analyses
  - `notifications_enabled` (boolean)
  - `theme_preference` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### design_exports
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `analysis_id` (uuid, foreign key to design_analyses)
  - `export_type` (text) - pdf, png, json, etc
  - `export_url` (text, nullable) - URL to exported file
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
*/

-- Create design_collections table
CREATE TABLE IF NOT EXISTS design_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3b82f6',
  icon text DEFAULT 'Folder',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE design_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON design_collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections"
  ON design_collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON design_collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON design_collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create design_collection_items table
CREATE TABLE IF NOT EXISTS design_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES design_collections(id) ON DELETE CASCADE NOT NULL,
  analysis_id uuid REFERENCES design_analyses(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, analysis_id)
);

ALTER TABLE design_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in own collections"
  ON design_collection_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM design_collections
      WHERE design_collections.id = design_collection_items.collection_id
      AND design_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to own collections"
  ON design_collection_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM design_collections
      WHERE design_collections.id = design_collection_items.collection_id
      AND design_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from own collections"
  ON design_collection_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM design_collections
      WHERE design_collections.id = design_collection_items.collection_id
      AND design_collections.user_id = auth.uid()
    )
  );

-- Create design_favorites table
CREATE TABLE IF NOT EXISTS design_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id uuid REFERENCES design_analyses(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, analysis_id)
);

ALTER TABLE design_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON design_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
  ON design_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON design_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create design_tags table
CREATE TABLE IF NOT EXISTS design_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id uuid REFERENCES design_analyses(id) ON DELETE CASCADE NOT NULL,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, analysis_id, tag_name)
);

ALTER TABLE design_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON design_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
  ON design_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON design_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create design_comparisons table
CREATE TABLE IF NOT EXISTS design_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'Untitled Comparison',
  analysis_ids uuid[] NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE design_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comparisons"
  ON design_comparisons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own comparisons"
  ON design_comparisons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comparisons"
  ON design_comparisons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparisons"
  ON design_comparisons FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  analysis_focus jsonb DEFAULT '{"typography": true, "color": true, "composition": true, "balance": true, "contrast": true}'::jsonb,
  export_format text DEFAULT 'png',
  auto_save boolean DEFAULT true,
  notifications_enabled boolean DEFAULT true,
  theme_preference text DEFAULT 'system',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create design_exports table
CREATE TABLE IF NOT EXISTS design_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id uuid REFERENCES design_analyses(id) ON DELETE CASCADE NOT NULL,
  export_type text NOT NULL,
  export_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE design_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON design_exports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exports"
  ON design_exports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
  ON design_exports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_design_collections_user_id ON design_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_design_collection_items_collection_id ON design_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_design_collection_items_analysis_id ON design_collection_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_design_favorites_user_id ON design_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_design_favorites_analysis_id ON design_favorites(analysis_id);
CREATE INDEX IF NOT EXISTS idx_design_tags_user_id ON design_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_design_tags_analysis_id ON design_tags(analysis_id);
CREATE INDEX IF NOT EXISTS idx_design_tags_tag_name ON design_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_design_comparisons_user_id ON design_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_design_exports_user_id ON design_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_design_exports_analysis_id ON design_exports(analysis_id);