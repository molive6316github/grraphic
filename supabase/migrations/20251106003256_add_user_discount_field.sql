/*
  # Add Discount Field to Users

  1. Changes
    - Add `discount_code` column to users table to track applied discounts
    - This is for visual tracking in admin panel only
    - Actual discount application happens in Stripe

  2. Notes
    - Field is optional (can be null)
    - Admins can set this to mark which users used discount codes
*/

-- Add discount_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_code text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_discount_code ON users(discount_code) WHERE discount_code IS NOT NULL;
