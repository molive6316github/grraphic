/*
  # Add Discount Fields to Users

  1. Changes
    - Add `discount_percent` column (integer, 0-100) for percentage discounts
    - Add `discount_amount` column (integer, in cents) for fixed amount discounts
    - These are for visual/tracking purposes only in admin panel
    - Actual discount application happens in Stripe

  2. Notes
    - Both fields are optional (default 0)
    - Only one should typically be used at a time
    - Admins can set these values to track which users have discounts
*/

-- Add discount_percent column (0-100)
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;
ALTER TABLE users ADD CONSTRAINT valid_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Add discount_amount column (in cents)
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_amount integer DEFAULT 0;
ALTER TABLE users ADD CONSTRAINT valid_discount_amount CHECK (discount_amount >= 0);
