export const config = { runtime: 'nodejs' };

const RESEND_API_KEY = process.env.RESEND_API_KEY!;

const ALLOWED_FROM_ADDRESSES = new Set([
  'noreply@grraphic.xyz',
  'admin@grraphic.xyz',
  'support@grraphic.xyz',
  'info@grraphic.xyz',
  'hello@grraphic.xyz',
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Missing authorization' }, 401);

  const token = authHeader.slice(7);
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Invalid token' }, 401);

  const body = await request.json();
  const { to, subject, body: emailBody, fromAddress, fromName, replyTo } = body;

  if (!to || !subject || !emailBody) return json({ error: 'Missing required fields' }, 400);

  // Validate the FROM address is one of our domain addresses
  const from = fromAddress && ALLOWED_FROM_ADDRESSES.has(fromAddress)
    ? fromAddress
    : 'noreply@grraphic.xyz';

  const toEmails = Array.isArray(to) ? to : [to];

  const payload: Record<string, unknown> = {
    from:    `${fromName ?? 'Grraphic'} <${from}>`,
    to:      toEmails,
    subject,
    html:    emailBody,
  };
  if (replyTo) payload.reply_to = replyTo;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) return json({ error: result.message || 'Failed to send email' }, 500);

  return json({ success: true, id: result.id });
}
