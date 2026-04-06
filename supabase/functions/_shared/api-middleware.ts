import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Rate limits per tier (requests per minute)
const RATE_LIMITS = {
  free: { default: 10, auth: 20, public: 60 },
  pro: { default: 100, auth: 60, public: 120 },
}

// Daily quotas per tier
const DAILY_QUOTAS = {
  free: { analysis: 1, gradi: 10, 'site-designer': 2 },
  pro: { analysis: -1, gradi: -1, 'site-designer': -1 }, // -1 = unlimited
}

export interface ApiContext {
  supabase: any
  user: any
  apiKey: any
  tier: 'free' | 'pro'
}

export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, status = 400, code?: string) {
  return jsonResponse({ 
    error: true, 
    message, 
    code: code || `ERR_${status}`,
    timestamp: new Date().toISOString()
  }, status)
}

export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  return null
}

// Hash API key for storage/comparison
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Authenticate request via API key or Bearer token
export async function authenticateRequest(req: Request): Promise<{ user: any; apiKey: any; tier: 'free' | 'pro' } | null> {
  const supabase = createSupabaseClient()
  
  // Check for API key first
  const apiKeyHeader = req.headers.get('x-api-key')
  if (apiKeyHeader) {
    const keyHash = await hashApiKey(apiKeyHeader)
    
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('*, users!api_keys_user_id_fkey(*)')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()
    
    if (error || !apiKey) {
      return null
    }
    
    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return null
    }
    
    // Update last used
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)
    
    // Determine tier
    const tier = apiKey.users?.subscription_tier === 'pro' ? 'pro' : 'free'
    
    return { user: apiKey.users, apiKey, tier }
  }
  
  // Check for Bearer token
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    // Get user details including subscription
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    const tier = userData?.subscription_tier === 'pro' ? 'pro' : 'free'
    
    return { user: userData || user, apiKey: null, tier }
  }
  
  return null
}

// Check rate limit
export async function checkRateLimit(
  apiKeyId: string | null,
  userId: string,
  endpoint: string,
  tier: 'free' | 'pro'
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const supabase = createSupabaseClient()
  const limit = RATE_LIMITS[tier].default
  const windowStart = new Date()
  windowStart.setSeconds(0, 0) // Round to minute
  
  const identifier = apiKeyId || userId
  
  // Get current count for this minute
  const { data, error } = await supabase
    .from('api_rate_limits')
    .select('request_count')
    .eq(apiKeyId ? 'api_key_id' : 'api_key_id', apiKeyId || '00000000-0000-0000-0000-000000000000')
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single()
  
  const currentCount = data?.request_count || 0
  const resetAt = new Date(windowStart.getTime() + 60000)
  
  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, resetAt }
  }
  
  // Increment counter
  if (apiKeyId) {
    await supabase
      .from('api_rate_limits')
      .upsert({
        api_key_id: apiKeyId,
        endpoint,
        window_start: windowStart.toISOString(),
        request_count: currentCount + 1
      }, { onConflict: 'api_key_id,endpoint,window_start' })
  }
  
  return { allowed: true, remaining: limit - currentCount - 1, resetAt }
}

// Check daily quota
export async function checkDailyQuota(
  userId: string,
  endpoint: string,
  tier: 'free' | 'pro'
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = createSupabaseClient()
  
  // Determine quota category
  let category = 'default'
  if (endpoint.includes('analysis')) category = 'analysis'
  else if (endpoint.includes('gradi') || endpoint.includes('chat')) category = 'gradi'
  else if (endpoint.includes('site-designer')) category = 'site-designer'
  
  const limit = DAILY_QUOTAS[tier][category as keyof typeof DAILY_QUOTAS['free']] ?? -1
  
  // Unlimited
  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1 }
  }
  
  // Get today's usage
  const { data } = await supabase
    .from('api_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .eq('usage_date', new Date().toISOString().split('T')[0])
    .single()
  
  const used = data?.request_count || 0
  
  return { allowed: used < limit, used, limit }
}

// Track API usage
export async function trackUsage(
  userId: string,
  apiKeyId: string | null,
  endpoint: string,
  method: string
): Promise<void> {
  const supabase = createSupabaseClient()
  
  await supabase.rpc('increment_api_usage', {
    p_user_id: userId,
    p_api_key_id: apiKeyId,
    p_endpoint: endpoint,
    p_method: method
  })
}

// Generate a new API key
export async function generateApiKey(): Promise<{ key: string; hash: string; prefix: string }> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const key = 'grphc_' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  const hash = await hashApiKey(key)
  const prefix = key.substring(0, 12) + '...'
  
  return { key, hash, prefix }
}

// API middleware wrapper
export async function withApiMiddleware(
  req: Request,
  handler: (ctx: ApiContext) => Promise<Response>,
  options: {
    requireAuth?: boolean
    checkQuota?: boolean
    endpoint: string
  }
): Promise<Response> {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  const supabase = createSupabaseClient()
  
  // Authenticate if required
  let auth = null
  if (options.requireAuth !== false) {
    auth = await authenticateRequest(req)
    if (!auth) {
      return errorResponse('Unauthorized. Please provide a valid API key or Bearer token.', 401, 'UNAUTHORIZED')
    }
  }
  
  // Check rate limit
  if (auth) {
    const rateLimit = await checkRateLimit(
      auth.apiKey?.id || null,
      auth.user.id,
      options.endpoint,
      auth.tier
    )
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: true,
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimit.resetAt.toISOString()
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
        }
      })
    }
  }
  
  // Check daily quota
  if (options.checkQuota && auth) {
    const quota = await checkDailyQuota(auth.user.id, options.endpoint, auth.tier)
    
    if (!quota.allowed) {
      return new Response(JSON.stringify({
        error: true,
        message: `Daily quota exceeded. You've used ${quota.used}/${quota.limit} requests today. Upgrade to Pro for unlimited access.`,
        code: 'QUOTA_EXCEEDED',
        used: quota.used,
        limit: quota.limit,
        resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Quota-Used': quota.used.toString(),
          'X-Quota-Limit': quota.limit.toString()
        }
      })
    }
  }
  
  // Track usage
  if (auth) {
    await trackUsage(auth.user.id, auth.apiKey?.id || null, options.endpoint, req.method)
  }
  
  // Execute handler
  try {
    return await handler({
      supabase,
      user: auth?.user || null,
      apiKey: auth?.apiKey || null,
      tier: auth?.tier || 'free'
    })
  } catch (error) {
    console.error('API Error:', error)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export { corsHeaders }
