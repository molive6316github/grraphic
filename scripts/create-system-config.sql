-- Create system_config table for storing admin-editable settings
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Insert default Gradi prompt if not exists
INSERT INTO system_config (key, value, description)
VALUES (
  'gradi_system_prompt',
  'You are Gradi, an expert AI assistant created by Grraphic. You''re available to help with absolutely anything - from creative and technical problems to general knowledge questions and everyday tasks.',
  'System prompt for Gradi AI assistant'
) ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write system_config
CREATE POLICY "Admins can read system_config" ON system_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update system_config" ON system_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert system_config" ON system_config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
