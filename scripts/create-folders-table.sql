-- Create folders table for organizing assets
CREATE TABLE IF NOT EXISTS asset_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES asset_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id column to design_assets if it doesn't exist
ALTER TABLE design_assets ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_folders_user_id ON asset_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_parent_id ON asset_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_design_assets_folder_id ON design_assets(folder_id);
