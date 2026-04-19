// Vercel Serverless Function - API Gateway for Grraphic
// Routes: /api/request.bot/*

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  // Handle both /api/request.bot/path and /path (from api.grraphic.xyz rewrite)
  let pathname = url.pathname;
  if (pathname.startsWith('/api/request.bot/')) {
    pathname = pathname.replace('/api/request.bot/', '');
  } else if (pathname.startsWith('/')) {
    pathname = pathname.slice(1);
  }
  const pathParts = pathname.split('/').filter(Boolean);
  
  // Route mapping
  const routeMap: Record<string, string> = {
    'oauth/client-info': 'oauth-client-info',
    'oauth/authorize': 'oauth-authorize',
    'oauth/token': 'oauth-token',
    'oauth/userinfo': 'oauth-userinfo',
    'api/v1/account': 'api-account',
    'api/v1/keys': 'api-keys',
    'api/v1/analysis': 'api-analysis',
    'api/v1/gradi/chat': 'api-gradi-chat',
    'api/v1/usage': 'api-usage',
  };

  const routePath = pathParts.join('/');
  const functionName = routeMap[routePath];

  console.log('[v0] API Gateway:', { 
    originalPath: url.pathname, 
    parsedPath: pathname, 
    routePath, 
    functionName,
    method: request.method 
  });

  if (!functionName) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Not Found', 
        code: 'NOT_FOUND',
        availableRoutes: Object.keys(routeMap)
      }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Forward request to Supabase Edge Function
    const supabaseUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;
    
    // Clone headers - preserve user's Authorization header
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Forward Authorization header if present (for user auth)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
    
    // Forward API key if present
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey) {
      headers.set('X-API-Key', apiKey);
    }

    const response = await fetch(supabaseUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : undefined,
    });

    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('API Gateway Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal Server Error', 
        code: 'INTERNAL_ERROR',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
