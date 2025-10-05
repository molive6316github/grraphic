/*
  # Add Subscription Expiration Date

  1. Changes
    - Add pro_subscription_expires_at column to users table
    - This allows admins to grant temporary Pro subscriptions
    - Null means unlimited/lifetime subscription

  2. Security
    - Column can be updated by admins via existing policies
*/

-- Add subscription expiration date column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pro_subscription_expires_at timestamptz DEFAULT NULL;

-- Create function to check and expire subscriptions
CREATE OR REPLACE FUNCTION expire_pro_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET is_pro_subscriber = false
  WHERE 
    is_pro_subscriber = true
    AND pro_subscription_expires_at IS NOT NULL
    AND pro_subscription_expires_at <= now();
END;
$$;