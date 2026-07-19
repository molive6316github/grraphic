// Receives Resend inbound-email webhooks and stores them in the admin
// mailbox. Configure the webhook in Resend as:
//   https://<project>.supabase.co/functions/v1/receive-email?key=<INBOUND_WEBHOOK_KEY>
// and set INBOUND_WEBHOOK_KEY as a function secret.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const expectedKey = Deno.env.get('INBOUND_WEBHOOK_KEY');
  const providedKey = new URL(req.url).searchParams.get('key');
  if (!expectedKey || providedKey !== expectedKey) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await req.json();
    const data = payload?.data ?? payload;

    const fromRaw = data?.from;
    const fromEmail = typeof fromRaw === 'string'
      ? fromRaw
      : fromRaw?.email || fromRaw?.address || 'unknown@unknown';
    const fromName = typeof fromRaw === 'object' ? (fromRaw?.name ?? null) : null;

    const toRaw = data?.to;
    const toEmails: string[] = Array.isArray(toRaw)
      ? toRaw.map((t: unknown) => typeof t === 'string' ? t : (t as { email?: string; address?: string })?.email || (t as { address?: string })?.address || '').filter(Boolean)
      : typeof toRaw === 'string' ? [toRaw] : [];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabase.from('admin_emails').insert({
      direction: 'inbound',
      from_email: fromEmail,
      from_name: fromName,
      to_emails: toEmails,
      subject: data?.subject || '(no subject)',
      html: data?.html || null,
      text_body: data?.text || null,
      status: 'received',
      resend_id: data?.email_id || payload?.id || null,
    });

    if (error) {
      console.error('Failed to store inbound email:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('receive-email error:', err);
    return new Response(JSON.stringify({ error: 'Bad payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
