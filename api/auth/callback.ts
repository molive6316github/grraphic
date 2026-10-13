// GateKey SSO callback (Node runtime). GateKey redirects here with ?code&state.
// We verify state, mint a GateKey service token, exchange the code for the
// GateKey user + user token, and hand that token to the SPA (URL hash). The
// client stores it and sends it as the Bearer to MXT DB, whose RLS reads the
// token's identity via auth.uid(). No Supabase involved.

const GATEKEY_CLIENT_ID = process.env.GATEKEY_CLIENT_ID || 'grraphic';
const GATEKEY_CLIENT_SECRET = process.env.GATEKEY_CLIENT_SECRET;
const REDIRECT_URI = process.env.GATEKEY_REDIRECT_URI || 'https://www.grraphic.xyz/auth/callback';

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function safeReturnPath(raw: string | undefined): string {
  if (!raw) return '/';
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
  } catch {
    // fall through
  }
  return '/';
}

function first(v: unknown): string | undefined {
  return Array.isArray(v) ? v[0] : (v as string | undefined);
}

export default async function handler(req: any, res: any): Promise<void> {
  const redirect = (location: string) => {
    res.statusCode = 302;
    res.setHeader('Location', location);
    res.setHeader('Set-Cookie', [
      'gk_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      'gk_return=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    ]);
    res.end();
  };
  const fail = (msg: string) => redirect(`/?auth_error=${encodeURIComponent(msg)}`);

  const code = first(req.query?.code);
  const state = first(req.query?.state);
  const cookies = parseCookies(req.headers?.cookie);
  const returnTo = safeReturnPath(cookies.gk_return);

  const gkError = first(req.query?.error_description) || first(req.query?.error);
  if (gkError) return fail(gkError);
  if (!code || !state) return fail('Missing authorization code.');
  if (!cookies.gk_state || cookies.gk_state !== state) return fail('Sign-in state mismatch. Please try again.');
  if (!GATEKEY_CLIENT_SECRET) return fail('Auth is not configured on the server.');

  let step = 'start';
  try {
    step = 'service-token';
    const svcRes = await fetch('https://gatekey.cc/api/token/service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GATEKEY_CLIENT_ID, client_secret: GATEKEY_CLIENT_SECRET }),
    });
    if (!svcRes.ok) throw new Error(`service-token ${svcRes.status}: ${(await svcRes.text()).slice(0, 200)}`);
    const serviceToken = (await svcRes.json())?.access_token;
    if (!serviceToken) throw new Error('service-token: no access_token');

    step = 'sso-token';
    const exRes = await fetch('https://gatekey.cc/api/sso/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GateKey-Service-Token': serviceToken },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
    });
    if (!exRes.ok) throw new Error(`sso-token ${exRes.status}: ${(await exRes.text()).slice(0, 200)}`);
    const exBody = await exRes.json();
    const userToken: string | undefined = exBody?.access_token;
    const gkUser = exBody?.user;
    if (!userToken) throw new Error('sso-token: no access_token');
    if (!gkUser?.hub_id) throw new Error('sso-token: no hub_id');

    // Hand the user token + display profile to the SPA via the URL hash.
    const params = new URLSearchParams();
    params.set('gk_at', userToken);
    if (gkUser.username) params.set('gk_un', gkUser.username);
    if (gkUser.display_name) params.set('gk_dn', gkUser.display_name);
    if (gkUser.avatar_url) params.set('gk_av', gkUser.avatar_url);
    return redirect(`${returnTo}#${params.toString()}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`GateKey callback failed at step=${step}:`, detail);
    return fail(`[${step}] ${detail}`);
  }
}
