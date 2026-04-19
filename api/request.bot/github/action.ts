export const config = { runtime: 'nodejs' };

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
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const body = await request.json();
    const { client_id, action, data } = body;

    if (!client_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the client exists and is verified
    const { data: client, error: clientError } = await supabase
      .from('oauth_clients')
      .select('id, is_verified')
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

    // Get GitHub connection for this client
    const { data: connection, error: connError } = await supabase
      .from('github_connections')
      .select('github_access_token, github_username')
      .eq('app_id', client.id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'No GitHub connection found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform the requested action on GitHub
    let result;

    if (action === 'list_repos') {
      const response = await fetch('https://api.github.com/user/repos?type=owner&sort=updated', {
        headers: {
          'Authorization': `token ${connection.github_access_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch repositories' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      result = await response.json();
    } 
    else if (action === 'create_repo') {
      const { name, description, private: isPrivate } = data;

      if (!name) {
        return new Response(JSON.stringify({ error: 'Repository name required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${connection.github_access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description: description || '',
          private: isPrivate || false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return new Response(JSON.stringify({ error: error.message || 'Failed to create repository' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      result = await response.json();
    }
    else if (action === 'get_repo') {
      const { repo } = data;

      if (!repo) {
        return new Response(JSON.stringify({ error: 'Repository name required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch(`https://api.github.com/repos/${connection.github_username}/${repo}`, {
        headers: {
          'Authorization': `token ${connection.github_access_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Repository not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      result = await response.json();
    }
    else if (action === 'push_files') {
      const { repo, files, message, branch } = data;

      if (!repo || !files || !message) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // This would require more complex Git operations
      // For now, return a simplified response
      result = {
        message: 'File push would be implemented here',
        repo,
        files: Object.keys(files)
      };
    }
    else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('GitHub action handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
