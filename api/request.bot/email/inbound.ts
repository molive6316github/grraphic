/**
 * Inbound email webhook handler.
 *
 * Supports two providers — configure whichever you route MX records through:
 *
 * Resend inbound
 *   Dashboard → Domains → grraphic.xyz → Inbound → set webhook URL to:
 *   https://api.grraphic.xyz/email/inbound
 *   Add MX record:  grraphic.xyz  MX  10  inbound.resend.com
 *
 * Cloudflare Email Routing  (free, if domain is on Cloudflare)
 *   Dashboard → Email → Email Routing → Catch-all → Workers
 *   Forward to this endpoint via an Email Worker
 *   (no MX change needed — Cloudflare handles it automatically)
 */

export const config = { runtime: 'nodejs' };

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Optional — verify Resend webhook signatures
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Normalise to a common shape regardless of provider
  const email = parsePayload(payload);
  if (!email) return json({ error: 'Unrecognised payload format' }, 400);

  // Persist via service-role key (bypasses RLS so the webhook can write)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/received_emails`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(email),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('inbound: supabase insert failed', err);
    return json({ error: 'Storage failed' }, 500);
  }

  return json({ ok: true });
}

// ── Parsers ──────────────────────────────────────────────────────────────────

function parsePayload(p: Record<string, unknown>) {
  // Resend  { type: "email.received", data: { from, to, subject, html, text, … } }
  if (p.type === 'email.received' && p.data) {
    const d = p.data as Record<string, unknown>;
    const toArr = Array.isArray(d.to) ? d.to : [d.to];
    return {
      from_email: extractEmail(String(d.from ?? '')),
      from_name:  extractName(String(d.from ?? '')),
      to_email:   extractEmail(String(toArr[0] ?? '')),
      reply_to:   d.reply_to ? extractEmail(String(d.reply_to)) : null,
      subject:    String(d.subject ?? '(no subject)'),
      body_html:  d.html  ? String(d.html)  : null,
      body_text:  d.text  ? String(d.text)  : null,
    };
  }

  // Postmark  { From, To, Subject, HtmlBody, TextBody, … }
  if (typeof p.From === 'string' && typeof p.To === 'string') {
    return {
      from_email: extractEmail(p.From),
      from_name:  extractName(p.From),
      to_email:   extractEmail(p.To),
      reply_to:   p.ReplyTo ? extractEmail(String(p.ReplyTo)) : null,
      subject:    String(p.Subject ?? '(no subject)'),
      body_html:  p.HtmlBody ? String(p.HtmlBody) : null,
      body_text:  p.TextBody ? String(p.TextBody)  : null,
    };
  }

  // Mailgun  { sender, recipient, subject, 'body-html', 'body-plain', … }
  if (typeof p.sender === 'string') {
    return {
      from_email: extractEmail(String(p.sender)),
      from_name:  extractName(String(p.From ?? p.sender)),
      to_email:   extractEmail(String(p.recipient ?? '')),
      reply_to:   null,
      subject:    String(p.subject ?? '(no subject)'),
      body_html:  p['body-html']  ? String(p['body-html'])  : null,
      body_text:  p['body-plain'] ? String(p['body-plain']) : null,
    };
  }

  return null;
}

// "Jane Doe <jane@example.com>"  →  "jane@example.com"
function extractEmail(raw: string) {
  const m = raw.match(/<([^>]+)>/);
  return m ? m[1].trim() : raw.trim();
}

// "Jane Doe <jane@example.com>"  →  "Jane Doe"
function extractName(raw: string) {
  const m = raw.match(/^([^<]+)<[^>]+>/);
  return m ? m[1].trim() : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
