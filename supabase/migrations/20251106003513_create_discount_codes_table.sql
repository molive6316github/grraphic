/*
  # Create Discount Codes Table

  1. New Tables
    - `discount_codes`
      - `id` (uuid, primary key) - Unique identifier
      - `code` (text, unique) - Discount code string (uppercase)
      - `description` (text) - Description of the discount
      - `discount_percent` (integer) - Percentage off (0-100)
      - `discount_amount` (integer) - Fixed amount off in cents
      - `max_uses` (integer) - Maximum number of times code can be used (null = unlimited)
      - `current_uses` (integer) - Current number of times used
      - `expires_at` (timestamptz) - Expiration date (null = never expires)
      - `is_active` (boolean) - Whether code is currently active
      - `created_at` (timestamptz) - Creation timestamp
      - `created_by` (uuid) - Admin who created the code
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `discount_codes` table
    - Add policy for admins to manage discount codes (checks admins table)
    - Add policy for authenticated users to view active codes

  3. Indexes
    - Index on code for fast lookups
    - Index on is_active and expires_at for filtering
*/

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  discount_percent integer DEFAULT 0,
  discount_amount integer DEFAULT 0,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT valid_amount CHECK (discount_amount >= 0),
  CONSTRAINT valid_uses CHECK (current_uses >= 0 AND (max_uses IS NULL OR current_uses <= max_uses))
);

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, expires_at);

-- Policy for admins to view all discount codes
CREATE POLICY "Admins can view all discount codes"
  ON discount_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- Policy for admins to create discount codes
CREATE POLICY "Admins can create discount codes"
  ON discount_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- Policy for admins to update discount codes
CREATE POLICY "Admins can update discount codes"
  ON discount_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- Policy for admins to delete discount codes
CREATE POLICY "Admins can delete discount codes"
  ON discount_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- Policy for authenticated users to view active, non-expired codes when validating
CREATE POLICY "Users can view active discount codes"
  ON discount_codes
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Add trigger for updated_at (use existing function)
DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
