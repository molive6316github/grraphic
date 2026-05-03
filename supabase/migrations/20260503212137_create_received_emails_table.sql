/*
  # Create received_emails table for inbound email inbox

  Stores emails received via the inbound webhook (Resend / Cloudflare Email Routing).
  Admins can read, mark as read, star, and reply to received emails.
*/

CREATE TABLE IF NOT EXISTS received_emails (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email  text        NOT NULL,
  from_name   text,
  to_email    text        NOT NULL,
  reply_to    text,
  subject     text,
  body_html   text,
  body_text   text,
  received_at timestamptz DEFAULT now(),
  is_read     boolean     DEFAULT false,
  starred     boolean     DEFAULT false
);

ALTER TABLE received_emails ENABLE ROW LEVEL SECURITY;

-- Service-role key (used by inbound webhook) can insert without RLS
-- Admins can read/update
CREATE POLICY "Admins can manage received emails"
  ON received_emails FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_received_emails_received_at ON received_emails (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_received_emails_is_read     ON received_emails (is_read);
