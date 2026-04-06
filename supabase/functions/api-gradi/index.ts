import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { 
  withApiMiddleware, 
  jsonResponse, 
  errorResponse,
  createSupabaseClient
} from '../_shared/api-middleware.ts'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const DEFAULT_SYSTEM_PROMPT = `You are Gradi, an expert AI assistant created by Grraphic. You're available to help with absolutely anything - from creative and technical problems to general knowledge questions and everyday tasks.

You have deep knowledge of:
- Design principles, color theory, typography, composition
- UI/UX best practices and accessibility
- The Grraphic platform features

Be helpful, knowledgeable, honest, and conversational.`

async function chatWithGroq(messages: any[], systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  })

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.'
}

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/api-gradi', '')
  
  // POST /api/v1/gradi/chat - Send a message
  if (req.method === 'POST' && (path === '/chat' || path === '/' || !path)) {
    return withApiMiddleware(req, async (ctx) => {
      const body = await req.json()
      const { message, conversationHistory = [], sessionId } = body
      
      if (!message || typeof message !== 'string') {
        return errorResponse('Message is required', 400)
      }
      
      // Get custom system prompt if configured
      let systemPrompt = DEFAULT_SYSTEM_PROMPT
      try {
        const { data } = await ctx.supabase
          .from('system_config')
          .select('value')
          .eq('key', 'gradi_system_prompt')
          .single()
        if (data?.value) systemPrompt = data.value
      } catch (e) {
        // Use default
      }
      
      // Build messages array
      const messages = [
        ...conversationHistory.map((m: any) => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: message }
      ]
      
      const response = await chatWithGroq(messages, systemPrompt)
      
      // Optionally save to session
      if (sessionId && ctx.user) {
        await ctx.supabase
          .from('gradi_messages')
          .insert([
            { session_id: sessionId, user_id: ctx.user.id, role: 'user', content: message },
            { session_id: sessionId, user_id: ctx.user.id, role: 'assistant', content: response }
          ])
      }
      
      return jsonResponse({
        success: true,
        data: {
          message: response,
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      })
    }, { endpoint: 'gradi', requireAuth: true, checkQuota: true })
  }
  
  // POST /api/v1/gradi/sessions - Create a new session
  if (req.method === 'POST' && path === '/sessions') {
    return withApiMiddleware(req, async (ctx) => {
      const body = await req.json()
      const { title } = body
      
      const { data, error } = await ctx.supabase
        .from('gradi_sessions')
        .insert({
          user_id: ctx.user.id,
          title: title || 'New Chat'
        })
        .select('id, title, created_at')
        .single()
      
      if (error) {
        return errorResponse('Failed to create session', 500)
      }
      
      return jsonResponse({ success: true, data }, 201)
    }, { endpoint: 'gradi', requireAuth: true })
  }
  
  // GET /api/v1/gradi/sessions - List sessions
  if (req.method === 'GET' && path === '/sessions') {
    return withApiMiddleware(req, async (ctx) => {
      const { data, error } = await ctx.supabase
        .from('gradi_sessions')
        .select('id, title, created_at, updated_at')
        .eq('user_id', ctx.user.id)
        .order('updated_at', { ascending: false })
        .limit(50)
      
      if (error) {
        return errorResponse('Failed to fetch sessions', 500)
      }
      
      return jsonResponse({ success: true, data })
    }, { endpoint: 'gradi', requireAuth: true })
  }
  
  // GET /api/v1/gradi/sessions/:id - Get session with messages
  if (req.method === 'GET' && path.startsWith('/sessions/')) {
    return withApiMiddleware(req, async (ctx) => {
      const sessionId = path.replace('/sessions/', '')
      
      const { data: session, error } = await ctx.supabase
        .from('gradi_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', ctx.user.id)
        .single()
      
      if (error || !session) {
        return errorResponse('Session not found', 404)
      }
      
      const { data: messages } = await ctx.supabase
        .from('gradi_messages')
        .select('role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      return jsonResponse({
        success: true,
        data: {
          ...session,
          messages: messages || []
        }
      })
    }, { endpoint: 'gradi', requireAuth: true })
  }
  
  return errorResponse('Method not allowed', 405)
})
