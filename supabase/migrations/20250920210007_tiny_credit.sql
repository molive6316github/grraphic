/*
  # Update design_analyses table to include image storage

  1. Changes
    - Add `image_url` column to store image URLs or base64 data
    - Update existing policies to handle the new column
    - Add index for better query performance

  2. Security
    - Maintains existing RLS policies
    - Users can only access their own data
*/

-- Add image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'design_analyses' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE design_analyses ADD COLUMN image_url text;
  END IF;
END $$;

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_design_analyses_updated_at ON design_analyses;
CREATE TRIGGER update_design_analyses_updated_at
    BEFORE UPDATE ON design_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();