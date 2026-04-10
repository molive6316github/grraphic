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
  const pathParts = url.pathname.replace('/api/request.bot/', '').split('/');
  
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
    
    // Clone headers and add service key for internal calls
    const headers = new Headers(request.headers);
    headers.set('Content-Type', 'application/json');
    
    // If this is an internal OAuth call, add service key
    if (functionName.startsWith('oauth-') && SUPABASE_SERVICE_KEY) {
      headers.set('Authorization', `Bearer ${SUPABASE_SERVICE_KEY}`);
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
