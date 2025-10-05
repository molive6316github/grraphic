/*
  # Add Cron Job for Expiring Subscriptions

  1. Changes
    - Creates a cron job that runs daily to check and expire Pro subscriptions
    - Automatically sets is_pro_subscriber to false when pro_subscription_expires_at is reached
    
  2. Notes
    - This uses pg_cron extension which should be enabled in Supabase
    - Runs every day at midnight UTC
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the subscription expiration job to run daily at midnight
SELECT cron.schedule(
  'expire-pro-subscriptions',
  '0 0 * * *',
  $$
  UPDATE users 
  SET is_pro_subscriber = false
  WHERE 
    is_pro_subscriber = true
    AND pro_subscription_expires_at IS NOT NULL
    AND pro_subscription_expires_at <= now();
  $$
);