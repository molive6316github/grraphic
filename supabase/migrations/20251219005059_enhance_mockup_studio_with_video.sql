/*
  # Enhance MockupStudio with Video Support

  ## Updates to mockup_projects table
  
  1. Schema Changes
    - Add `category` field for organizing mockup types (device, apparel, print, video, social)
    - Add `is_video` boolean to distinguish video vs static mockups
    - Add `video_duration` for video mockups
    - Add `template_data` jsonb for storing template-specific settings
    - Add `preview_url` for storing preview thumbnails
    - Add `export_settings` jsonb for quality, format, resolution settings

  2. New Table: mockup_templates
    - Pre-defined template library with categories
    - Store template metadata, preview images, and configuration

  ## Security
  - Update existing RLS policies to work with new fields
  - No policy changes needed as field additions are backward compatible
*/

-- Add new columns to mockup_projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_projects' AND column_name = 'category'
  ) THEN
    ALTER TABLE mockup_projects ADD COLUMN category text DEFAULT 'device';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_projects' AND column_name = 'is_video'
  ) THEN
    ALTER TABLE mockup_projects ADD COLUMN is_video boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_projects' AND column_name = 'video_duration'
  ) THEN
    ALTER TABLE mockup_projects ADD COLUMN video_duration integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_projects' AND column_name = 'template_data'
  ) THEN
    ALTER TABLE mockup_projects ADD COLUMN template_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_projects' AND column_name = 'preview_url'
  ) THEN
    ALTER TABLE mockup_projects ADD COLUMN preview_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_projects' AND column_name = 'export_settings'
  ) THEN
    ALTER TABLE mockup_projects ADD COLUMN export_settings jsonb DEFAULT '{"quality": "high", "format": "png", "resolution": "1920x1080"}'::jsonb;
  END IF;
END $$;

-- Create mockup_templates table for template library
CREATE TABLE IF NOT EXISTS mockup_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  is_video boolean DEFAULT false,
  preview_image_url text,
  description text,
  dimensions jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  is_premium boolean DEFAULT false,
  tags text[] DEFAULT ARRAY[]::text[],
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mockup_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view mockup templates (public catalog)
CREATE POLICY "Anyone can view mockup templates"
  ON mockup_templates FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mockup_projects_category ON mockup_projects(category);
CREATE INDEX IF NOT EXISTS idx_mockup_projects_is_video ON mockup_projects(is_video);
CREATE INDEX IF NOT EXISTS idx_mockup_templates_category ON mockup_templates(category);
CREATE INDEX IF NOT EXISTS idx_mockup_templates_tags ON mockup_templates USING GIN(tags);

