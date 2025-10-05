/*
  # Add user credits system

  1. New Tables
    - `users` table for storing user information and credits
    - Tracks pro_credits_remaining and pro_credits_reset_date

  2. Security
    - Enable RLS on users table
    - Add policies for users to manage their own data

  3. Functions
    - Function to reset monthly credits
    - Trigger to create user record on auth signup
*/

-- Create users table to track credits
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  pro_credits_remaining integer DEFAULT 3,
  pro_credits_reset_date timestamp with time zone DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET 
    pro_credits_remaining = 3,
    pro_credits_reset_date = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
  WHERE pro_credits_reset_date <= now();
END;
$$ LANGUAGE plpgsql;

-- Function to create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record when someone signs up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_credits_reset ON users(pro_credits_reset_date);

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;