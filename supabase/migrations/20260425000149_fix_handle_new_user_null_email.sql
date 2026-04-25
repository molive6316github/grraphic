/*
  # Fix handle_new_user for OAuth providers with null/private email

  GitHub users with private emails have new.email = NULL.
  The previous function would produce a NULL base_username in that case,
  causing username to be stored as NULL.

  This version derives the username from (in priority order):
    1. Signup metadata 'username' field
    2. OAuth provider 'user_name' field (GitHub login)
    3. OAuth provider 'name' / 'full_name' field
    4. Email prefix (if email is present)
    5. Random 'user' + 6-char hex fallback
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Derive a base username from available metadata
  base_username := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'username'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'user_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(SPLIT_PART(new.raw_user_meta_data->>'name', ' ', 1)), ''),
    NULLIF(TRIM(SPLIT_PART(new.raw_user_meta_data->>'full_name', ' ', 1)), ''),
    NULLIF(TRIM(SPLIT_PART(COALESCE(new.email, ''), '@', 1)), '')
  );

  -- Strip non-alphanumeric/underscore characters
  IF base_username IS NOT NULL THEN
    base_username := LOWER(REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  END IF;

  -- If still empty/null after cleaning, generate a random fallback
  IF base_username IS NULL OR LENGTH(base_username) = 0 THEN
    base_username := 'user' || LOWER(SUBSTRING(MD5(new.id::text), 1, 6));
  END IF;

  -- Pad if too short
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || '123';
  END IF;

  -- Truncate to leave room for a numeric suffix
  IF LENGTH(base_username) > 15 THEN
    base_username := SUBSTRING(base_username, 1, 15);
  END IF;

  final_username := base_username;

  -- Resolve collisions
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  INSERT INTO public.users (id, email, username)
  VALUES (new.id, new.email, final_username);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
