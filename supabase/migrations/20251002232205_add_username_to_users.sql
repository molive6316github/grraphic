/*
  # Add Username System

  1. Changes
    - Add `username` column to users table
    - Add unique constraint to ensure usernames are unique
    - Add index for performance
    - Set default username based on email

  2. Security
    - Maintains existing RLS policies
    - Users can update their own username
*/

-- Add username column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text;
  END IF;
END $$;

-- Add unique constraint on username (allows NULL for now)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Update existing users to have a default username based on their email
UPDATE users 
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'))
WHERE username IS NULL AND email IS NOT NULL;
