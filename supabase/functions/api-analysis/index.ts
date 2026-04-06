import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { 
  withApiMiddleware, 
  jsonResponse, 
  errorResponse,
  createSupabaseClient
} from '../_shared/api-middleware.ts'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

async function analyzeDesign(url: string, imageBase64?: string): Promise<any> {
  // Use Groq for analysis
  const prompt = `Analyze the UI/UX design of this website: ${url}

Provide a comprehensive analysis with scores (0-100) for:
1. Layout & Composition - visual hierarchy, spacing, grid usage
2. Color Scheme - harmony, contrast, accessibility
3. Typography - readability, hierarchy, font choices
4. Visual Consistency - patterns, components, brand alignment
5. User Experience - navigation, clarity, call-to-actions
6. Accessibility - contrast ratios, text sizes, interactive elements
7. Mobile Responsiveness - adaptability potential
8. Overall Impression - professionalism, creativity

For each category, provide:
- Score (0-100)
- 2-3 specific observations
- 1-2 improvement suggestions

Return as JSON with this structure:
{
  "overallScore": number,
  "categories": {
    "layout": { "score": number, "observations": string[], "suggestions": string[] },
    "color": { ... },
    "typography": { ... },
    "consistency": { ... },
    "ux": { ... },
    "accessibility": { ... },
    "responsiveness": { ... },
    "impression": { ... }
  },
  "summary": "Brief overall assessment",
  "topStrengths": ["strength1", "strength2"],
  "topImprovements": ["improvement1", "improvement2"]
}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert UI/UX designer and analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  })

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  
  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse analysis:', e)
  }
  
  return {
    overallScore: 75,
    error: 'Analysis parsing failed',
    raw: content
  }
}

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/api-analysis', '')
  
  // POST /api/v1/analysis - Analyze a design
  if (req.method === 'POST' && (!path || path === '/')) {
    return withApiMiddleware(req, async (ctx) => {
      const body = await req.json()
      const { url: targetUrl, imageBase64, saveResult = true } = body
      
      if (!targetUrl && !imageBase64) {
        return errorResponse('Either url or imageBase64 is required', 400)
      }
      
      // Perform analysis
      const analysis = await analyzeDesign(targetUrl, imageBase64)
      
      // Optionally save to database
      let savedId = null
      if (saveResult && ctx.user) {
        const { data, error } = await ctx.supabase
          .from('design_analyses')
          .insert({
            user_id: ctx.user.id,
            image_url: targetUrl || 'base64-upload',
            overall_score: analysis.overallScore,
            layout_score: analysis.categories?.layout?.score || 0,
            color_score: analysis.categories?.color?.score || 0,
            typography_score: analysis.categories?.typography?.score || 0,
            consistency_score: analysis.categories?.consistency?.score || 0,
            layout_details: analysis.categories?.layout || {},
            color_details: analysis.categories?.color || {},
            typography_details: analysis.categories?.typography || {},
            consistency_details: analysis.categories?.consistency || {},
            is_public: 'no',
            source: 'api'
          })
          .select('id')
          .single()
        
        if (data) savedId = data.id
      }
      
      return jsonResponse({
        success: true,
        data: {
          id: savedId,
          analysis,
          analyzedAt: new Date().toISOString()
        }
      })
    }, { endpoint: 'analysis', requireAuth: true, checkQuota: true })
  }
  
  // GET /api/v1/analysis/:id - Get analysis by ID
  if (req.method === 'GET' && path.startsWith('/') && path.length > 1) {
    return withApiMiddleware(req, async (ctx) => {
      const analysisId = path.slice(1)
      
      const { data, error } = await ctx.supabase
        .from('design_analyses')
        .select('*')
        .eq('id', analysisId)
        .single()
      
      if (error || !data) {
        return errorResponse('Analysis not found', 404)
      }
      
      // Check access
      if (data.user_id !== ctx.user?.id && data.is_public !== 'yes') {
        return errorResponse('Access denied', 403)
      }
      
      return jsonResponse({ success: true, data })
    }, { endpoint: 'analysis', requireAuth: true })
  }
  
  // GET /api/v1/analysis - List user's analyses
  if (req.method === 'GET' && (!path || path === '/')) {
    return withApiMiddleware(req, async (ctx) => {
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      
      const { data, error, count } = await ctx.supabase
        .from('design_analyses')
        .select('id, image_url, overall_score, created_at, is_public', { count: 'exact' })
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) {
        return errorResponse('Failed to fetch analyses', 500)
      }
      
      return jsonResponse({
        success: true,
        data,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: offset + limit < (count || 0)
        }
      })
    }, { endpoint: 'analysis', requireAuth: true })
  }
  
  return errorResponse('Method not allowed', 405)
})
