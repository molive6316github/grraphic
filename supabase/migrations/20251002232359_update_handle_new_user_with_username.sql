/*
  # Update handle_new_user to set default username

  1. Changes
    - Modify handle_new_user function to generate a default username
    - Username is derived from email prefix with random suffix if needed
    - Handles duplicate usernames automatically

  2. Security
    - Function remains SECURITY DEFINER as required
    - Maintains existing trigger functionality
*/

-- Update function to create user record with username on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Extract username from email and clean it
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  
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
  
  -- Insert user with generated username
  INSERT INTO public.users (id, email, username)
  VALUES (new.id, new.email, final_username);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
