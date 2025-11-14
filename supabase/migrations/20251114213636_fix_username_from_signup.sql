/*
  # Fix Username from Signup Metadata

  1. Changes
    - Update handle_new_user to use username from signup metadata
    - Falls back to email-based username if none provided
    - Enables sign-in with username or email
    
  2. Security
    - Function remains SECURITY DEFINER
    - Validates username format
*/

-- Update function to use username from signup metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
  provided_username text;
BEGIN
  -- Try to get username from metadata (raw_user_meta_data)
  provided_username := new.raw_user_meta_data->>'username';
  
  -- If username was provided, use it
  IF provided_username IS NOT NULL AND LENGTH(TRIM(provided_username)) > 0 THEN
    base_username := LOWER(REGEXP_REPLACE(TRIM(provided_username), '[^a-zA-Z0-9_]', '', 'g'));
  ELSE
    -- Fallback: generate from email
    base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  END IF;
  
  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || '123';
  END IF;
  
  -- Truncate to max 15 characters to leave room for suffix
  IF LENGTH(base_username) > 15 THEN
    base_username := SUBSTRING(base_username, 1, 15);
  END IF;
  
  final_username := base_username;
  
  -- Check if username exists and add suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;
  
  -- Insert user with final username
  INSERT INTO public.users (id, email, username)
  VALUES (new.id, new.email, final_username);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
