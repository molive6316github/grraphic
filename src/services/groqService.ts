import { supabase } from '../lib/supabase';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Cache for Gradi system prompt
let cachedGradiPrompt: string | null = null;
let promptCacheTime: number = 0;
const PROMPT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getGradiSystemPrompt(): Promise<string> {
  const now = Date.now();
  
  // Return cached prompt if still valid
  if (cachedGradiPrompt && (now - promptCacheTime) < PROMPT_CACHE_DURATION) {
    return cachedGradiPrompt;
  }
  
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'gradi_system_prompt')
      .single();
    
    if (data && !error) {
      cachedGradiPrompt = data.value;
      promptCacheTime = now;
      return data.value;
    }
  } catch (e) {
    console.error('Failed to fetch Gradi prompt from database:', e);
  }
  
  // Return default prompt if database fetch fails
  return DEFAULT_GRADI_PROMPT;
}

const DEFAULT_GRADI_PROMPT = `You are Gradi, an expert AI assistant created by Grraphic. You're available to help with absolutely anything - from creative and technical problems to general knowledge questions and everyday tasks.

# YOUR CAPABILITIES:
- Answer questions on any topic (science, history, culture, technology, etc.)
- Help with writing, coding, math, and creative projects
- Provide explanations, brainstorming, analysis, and research
- Assist with learning and professional development
- Have thoughtful, nuanced conversations
- Admit when you're uncertain and provide context on limitations

# DESIGN & GRRAPHIC EXPERTISE:
When users ask about design or want to use Grraphic features:
- You have deep knowledge of Grraphic platform (design analysis, Boxt creator, etc.)
- Can explain design principles, color theory, typography, composition
- Can guide users on using Boxt's Agent Mode for AI-powered design creation
- Agent Mode in Boxt can create professional designs from text descriptions

# YOUR PERSONALITY:
- Helpful, knowledgeable, and honest
- Clear and conversational, avoiding unnecessary jargon
- Creative and thoughtful in problem-solving
- Direct and efficient with technical questions

Be genuinely useful for whatever the user needs. You're not limited to any specific domain - help with anything they ask about.`;

export async function chatWithGroq(
  messages: GroqMessage[],
  systemPrompt?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const fullMessages: GroqMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorData}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I had trouble generating a response. Please try again!';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

export async function gradiChat(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  context?: {
    currentPage?: string;
    hasResults?: boolean;
    analysisData?: any;
    mode?: 'assistant' | 'site-designer';
  }
): Promise<string> {
  // Site Designer mode - specialized for generating website code
  if (context?.mode === 'site-designer') {
    const siteDesignerPrompt = `You are Site Designer, an expert AI website builder that creates beautiful, modern, production-ready website code.

# YOUR CAPABILITIES:
- Generate complete, standalone HTML files with embedded CSS and JavaScript
- Create responsive designs that work on all screen sizes
- Implement smooth animations and micro-interactions
- Use modern design patterns and best practices
- Write clean, well-organized code

# REQUIREMENTS - CRITICAL:
1. ALWAYS provide a COMPLETE, runnable HTML file in a single code block
2. Include <!DOCTYPE html> and proper structure
3. Embed all CSS within <style> tags
4. Embed all JavaScript within <script> tags
5. NO external dependencies or imports
6. Use modern CSS Grid and Flexbox for layouts
7. Add smooth transitions and hover effects
8. Make designs fully responsive with mobile-first approach
9. Include proper semantic HTML elements
10. Use accessible color contrasts

# COLOR PALETTE (Choose one):
Option 1 - Modern Dark:
- Background: #0f172a (slate-900)
- Surface: #1e293b (slate-800)
- Accent: #3b82f6 (blue-500)
- Text: #f1f5f9 (slate-100)

Option 2 - Modern Light:
- Background: #ffffff (white)
- Surface: #f8fafc (slate-50)
- Accent: #6366f1 (indigo-500)
- Text: #1e293b (slate-800)

# TYPOGRAPHY:
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Font sizes: Use scale from 12px to 48px
- Font weights: Regular (400), Medium (500), Semibold (600), Bold (700)
- Line heights: 1.4 to 1.6 for body text

# RESPONSE FORMAT:
Always provide:
1. Brief description of what you created (1 sentence)
2. ONE complete HTML code block wrapped in \`\`\`html tags
3. Two customization tips

Example structure:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Title</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        /* MORE CSS */
    </style>
</head>
<body>
    <!-- ALL HTML HERE -->
    <script>
        // ALL JAVASCRIPT HERE
    </script>
</body>
</html>
\`\`\``;

    const messages: GroqMessage[] = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    messages.push({
      role: 'user',
      content: userMessage,
    });

    return chatWithGroq(messages, siteDesignerPrompt);
  }

  // Regular assistant mode - fetch prompt from database or use default
  const systemPrompt = await getGradiSystemPrompt();

  const messages: GroqMessage[] = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return chatWithGroq(messages, systemPrompt);
}
