/*
  # Remove User-Specific Discount Fields

  1. Changes
    - Remove `discount_code` column from users (discount codes are now universal)
    - Remove `discount_percent` column from users
    - Remove `discount_amount` column from users
    
  2. Notes
    - Discount codes are now managed in the discount_codes table
    - All users can use any active discount code
    - No need to assign codes to specific users
*/

-- Remove user-specific discount fields
ALTER TABLE users DROP COLUMN IF EXISTS discount_code;
ALTER TABLE users DROP COLUMN IF EXISTS discount_percent;
ALTER TABLE users DROP COLUMN IF EXISTS discount_amount;
