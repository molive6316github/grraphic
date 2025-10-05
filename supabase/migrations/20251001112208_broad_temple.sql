/*
  # Update Credit System

  1. Changes
    - Increase monthly pro credits from 3 to 10
    - Update default value for new users
    - Reset existing users to new credit amount

  2. Credit Usage
    - 1 credit: Large file upload (>3MB)
    - 2 credits: AI autofix suggestions
    - 5 credits: AI autofix implementation
*/

-- Update the default pro credits for new users
ALTER TABLE users ALTER COLUMN pro_credits_remaining SET DEFAULT 10;

-- Reset all existing users to the new credit amount (optional - remove if you don't want to reset existing users)
UPDATE users SET pro_credits_remaining = 10 WHERE pro_credits_remaining < 10;

-- Update the reset_monthly_credits function to use 10 credits
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET 
    pro_credits_remaining = 10,
    pro_credits_reset_date = date_trunc('month', now()) + interval '1 month'
  WHERE 
    pro_credits_reset_date <= now()
    AND pro_credits_remaining < 10;
END;
$$;