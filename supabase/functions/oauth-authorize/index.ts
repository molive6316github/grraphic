import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a secure random code
function generateCode(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = await req.json();

    if (!client_id || !redirect_uri || !scope) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client and verify redirect_uri
    const { data: client, error: clientError } = await supabaseAdmin
      .from('oauth_clients')
      .select('id, redirect_uris')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Invalid client' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!client.redirect_uris.includes(redirect_uri)) {
      return new Response(
        JSON.stringify({ error: 'Invalid redirect_uri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate authorization code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store authorization code
    const { error: insertError } = await supabaseAdmin
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
      return new Response(
        JSON.stringify({ error: 'Failed to create authorization code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save user consent
    await supabaseAdmin
      .from('oauth_user_consents')
      .upsert({
        user_id: user.id,
        client_id: client.id,
        scopes: Array.isArray(scope) ? scope : scope.split(' '),
        granted_at: new Date().toISOString(),
        revoked_at: null
      }, { onConflict: 'user_id,client_id' });

    return new Response(
      JSON.stringify({ code, state }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
