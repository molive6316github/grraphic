/*
  # Create sent_emails table for admin email history

  Stores a record of every email blast sent from the admin email client,
  enabling a Gmail-style Sent folder view.
*/

CREATE TABLE IF NOT EXISTS sent_emails (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipients     text[]      NOT NULL,
  subject        text        NOT NULL,
  body           text        NOT NULL,
  recipient_type text        NOT NULL DEFAULT 'manual',
  recipient_count integer    NOT NULL DEFAULT 0,
  sent_at        timestamptz DEFAULT now()
);

ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sent emails"
  ON sent_emails FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
