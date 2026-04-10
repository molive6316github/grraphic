import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash a token for lookup
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'invalid_token', error_description: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenHash = await hashToken(token);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get access token
    const { data: accessToken, error: tokenError } = await supabaseAdmin
      .from('oauth_access_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .single();

    if (tokenError || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'invalid_token', error_description: 'Token not found or revoked' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
      );
    }

    // Check expiration
    if (new Date(accessToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'invalid_token', error_description: 'Token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
      );
    }

    const scopes = accessToken.scopes || [];
    const userInfo: Record<string, any> = {
      sub: accessToken.user_id
    };

    // Get user profile based on scopes
    if (scopes.includes('profile') || scopes.includes('email')) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('username, email')
        .eq('id', accessToken.user_id)
        .single();

      if (profile) {
        if (scopes.includes('profile')) {
          userInfo.username = profile.username;
          userInfo.preferred_username = profile.username;
        }
        if (scopes.includes('email')) {
          userInfo.email = profile.email;
          userInfo.email_verified = true; // Supabase verifies emails
        }
      }
    }

    // Get GitHub connection if scope includes github
    if (scopes.includes('github')) {
      const { data: githubConnection } = await supabaseAdmin
        .from('github_connections')
        .select('github_id, github_username, github_email, github_avatar_url')
        .eq('user_id', accessToken.user_id)
        .single();

      if (githubConnection) {
        userInfo.github = {
          id: githubConnection.github_id,
          username: githubConnection.github_username,
          email: githubConnection.github_email,
          avatar_url: githubConnection.github_avatar_url
        };
      } else {
        userInfo.github = null;
      }
    }

    return new Response(
      JSON.stringify(userInfo),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'server_error', error_description: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
