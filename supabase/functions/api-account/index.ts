import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { 
  withApiMiddleware, 
  jsonResponse, 
  errorResponse
} from '../_shared/api-middleware.ts'

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/api-account', '')
  
  // GET /api/v1/account - Get account info
  if (req.method === 'GET' && (!path || path === '/')) {
    return withApiMiddleware(req, async (ctx) => {
      const { data: apiKeyCount } = await ctx.supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ctx.user.id)
      
      return jsonResponse({
        success: true,
        data: {
          id: ctx.user.id,
          email: ctx.user.email,
          username: ctx.user.username,
          tier: ctx.tier,
          subscriptionTier: ctx.user.subscription_tier,
          emailVerified: ctx.user.email_verified || false,
          twoFactorEnabled: ctx.user.two_factor_enabled || false,
          apiKeyCount: apiKeyCount || 0,
          maxApiKeys: ctx.tier === 'pro' ? 10 : 1,
          createdAt: ctx.user.created_at
        }
      })
    }, { endpoint: 'account', requireAuth: true })
  }
  
  // PUT /api/v1/account - Update account
  if (req.method === 'PUT' && (!path || path === '/')) {
    return withApiMiddleware(req, async (ctx) => {
      const body = await req.json()
      const { username } = body
      
      const updates: any = { updated_at: new Date().toISOString() }
      
      if (username) {
        // Check username availability
        const { data: existing } = await ctx.supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('id', ctx.user.id)
          .single()
        
        if (existing) {
          return errorResponse('Username already taken', 400)
        }
        
        updates.username = username
      }
      
      const { data, error } = await ctx.supabase
        .from('users')
        .update(updates)
        .eq('id', ctx.user.id)
        .select('id, email, username, updated_at')
        .single()
      
      if (error) {
        return errorResponse('Failed to update account', 500)
      }
      
      return jsonResponse({ success: true, data })
    }, { endpoint: 'account', requireAuth: true })
  }
  
  // GET /api/v1/account/sessions - List active sessions
  if (req.method === 'GET' && path === '/sessions') {
    return withApiMiddleware(req, async (ctx) => {
      const { data, error } = await ctx.supabase
        .from('user_sessions')
        .select('id, device_info, ip_address, user_agent, last_activity_at, created_at')
        .eq('user_id', ctx.user.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false })
      
      if (error) {
        return errorResponse('Failed to fetch sessions', 500)
      }
      
      return jsonResponse({ success: true, data })
    }, { endpoint: 'account', requireAuth: true })
  }
  
  // DELETE /api/v1/account/sessions/:id - Revoke a session
  if (req.method === 'DELETE' && path.startsWith('/sessions/')) {
    return withApiMiddleware(req, async (ctx) => {
      const sessionId = path.replace('/sessions/', '')
      
      const { error } = await ctx.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .eq('user_id', ctx.user.id)
      
      if (error) {
        return errorResponse('Failed to revoke session', 500)
      }
      
      return jsonResponse({ success: true, message: 'Session revoked' })
    }, { endpoint: 'account', requireAuth: true })
  }
  
  // GET /api/v1/account/subscription - Get subscription details
  if (req.method === 'GET' && path === '/subscription') {
    return withApiMiddleware(req, async (ctx) => {
      const { data: subscription } = await ctx.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', ctx.user.id)
        .single()
      
      return jsonResponse({
        success: true,
        data: {
          tier: ctx.tier,
          subscription: subscription || null,
          features: {
            free: {
              analysisPerDay: 1,
              gradiMessagesPerDay: 10,
              siteDesignerPerDay: 2,
              maxApiKeys: 1
            },
            pro: {
              analysisPerDay: 'unlimited',
              gradiMessagesPerDay: 'unlimited',
              siteDesignerPerDay: 'unlimited',
              maxApiKeys: 10
            }
          }[ctx.tier]
        }
      })
    }, { endpoint: 'account', requireAuth: true })
  }
  
  return errorResponse('Method not allowed', 405)
})
