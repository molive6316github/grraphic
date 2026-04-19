export const config = { runtime: 'nodejs' };

const GITHUB_OAUTH_CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID!;
const GITHUB_OAUTH_CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET!;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify OAuth client and that they are verified
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const body = await request.json();
    const { code, client_id } = body;

    if (!code || !client_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the client exists and is verified
    const { data: client, error: clientError } = await supabase
      .from('oauth_clients')
      .select('id, user_id, is_verified')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'Invalid client' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!client.is_verified) {
      return new Response(JSON.stringify({ error: 'Client must be verified to access GitHub' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Exchange GitHub code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_OAUTH_CLIENT_ID,
        client_secret: GITHUB_OAUTH_CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(JSON.stringify({ error: tokenData.error_description || 'GitHub auth failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const githubUser = await userResponse.json();

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch GitHub user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store or update GitHub connection
    const { error: upsertError } = await supabase
      .from('github_connections')
      .upsert({
        app_id: client.id,
        github_id: githubUser.id,
        github_username: githubUser.login,
        github_email: githubUser.email,
        github_avatar_url: githubUser.avatar_url,
        github_access_token: tokenData.access_token,
        github_token_expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null
      }, {
        onConflict: 'app_id'
      });

    if (upsertError) {
      console.error('Failed to store GitHub connection:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to store connection' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      github_username: githubUser.login,
      github_avatar_url: githubUser.avatar_url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('GitHub auth handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
