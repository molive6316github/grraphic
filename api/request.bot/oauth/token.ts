import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, method: string): Promise<boolean> {
  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  } else if (method === 'S256') {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64 === codeChallenge;
  }
  return false;
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
    let body: Record<string, string>;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      body = await request.json();
    }

    const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, refresh_token } = body;

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    if (grant_type === 'authorization_code') {
      if (!code || !redirect_uri || !client_id) {
        return new Response(JSON.stringify({ error: 'invalid_request', error_description: 'Missing required parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get client
      const { data: client, error: clientError } = await supabase
        .from('oauth_clients')
        .select('id, client_secret_hash')
        .eq('client_id', client_id)
        .eq('is_active', true)
        .single();

      if (clientError || !client) {
        return new Response(JSON.stringify({ error: 'invalid_client', error_description: 'Client not found' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify client secret if provided
      if (client_secret) {
        const secretHash = await hashToken(client_secret);
        if (secretHash !== client.client_secret_hash) {
          return new Response(JSON.stringify({ error: 'invalid_client', error_description: 'Invalid client credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Get and validate authorization code
      const { data: authCode, error: codeError } = await supabase
        .from('oauth_auth_codes')
        .select('*')
        .eq('code', code)
        .eq('client_id', client.id)
        .is('used_at', null)
        .single();

      if (codeError || !authCode) {
        return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new Date(authCode.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Authorization code expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (authCode.redirect_uri !== redirect_uri) {
        return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Redirect URI mismatch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify PKCE
      if (authCode.code_challenge) {
        if (!code_verifier) {
          return new Response(JSON.stringify({ error: 'invalid_request', error_description: 'code_verifier required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const valid = await verifyCodeChallenge(code_verifier, authCode.code_challenge, authCode.code_challenge_method || 'S256');
        if (!valid) {
          return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid code_verifier' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Mark code as used
      await supabase.from('oauth_auth_codes').update({ used_at: new Date().toISOString() }).eq('id', authCode.id);

      // Generate tokens
      const accessToken = generateToken();
      const refreshTokenValue = generateToken();
      const accessTokenHash = await hashToken(accessToken);
      const refreshTokenHash = await hashToken(refreshTokenValue);

      const accessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const { data: storedAccessToken, error: accessError } = await supabase
        .from('oauth_access_tokens')
        .insert({
          token_hash: accessTokenHash,
          client_id: client.id,
          user_id: authCode.user_id,
          scopes: authCode.scopes,
          expires_at: accessTokenExpiry.toISOString()
        })
        .select('id')
        .single();

      if (accessError) {
        return new Response(JSON.stringify({ error: 'server_error', error_description: 'Failed to create access token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('oauth_refresh_tokens').insert({
        token_hash: refreshTokenHash,
        access_token_id: storedAccessToken.id,
        client_id: client.id,
        user_id: authCode.user_id,
        expires_at: refreshTokenExpiry.toISOString()
      });

      return new Response(JSON.stringify({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshTokenValue,
        scope: authCode.scopes.join(' ')
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (grant_type === 'refresh_token') {
      if (!refresh_token || !client_id) {
        return new Response(JSON.stringify({ error: 'invalid_request', error_description: 'Missing required parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refreshTokenHash = await hashToken(refresh_token);

      const { data: storedRefreshToken, error: refreshError } = await supabase
        .from('oauth_refresh_tokens')
        .select('*, oauth_clients!inner(client_id)')
        .eq('token_hash', refreshTokenHash)
        .is('revoked_at', null)
        .single();

      if (refreshError || !storedRefreshToken) {
        return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid refresh token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (storedRefreshToken.oauth_clients.client_id !== client_id) {
        return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Client mismatch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new Date(storedRefreshToken.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Refresh token expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: accessTokenData } = await supabase
        .from('oauth_access_tokens')
        .select('scopes')
        .eq('id', storedRefreshToken.access_token_id)
        .single();

      const newAccessToken = generateToken();
      const newAccessTokenHash = await hashToken(newAccessToken);
      const newAccessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await supabase.from('oauth_access_tokens').insert({
        token_hash: newAccessTokenHash,
        client_id: storedRefreshToken.client_id,
        user_id: storedRefreshToken.user_id,
        scopes: accessTokenData?.scopes || [],
        expires_at: newAccessTokenExpiry.toISOString()
      });

      return new Response(JSON.stringify({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: (accessTokenData?.scopes || []).join(' ')
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'unsupported_grant_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
