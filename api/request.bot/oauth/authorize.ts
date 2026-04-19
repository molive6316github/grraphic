import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function generateCode(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = await request.json();

    if (!client_id || !redirect_uri || !scope) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get client and verify redirect_uri
    const { data: client, error: clientError } = await supabase
      .from('oauth_clients')
      .select('id, redirect_uris')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'Invalid client' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!client.redirect_uris.includes(redirect_uri)) {
      return new Response(JSON.stringify({ error: 'Invalid redirect_uri' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate authorization code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store authorization code
    const { error: insertError } = await supabase
      .from('oauth_auth_codes')
      .insert({
        code,
        client_id: client.id,
        user_id: user.id,
        redirect_uri,
        scopes: Array.isArray(scope) ? scope : scope.split(' '),
        code_challenge,
        code_challenge_method,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error creating auth code:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create authorization code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save user consent
    await supabase
      .from('oauth_user_consents')
      .upsert({
        user_id: user.id,
        client_id: client.id,
        scopes: Array.isArray(scope) ? scope : scope.split(' '),
        granted_at: new Date().toISOString(),
        revoked_at: null
      }, { onConflict: 'user_id,client_id' });

    return new Response(JSON.stringify({ code, state }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
