// GateKey SSO callback (server-side). GateKey redirects here with ?code&state.
// We: verify state, mint a GateKey service token, exchange the code for the
// GateKey user, map the stable hub_id onto a Supabase user (service-role), and
// generate a Supabase magic-link token. The browser is then sent back to the
// SPA with that single-use token, which the client verifies to establish a
// normal Supabase session — so all existing RLS/data/Stripe code keeps working
// unchanged while auth is provided by GateKey.

export const config = { runtime: 'edge' };

const GATEKEY_CLIENT_ID = process.env.GATEKEY_CLIENT_ID || 'grraphic';
const GATEKEY_CLIENT_SECRET = process.env.GATEKEY_CLIENT_SECRET;
const REDIRECT_URI = process.env.GATEKEY_REDIRECT_URI || 'https://www.grraphic.xyz/auth/callback';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Synthetic, stable, non-routable email derived from the GateKey hub_id. Keys
// the Supabase user; GateKey never exposes a real email.
const emailForHub = (hubId: string) => `${hubId}@gatekey.grraphic.xyz`;

function parseCookies(header: string | null): Record<string, string> {
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

function redirect(location: string): Response {
  const headers = new Headers({ Location: location });
  // Clear the transient cookies.
  headers.append('Set-Cookie', 'gk_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  headers.append('Set-Cookie', 'gk_return=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return new Response(null, { status: 302, headers });
}

const fail = (msg: string) => redirect(`/?auth_error=${encodeURIComponent(msg)}`);

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request.headers.get('Cookie'));
  const returnTo = safeReturnPath(cookies.gk_return);

  const gkError = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (gkError) return fail(gkError);
  if (!code || !state) return fail('Missing authorization code.');
  if (!cookies.gk_state || cookies.gk_state !== state) return fail('Sign-in state mismatch. Please try again.');
  if (!GATEKEY_CLIENT_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return fail('Auth is not configured on the server.');
  }

  try {
    // 1) Service token from client credentials.
    const svcRes = await fetch('https://gatekey.cc/api/token/service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GATEKEY_CLIENT_ID, client_secret: GATEKEY_CLIENT_SECRET }),
    });
    if (!svcRes.ok) throw new Error(`service-token ${svcRes.status}: ${(await svcRes.text()).slice(0, 200)}`);
    const serviceToken = (await svcRes.json())?.access_token;
    if (!serviceToken) throw new Error('service-token: no access_token in response');

    // 2) Exchange the code for the GateKey user.
    const exRes = await fetch('https://gatekey.cc/api/sso/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GateKey-Service-Token': serviceToken },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
    });
    if (!exRes.ok) throw new Error(`sso-token ${exRes.status}: ${(await exRes.text()).slice(0, 200)}`);
    const gkUser = (await exRes.json())?.user;
    const hubId: string | undefined = gkUser?.hub_id;
    if (!hubId) throw new Error('sso-token: no hub_id in response');

    const email = emailForHub(hubId);
    const adminHeaders = {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    };
    const userMetadata = {
      hub_id: hubId,
      username: gkUser.username,
      display_name: gkUser.display_name,
      avatar_url: gkUser.avatar_url,
      provider: 'gatekey',
    };

    // 3) Find-or-create the Supabase user (create is idempotent enough: an
    //    "already registered" response just means the user exists).
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ email, email_confirm: true, user_metadata: userMetadata }),
    });
    if (!createRes.ok && createRes.status !== 422) {
      // 422 = already exists; anything else is a real error.
      throw new Error(`create user ${createRes.status}: ${(await createRes.text()).slice(0, 200)}`);
    }

    // 4) Mint a single-use magic-link token for that user.
    const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ type: 'magiclink', email }),
    });
    if (!linkRes.ok) throw new Error(`generate_link ${linkRes.status}: ${(await linkRes.text()).slice(0, 200)}`);
    const link = await linkRes.json();
    const tokenHash = link?.hashed_token || link?.properties?.hashed_token;
    const verifyType = link?.verification_type || link?.properties?.verification_type || 'magiclink';
    if (!tokenHash) throw new Error(`generate_link: no hashed_token (keys: ${Object.keys(link || {}).join(',')})`);

    // 5) Hand the single-use token to the SPA, which verifies it to get a session.
    const dest = new URL(returnTo, 'https://placeholder.local');
    dest.searchParams.set('gk_token', tokenHash);
    dest.searchParams.set('gk_type', verifyType);
    return redirect(`${dest.pathname}${dest.search}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('GateKey callback failed:', detail);
    return fail(detail);
  }
}
