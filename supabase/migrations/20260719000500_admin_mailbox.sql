/*
  # Admin mailbox

  Backs the Gmail-style email client in the admin panel:
  - outbound mail is sent through Resend and recorded here
  - inbound mail arrives via the receive-email edge function (Resend
    inbound webhook) inserting with the service role
  - admin-only RLS on everything
*/

CREATE TABLE IF NOT EXISTS public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_email text NOT NULL,
  from_name text,
  to_emails text[] NOT NULL DEFAULT '{}',
  subject text NOT NULL DEFAULT '',
  html text,
  text_body text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'received', 'draft')),
  error text,
  resend_id text,
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mailbox" ON public.admin_emails
  FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_admin_emails_direction ON public.admin_emails(direction, created_at DESC);
