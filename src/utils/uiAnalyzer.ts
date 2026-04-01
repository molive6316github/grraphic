import { UIUpload, UIAnalysis } from '../types';

const UI_ANALYSIS_PROMPT = `You are an expert UI/UX analyst. Based on the website URL provided, analyze the likely UI/UX characteristics and provide a comprehensive evaluation.

Return ONLY valid JSON with this exact structure:
{
  "overall": <number 0-100>,
  "categories": {
    "usability": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
      "references": ["specific UI elements"]
    },
    "accessibility": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
      "references": ["specific accessibility concerns"]
    },
    "responsiveness": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
      "references": ["specific layout elements"]
    },
    "performance": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
      "references": ["specific performance indicators"]
    },
    "semantics": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
      "references": ["specific semantic elements"]
    },
    "uxPatterns": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
      "references": ["specific UX patterns observed"]
    }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "bestPractices": ["<practice 1>", "<practice 2>", "<practice 3>"]
}`;

async function fetchWebsiteScreenshot(url: string): Promise<string> {
  try {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-website`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to capture screenshot');
    }

    const data = await response.json();
    return data.screenshot;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw new Error('Unable to capture website screenshot. The site may block automated requests or the URL may be invalid.');
  }
}

async function analyzeWithGroq(url: string, apiKey: string): Promise<any> {
  const prompt = `${UI_ANALYSIS_PROMPT}

Analyze the website at URL: ${url}

Based on your knowledge of common UI/UX patterns and best practices for this type of website, provide a detailed analysis. Consider:
1. Navigation and information architecture
2. Visual hierarchy and typography
3. Color usage and accessibility
4. Mobile responsiveness expectations
5. Loading performance factors
6. Modern UX patterns usage

Respond ONLY with valid JSON, no other text.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert UI/UX analyst. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from Groq API');
  }

  // Parse JSON from the response
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Failed to parse analysis response as JSON');
  }
}

export async function analyzeUI(upload: UIUpload, apiKey: string): Promise<UIAnalysis & { screenshotUrl?: string }> {
  let screenshotUrl = '';

  if (upload.type === 'html') {
    throw new Error('HTML file upload is not yet supported for visual analysis. Please use the URL option instead.');
  }

  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!groqKey) {
    throw new Error('UI Analysis requires a Groq API key. Please add your VITE_GROQ_API_KEY in the environment variables.');
  }

  // Try to capture screenshot for display (non-blocking)
  try {
    const base64Image = await fetchWebsiteScreenshot(upload.url || '');
    screenshotUrl = `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.warn('Screenshot capture failed, continuing with analysis:', error);
    // Continue without screenshot - analysis will still work
  }

  try {
    const analysis = await analyzeWithGroq(upload.url || '', groqKey);
    
    return { 
      ...analysis, 
      screenshotUrl: screenshotUrl || undefined 
    } as UIAnalysis & { screenshotUrl?: string };
  } catch (error) {
    console.error('UI analysis error:', error);
    throw error;
  }
}
