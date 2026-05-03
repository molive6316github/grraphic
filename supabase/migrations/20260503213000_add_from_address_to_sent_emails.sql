ALTER TABLE sent_emails ADD COLUMN IF NOT EXISTS from_address text DEFAULT 'noreply@grraphic.xyz';