-- Insert default mockup templates
INSERT INTO mockup_templates (name, category, subcategory, is_video, description, dimensions, tags) VALUES
  -- Mobile Devices
  ('iPhone 15 Pro Max', 'device', 'mobile', false, 'Latest iPhone with Dynamic Island', '{"width": 430, "height": 932, "borderRadius": 55}', ARRAY['phone', 'ios', 'apple', 'mobile']),
  ('iPhone 15 Pro', 'device', 'mobile', false, 'iPhone 15 Pro standard size', '{"width": 393, "height": 852, "borderRadius": 55}', ARRAY['phone', 'ios', 'apple', 'mobile']),
  ('Samsung Galaxy S24', 'device', 'mobile', false, 'Latest Samsung flagship phone', '{"width": 412, "height": 915, "borderRadius": 40}', ARRAY['phone', 'android', 'samsung', 'mobile']),
  ('Google Pixel 8 Pro', 'device', 'mobile', false, 'Google Pixel flagship', '{"width": 412, "height": 892, "borderRadius": 45}', ARRAY['phone', 'android', 'google', 'mobile']),
  
  -- Tablets
  ('iPad Pro 13"', 'device', 'tablet', false, 'Largest iPad Pro', '{"width": 1032, "height": 1376, "borderRadius": 35}', ARRAY['tablet', 'ipad', 'apple', 'ios']),
  ('iPad Air', 'device', 'tablet', false, 'iPad Air 11"', '{"width": 820, "height": 1180, "borderRadius": 30}', ARRAY['tablet', 'ipad', 'apple', 'ios']),
  ('Samsung Galaxy Tab S9', 'device', 'tablet', false, 'Premium Android tablet', '{"width": 1848, "height": 2960, "borderRadius": 25}', ARRAY['tablet', 'android', 'samsung']),
  
  -- Laptops
  ('MacBook Pro 16"', 'device', 'laptop', false, 'MacBook Pro M3 Max', '{"width": 1728, "height": 1117, "borderRadius": 12}', ARRAY['laptop', 'macbook', 'apple', 'computer']),
  ('MacBook Air 13"', 'device', 'laptop', false, 'Thin and light MacBook', '{"width": 1440, "height": 900, "borderRadius": 12}', ARRAY['laptop', 'macbook', 'apple', 'computer']),
  ('Dell XPS 15', 'device', 'laptop', false, 'Premium Windows laptop', '{"width": 1920, "height": 1200, "borderRadius": 8}', ARRAY['laptop', 'windows', 'dell', 'computer']),
  
  -- Desktop & Displays
  ('iMac 24"', 'device', 'desktop', false, 'Colorful all-in-one Mac', '{"width": 2560, "height": 1440, "borderRadius": 8}', ARRAY['desktop', 'imac', 'apple', 'monitor']),
  ('Pro Display XDR', 'device', 'desktop', false, 'Professional 6K display', '{"width": 3008, "height": 1692, "borderRadius": 5}', ARRAY['desktop', 'monitor', 'display', 'apple']),
  ('Ultrawide Monitor', 'device', 'desktop', false, '34" Ultrawide display', '{"width": 3440, "height": 1440, "borderRadius": 10}', ARRAY['desktop', 'monitor', 'display', 'ultrawide']),
  
  -- Wearables
  ('Apple Watch Ultra', 'device', 'wearable', false, 'Premium Apple Watch', '{"width": 410, "height": 502, "borderRadius": 55}', ARRAY['watch', 'apple', 'wearable', 'smartwatch']),
  ('Apple Watch Series 9', 'device', 'wearable', false, 'Latest Apple Watch', '{"width": 368, "height": 448, "borderRadius": 45}', ARRAY['watch', 'apple', 'wearable', 'smartwatch']),
  
  -- Apparel
  ('T-Shirt Front', 'apparel', 'tshirt', false, 'Classic crew neck t-shirt front', '{"width": 800, "height": 1000, "printArea": {"x": 150, "y": 200, "w": 500, "h": 500}}', ARRAY['tshirt', 'clothing', 'apparel', 'fashion']),
  ('Hoodie Front', 'apparel', 'hoodie', false, 'Pullover hoodie front view', '{"width": 900, "height": 1200, "printArea": {"x": 200, "y": 300, "w": 500, "h": 500}}', ARRAY['hoodie', 'clothing', 'apparel', 'fashion']),
  ('Coffee Mug', 'apparel', 'merchandise', false, 'White ceramic coffee mug', '{"width": 800, "height": 800, "printArea": {"x": 150, "y": 200, "w": 500, "h": 400}}', ARRAY['mug', 'merchandise', 'drinkware']),
  ('Tote Bag', 'apparel', 'bag', false, 'Canvas tote bag', '{"width": 800, "height": 1000, "printArea": {"x": 150, "y": 250, "w": 500, "h": 500}}', ARRAY['bag', 'merchandise', 'apparel']),
  
  -- Print & Outdoor
  ('Billboard Landscape', 'print', 'outdoor', false, 'Large outdoor billboard', '{"width": 1920, "height": 1080, "borderRadius": 0}', ARRAY['billboard', 'outdoor', 'advertising', 'large']),
  ('Poster A3', 'print', 'poster', false, 'A3 size poster', '{"width": 1754, "height": 2480, "borderRadius": 0}', ARRAY['poster', 'print', 'wall', 'art']),
  ('Business Card', 'print', 'stationery', false, 'Standard business card', '{"width": 1050, "height": 600, "borderRadius": 20}', ARRAY['business-card', 'print', 'stationery', 'card']),
  ('Flyer A5', 'print', 'marketing', false, 'A5 marketing flyer', '{"width": 1748, "height": 2480, "borderRadius": 0}', ARRAY['flyer', 'print', 'marketing']),
  
  -- Video Templates
  ('Instagram Reel', 'video', 'social', true, 'Vertical video for Instagram', '{"width": 1080, "height": 1920, "duration": 15}', ARRAY['instagram', 'video', 'social', 'vertical']),
  ('TikTok Video', 'video', 'social', true, 'TikTok vertical video', '{"width": 1080, "height": 1920, "duration": 30}', ARRAY['tiktok', 'video', 'social', 'vertical']),
  ('YouTube Video', 'video', 'social', true, 'Horizontal YouTube video', '{"width": 1920, "height": 1080, "duration": 60}', ARRAY['youtube', 'video', 'social', 'horizontal']),
  ('YouTube Short', 'video', 'social', true, 'Vertical short-form video', '{"width": 1080, "height": 1920, "duration": 30}', ARRAY['youtube', 'video', 'social', 'shorts', 'vertical']),
  ('Logo Animation', 'video', 'branding', true, 'Animated logo reveal', '{"width": 1920, "height": 1080, "duration": 5}', ARRAY['logo', 'animation', 'branding', 'intro']),
  ('Product Demo', 'video', 'marketing', true, 'Product showcase video', '{"width": 1920, "height": 1080, "duration": 30}', ARRAY['product', 'demo', 'marketing', 'commercial']),
  ('Text Animation', 'video', 'content', true, 'Animated text overlay', '{"width": 1920, "height": 1080, "duration": 10}', ARRAY['text', 'animation', 'typography', 'kinetic']),
  
  -- Social Media
  ('Instagram Post', 'social', 'feed', false, 'Square Instagram post', '{"width": 1080, "height": 1080, "borderRadius": 0}', ARRAY['instagram', 'social', 'square', 'feed']),
  ('Instagram Story', 'social', 'story', false, 'Vertical story format', '{"width": 1080, "height": 1920, "borderRadius": 0}', ARRAY['instagram', 'story', 'social', 'vertical']),
  ('Facebook Post', 'social', 'feed', false, 'Facebook feed post', '{"width": 1200, "height": 630, "borderRadius": 0}', ARRAY['facebook', 'social', 'feed']),
  ('Twitter/X Post', 'social', 'feed', false, 'Twitter/X post image', '{"width": 1200, "height": 675, "borderRadius": 16}', ARRAY['twitter', 'x', 'social', 'feed']),
  ('LinkedIn Post', 'social', 'feed', false, 'LinkedIn feed post', '{"width": 1200, "height": 628, "borderRadius": 0}', ARRAY['linkedin', 'social', 'professional', 'feed'])
ON CONFLICT DO NOTHING;