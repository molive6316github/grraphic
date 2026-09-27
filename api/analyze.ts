// Server-side proxy for Hack Club AI (OpenAI-compatible). The Hack Club proxy
// sends no CORS headers, so the browser cannot call it directly — this
// same-origin edge function forwards the request and keeps the API key off the
// client. Design analysis is a vision task, so the models must accept images;
// the key has no paid credits, so free vision models are used with the free
// auto-router as a last resort.

export const config = { runtime: 'edge' };

const HACKCLUB_API_URL = 'https://ai.hackclub.com/proxy/v1/chat/completions';

// Prefer a non-VITE server var (never shipped to the browser); fall back to the
// VITE var so an existing deployment keeps working.
const API_KEY = process.env.HACKCLUB_API_KEY || process.env.VITE_HACKCLUB_API_KEY;

const PRIMARY_MODEL = (process.env.HACKCLUB_MODEL || process.env.VITE_HACKCLUB_MODEL || '').trim()
  || 'inclusionai/ling-3.0-flash-vl:free';
const FALLBACK_MODELS = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'openrouter/free',
];
const ATTEMPTS_PER_MODEL = 2;

const DESIGN_PROMPT = `Analyze this graphic design image and provide a comprehensive, encouraging design review. Be generous with scores (aim for 75-95 range) and focus on constructive feedback. Try to understand the design's purpose, target audience, and goals from visual context.

CRITICAL: Return ONLY valid JSON. Do NOT include any markdown formatting, code blocks, or extra text. Return ONLY the raw JSON object with this exact structure:

{
  "overall": number (0-100),
  "designContext": {
    "perceivedGoal": "string describing what you think this design is trying to achieve",
    "targetAudience": "string describing who you think this is designed for",
    "designType": "string describing the type of design (poster, logo, web banner, etc.)"
  },
  "categories": {
    "typography": {
      "score": number (0-100),
      "feedback": "detailed explanation string",
      "improvementIdeas": ["idea 1", "idea 2", "idea 3"],
      "references": ["specific element you're referring to, like 'headline font', 'body text', 'button labels'"]
    },
    "colorHarmony": {
      "score": number (0-100),
      "feedback": "detailed explanation string",
      "improvementIdeas": ["idea 1", "idea 2", "idea 3"],
      "references": ["specific colors or elements you're referring to, like 'blue background', 'orange CTA button', 'text color'"]
    },
    "composition": {
      "score": number (0-100),
      "feedback": "detailed explanation string",
      "improvementIdeas": ["idea 1", "idea 2", "idea 3"],
      "references": ["specific layout elements you're referring to, like 'top section', 'left sidebar', 'footer area'"]
    },
    "hierarchy": {
      "score": number (0-100),
      "feedback": "detailed explanation string",
      "improvementIdeas": ["idea 1", "idea 2", "idea 3"],
      "references": ["specific hierarchy elements you're referring to, like 'main heading', 'subheadings', 'call-to-action'"]
    },
    "spacing": {
      "score": number (0-100),
      "feedback": "detailed explanation string",
      "improvementIdeas": ["idea 1", "idea 2", "idea 3"],
      "references": ["specific spacing areas you're referring to, like 'margins around logo', 'padding between sections', 'line spacing'"]
    },
    "contrast": {
      "score": number (0-100),
      "feedback": "detailed explanation string",
      "improvementIdeas": ["idea 1", "idea 2", "idea 3"],
      "references": ["specific contrast issues you're referring to, like 'text on background', 'button visibility', 'readability of captions'"]
    }
  },
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "designPrinciples": ["principle 1", "principle 2", "principle 3"]
}

For each category provide a score (0-100, be generous), 2-3 sentences of feedback, exactly 3 actionable improvementIdeas, and 2-4 concrete references to visual elements. Also provide 3-4 strengths, 2-3 improvements, and the designPrinciples demonstrated.

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON with NO trailing commas
- Do NOT use line breaks within string values - use spaces instead
- Do NOT use unescaped quotes within strings
- Do NOT wrap the JSON in markdown code blocks
- Do NOT include any text before or after the JSON object
- Keep all string values on a single line
- Be encouraging, specific, and constructive`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requestCompletion(model: string, dataUrl: string): Promise<string> {
  const response = await fetch(HACKCLUB_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: DESIGN_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hack Club AI error (${response.status}) on ${model}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Invalid response from ${model} - missing message content`);
  }
  return content;
}

// Free models sometimes nest the top-level arrays inside `categories`; lift them out.
function normalizeAnalysis(analysis: any): any {
  const categories = analysis?.categories;
  if (categories && typeof categories === 'object') {
    for (const key of ['strengths', 'improvements', 'designPrinciples', 'designContext']) {
      if (analysis[key] == null && categories[key] != null) {
        analysis[key] = categories[key];
        delete categories[key];
      }
    }
  }
  return analysis;
}

function parseAnalysis(text: string): any {
  let analysis: any;
  try {
    analysis = JSON.parse(text);
  } catch {
    const repaired = text
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .replace(/,(\s*[}\]])/g, '$1')
      .trim();
    const start = repaired.indexOf('{');
    const end = repaired.lastIndexOf('}');
    analysis = JSON.parse(start >= 0 && end >= 0 ? repaired.slice(start, end + 1) : repaired);
  }

  analysis = normalizeAnalysis(analysis);
  if (!analysis.overall || !analysis.categories || !analysis.strengths) {
    throw new Error('Invalid analysis structure');
  }
  return analysis;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (!API_KEY) {
    return json({ error: 'Hack Club AI key not configured on the server (set HACKCLUB_API_KEY).' }, 500);
  }

  let imageDataUrl: unknown;
  try {
    const body = await request.json();
    imageDataUrl = body?.imageDataUrl;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:')) {
    return json({ error: 'Missing or invalid imageDataUrl' }, 400);
  }

  const models = [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const content = await requestCompletion(model, imageDataUrl);
        return json({ analysis: parseAnalysis(content), model });
      } catch (error) {
        lastError = error;
        console.error(`analyze: ${model} attempt ${attempt} failed:`, error);
      }
    }
  }

  return json(
    { error: lastError instanceof Error ? lastError.message : 'Analysis failed on all models.' },
    502
  );
}
