import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { 
  withApiMiddleware, 
  jsonResponse, 
  errorResponse
} from '../_shared/api-middleware.ts'

const DAILY_QUOTAS = {
  free: { analysis: 1, gradi: 10, 'site-designer': 2 },
  pro: { analysis: -1, gradi: -1, 'site-designer': -1 },
}

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/api-usage', '')
  
  // GET /api/v1/usage - Get current usage stats
  if (req.method === 'GET' && (!path || path === '/')) {
    return withApiMiddleware(req, async (ctx) => {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's usage by endpoint
      const { data: usageData } = await ctx.supabase
        .from('api_usage')
        .select('endpoint, request_count')
        .eq('user_id', ctx.user.id)
        .eq('usage_date', today)
      
      // Get historical usage (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: historicalData } = await ctx.supabase
        .from('api_usage')
        .select('endpoint, request_count, usage_date')
        .eq('user_id', ctx.user.id)
        .gte('usage_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('usage_date', { ascending: true })
      
      // Calculate usage
      const quotas = DAILY_QUOTAS[ctx.tier]
      const todayUsage: any = {}
      
      for (const usage of usageData || []) {
        todayUsage[usage.endpoint] = usage.request_count
      }
      
      // Format response
      const endpoints = ['analysis', 'gradi', 'site-designer']
      const current: any = {}
      
      for (const endpoint of endpoints) {
        const used = todayUsage[endpoint] || 0
        const limit = quotas[endpoint as keyof typeof quotas]
        current[endpoint] = {
          used,
          limit: limit === -1 ? 'unlimited' : limit,
          remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - used),
          percentage: limit === -1 ? 0 : Math.round((used / limit) * 100)
        }
      }
      
      // Group historical by date
      const daily: any = {}
      for (const usage of historicalData || []) {
        if (!daily[usage.usage_date]) {
          daily[usage.usage_date] = { date: usage.usage_date, total: 0, byEndpoint: {} }
        }
        daily[usage.usage_date].total += usage.request_count
        daily[usage.usage_date].byEndpoint[usage.endpoint] = usage.request_count
      }
      
      return jsonResponse({
        success: true,
        data: {
          tier: ctx.tier,
          today: {
            date: today,
            usage: current,
            resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
          },
          history: Object.values(daily).slice(-30),
          totals: {
            last7Days: Object.values(daily).slice(-7).reduce((sum: number, d: any) => sum + d.total, 0),
            last30Days: Object.values(daily).reduce((sum: number, d: any) => sum + d.total, 0)
          }
        }
      })
    }, { endpoint: 'usage', requireAuth: true })
  }
  
  // GET /api/v1/usage/keys - Get usage by API key
  if (req.method === 'GET' && path === '/keys') {
    return withApiMiddleware(req, async (ctx) => {
      const { data, error } = await ctx.supabase
        .from('api_keys')
        .select(`
          id, name, key_prefix, last_used_at,
          api_usage (endpoint, request_count, usage_date)
        `)
        .eq('user_id', ctx.user.id)
      
      if (error) {
        return errorResponse('Failed to fetch key usage', 500)
      }
      
      const keyUsage = data?.map((key: any) => {
        const totalRequests = key.api_usage?.reduce((sum: number, u: any) => sum + u.request_count, 0) || 0
        return {
          id: key.id,
          name: key.name,
          keyPrefix: key.key_prefix,
          lastUsed: key.last_used_at,
          totalRequests,
          recentUsage: key.api_usage?.slice(0, 10) || []
        }
      })
      
      return jsonResponse({ success: true, data: keyUsage })
    }, { endpoint: 'usage', requireAuth: true })
  }
  
  return errorResponse('Method not allowed', 405)
})
