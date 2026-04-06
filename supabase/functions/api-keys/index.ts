import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { 
  withApiMiddleware, 
  jsonResponse, 
  errorResponse,
  generateApiKey,
  createSupabaseClient
} from '../_shared/api-middleware.ts'

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/api-keys', '')
  
  // GET /api-keys - List all API keys
  if (req.method === 'GET' && !path) {
    return withApiMiddleware(req, async (ctx) => {
      const { data, error } = await ctx.supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        return errorResponse('Failed to fetch API keys', 500)
      }
      
      return jsonResponse({ 
        success: true,
        data: data,
        count: data.length
      })
    }, { endpoint: 'api-keys', requireAuth: true })
  }
  
  // POST /api-keys - Create new API key
  if (req.method === 'POST' && !path) {
    return withApiMiddleware(req, async (ctx) => {
      const body = await req.json()
      const { name, scopes = ['read', 'write'], expiresIn } = body
      
      if (!name || name.length < 3) {
        return errorResponse('Name must be at least 3 characters', 400)
      }
      
      // Check key limit based on tier
      const { count } = await ctx.supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ctx.user.id)
      
      const maxKeys = ctx.tier === 'pro' ? 10 : 1
      if (count >= maxKeys) {
        return errorResponse(`API key limit reached. ${ctx.tier === 'free' ? 'Upgrade to Pro for up to 10 keys.' : 'Maximum 10 keys allowed.'}`, 403, 'KEY_LIMIT_REACHED')
      }
      
      // Generate key
      const { key, hash, prefix } = await generateApiKey()
      
      // Calculate expiration
      let expiresAt = null
      if (expiresIn) {
        expiresAt = new Date()
        if (expiresIn === '30d') expiresAt.setDate(expiresAt.getDate() + 30)
        else if (expiresIn === '90d') expiresAt.setDate(expiresAt.getDate() + 90)
        else if (expiresIn === '1y') expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        else if (expiresIn === 'never') expiresAt = null
      }
      
      const { data, error } = await ctx.supabase
        .from('api_keys')
        .insert({
          user_id: ctx.user.id,
          name,
          key_hash: hash,
          key_prefix: prefix,
          scopes,
          expires_at: expiresAt?.toISOString() || null
        })
        .select('id, name, key_prefix, scopes, expires_at, created_at')
        .single()
      
      if (error) {
        return errorResponse('Failed to create API key', 500)
      }
      
      return jsonResponse({
        success: true,
        message: 'API key created successfully. Save this key securely - it will not be shown again.',
        data: {
          ...data,
          key // Only returned on creation
        }
      }, 201)
    }, { endpoint: 'api-keys', requireAuth: true })
  }
  
  // DELETE /api-keys/:id - Delete API key
  if (req.method === 'DELETE' && path.startsWith('/')) {
    return withApiMiddleware(req, async (ctx) => {
      const keyId = path.slice(1)
      
      const { error } = await ctx.supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', ctx.user.id)
      
      if (error) {
        return errorResponse('Failed to delete API key', 500)
      }
      
      return jsonResponse({ success: true, message: 'API key deleted' })
    }, { endpoint: 'api-keys', requireAuth: true })
  }
  
  // PUT /api-keys/:id - Update API key
  if (req.method === 'PUT' && path.startsWith('/')) {
    return withApiMiddleware(req, async (ctx) => {
      const keyId = path.slice(1)
      const body = await req.json()
      const { name, is_active, scopes } = body
      
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (is_active !== undefined) updateData.is_active = is_active
      if (scopes !== undefined) updateData.scopes = scopes
      updateData.updated_at = new Date().toISOString()
      
      const { data, error } = await ctx.supabase
        .from('api_keys')
        .update(updateData)
        .eq('id', keyId)
        .eq('user_id', ctx.user.id)
        .select('id, name, key_prefix, scopes, is_active, expires_at, updated_at')
        .single()
      
      if (error) {
        return errorResponse('Failed to update API key', 500)
      }
      
      return jsonResponse({ success: true, data })
    }, { endpoint: 'api-keys', requireAuth: true })
  }
  
  return errorResponse('Method not allowed', 405)
})
