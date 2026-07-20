// Vercel Cron keep-alive: pings Supabase every couple of days so the
// project never goes dormant on the free tier. Wired up in vercel.json.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'Supabase env not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // A trivial authenticated REST call is enough to count as activity
    const res = await fetch(`${SUPABASE_URL}/rest/v1/system_config?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status, at: new Date().toISOString() }),
      { status: res.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'ping failed' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
