/*
  # Create Boxt Design Tables

  1. New Tables
    - `boxt_designs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - Design name
      - `thumbnail` (text) - Preview image URL
      - `width` (integer) - Canvas width
      - `height` (integer) - Canvas height
      - `data` (jsonb) - Full design data (layers, elements, etc.)
      - `is_template` (boolean) - Whether this is a template
      - `is_public` (boolean) - Whether publicly shareable
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `boxt_templates`
      - `id` (uuid, primary key)
      - `title` (text) - Template name
      - `category` (text) - Template category (social, presentation, etc.)
      - `thumbnail` (text) - Preview image
      - `width` (integer)
      - `height` (integer)
      - `data` (jsonb) - Template design data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own designs
    - Templates are public for all users

  3. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for sorting
    - Index on is_template for filtering
*/

-- Create boxt_designs table
CREATE TABLE IF NOT EXISTS boxt_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Design',
  thumbnail text,
  width integer NOT NULL DEFAULT 1920,
  height integer NOT NULL DEFAULT 1080,
  data jsonb DEFAULT '{}'::jsonb,
  is_template boolean DEFAULT false,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create boxt_templates table
CREATE TABLE IF NOT EXISTS boxt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  thumbnail text,
  width integer NOT NULL DEFAULT 1920,
  height integer NOT NULL DEFAULT 1080,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE boxt_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxt_templates ENABLE ROW LEVEL SECURITY;

-- Policies for boxt_designs
CREATE POLICY "Users can view own designs"
  ON boxt_designs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own designs"
  ON boxt_designs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs"
  ON boxt_designs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own designs"
  ON boxt_designs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for boxt_templates (public read-only)
CREATE POLICY "Anyone can view templates"
  ON boxt_templates FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boxt_designs_user_id ON boxt_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_boxt_designs_created_at ON boxt_designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boxt_designs_is_template ON boxt_designs(is_template);
CREATE INDEX IF NOT EXISTS idx_boxt_templates_category ON boxt_templates(category);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_boxt_design_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on boxt_designs
DROP TRIGGER IF EXISTS update_boxt_designs_updated_at ON boxt_designs;
CREATE TRIGGER update_boxt_designs_updated_at
  BEFORE UPDATE ON boxt_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_boxt_design_updated_at();

-- Insert some starter templates
INSERT INTO boxt_templates (title, category, width, height, data, thumbnail) VALUES
('Social Media Post', 'social', 1080, 1080, '{"background": "#ffffff", "elements": []}'::jsonb, null),
('Instagram Story', 'social', 1080, 1920, '{"background": "#ffffff", "elements": []}'::jsonb, null),
('Presentation Slide', 'presentation', 1920, 1080, '{"background": "#ffffff", "elements": []}'::jsonb, null),
('Business Card', 'print', 1050, 600, '{"background": "#ffffff", "elements": []}'::jsonb, null),
('YouTube Thumbnail', 'social', 1280, 720, '{"background": "#ffffff", "elements": []}'::jsonb, null),
('Blank Canvas', 'general', 1920, 1080, '{"background": "#ffffff", "elements": []}'::jsonb, null)
ON CONFLICT DO NOTHING;
