// Start of the GateKey SSO login. Sets a signed-ish state cookie (checked in
// the callback to prevent CSRF) and redirects the browser to GateKey. All
// token handling happens server-side in the callback; nothing secret is
// exposed here.

export const config = { runtime: 'edge' };

const GATEKEY_SSO_URL = 'https://gatekey.cc/auth/sso';
const CLIENT_ID = process.env.GATEKEY_CLIENT_ID || 'grraphic';
const REDIRECT_URI = process.env.GATEKEY_REDIRECT_URI || 'https://www.grraphic.xyz/auth/callback';

// Only allow returning to same-site paths.
function safeReturnPath(raw: string | null): string {
  if (!raw) return '/';
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
  } catch {
    // fall through
  }
  return '/';
}

export default async function handler(request: Request): Promise<Response> {
  const state = crypto.randomUUID();
  const returnTo = safeReturnPath(new URL(request.url).searchParams.get('return_to'));

  const dest = new URL(GATEKEY_SSO_URL);
  dest.searchParams.set('client_id', CLIENT_ID);
  dest.searchParams.set('redirect_uri', REDIRECT_URI);
  dest.searchParams.set('state', state);

  const headers = new Headers({ Location: dest.toString() });
  const cookieBase = 'HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600';
  headers.append('Set-Cookie', `gk_state=${state}; ${cookieBase}`);
  headers.append('Set-Cookie', `gk_return=${encodeURIComponent(returnTo)}; ${cookieBase}`);

  return new Response(null, { status: 302, headers });
}
