import { DesignAnalysis } from '../types';

// Hack Club AI (OpenAI-compatible proxy). Design analysis is a vision task,
// so the primary model must accept image input. On any error we fall back to
// the free auto-router. Budget note: the Hack Club key is capped at ~$3/day,
// so a cheap vision model is used by default.
const HACKCLUB_API_URL = 'https://ai.hackclub.com/proxy/v1/chat/completions';
const API_KEY = import.meta.env.VITE_HACKCLUB_API_KEY as string | undefined;

// Override the primary model via VITE_HACKCLUB_MODEL without touching code.
// Must be a vision-capable model on the proxy's roster. The default is a free
// vision model (the shared key has no paid credits); paid models return 402.
const PRIMARY_MODEL = (import.meta.env.VITE_HACKCLUB_MODEL as string | undefined)?.trim()
  || 'inclusionai/ling-3.0-flash-vl:free';

// Tried in order after the primary fails. Both are free; the last is the
// generic free auto-router the user asked us to fall back to.
const FALLBACK_MODELS = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'openrouter/free',
];

const isConfigured = () =>
  !!API_KEY && API_KEY.trim() !== '' && API_KEY !== 'your-hackclub-api-key-here';

// Strip any potentially sensitive metadata the proxy might echo back.
const sanitizeApiResponse = (data: any): any => {
  if (data && typeof data === 'object') {
    const sanitized = { ...data };
    delete sanitized.metadata;
    delete sanitized.debug;
    delete sanitized.internal;
    return sanitized;
  }
  return data;
};

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

For each category, provide:
- score: number between 0-100 based on design quality (be generous, most designs should score 70-95)
- feedback: detailed explanation of the assessment (2-3 sentences)
- improvementIdeas: array of exactly 3 specific, actionable improvement ideas
- references: array of 2-4 specific visual elements you're talking about (be concrete, like "the blue headline", "spacing between logo and menu", "contrast of the footer text")

Categories to analyze:
- typography: Font choices, readability, hierarchy, consistency
- colorHarmony: Color palette, balance, mood, accessibility
- composition: Layout, balance, focal points, visual flow
- hierarchy: Information organization, emphasis, clarity
- spacing: White space, margins, padding, visual breathing room
- contrast: Text/background contrast, visual separation, accessibility

Consider the design's context and purpose when scoring. A simple design that achieves its goal effectively should score well.

Also provide:
- strengths: array of 3-4 positive aspects of the design
- improvements: array of 2-3 areas that need work
- designPrinciples: array of design principles demonstrated

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON with NO trailing commas
- Do NOT use line breaks or newlines within string values - use spaces instead
- Do NOT use unescaped quotes within strings
- Do NOT wrap the JSON in markdown code blocks
- Do NOT include any text before or after the JSON object
- Keep all string values on a single line
- Be encouraging and constructive in your feedback
- Focus on what works well and provide gentle guidance for improvements
- Be specific and actionable in your improvement ideas`;

// One request to the proxy for a given model. Returns the raw assistant text.
async function requestCompletion(model: string, dataUrl: string): Promise<string> {
  const response = await fetch(HACKCLUB_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
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
      // Lower temperature yields noticeably more reliable JSON from the free
      // models (fewer malformed keys/strings) without hurting review quality.
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hack Club AI error (${response.status}) on ${model}: ${errorText}`);
  }

  const data = sanitizeApiResponse(await response.json());
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Invalid response from Hack Club AI on ${model} - missing message content`);
  }
  return content;
}

// Free models sometimes misplace the top-level arrays inside `categories`
// (e.g. categories.strengths instead of a top-level strengths). Lift them out
// so the rest of the app sees the shape it expects.
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

function parseAnalysis(analysisText: string): DesignAnalysis {
  let analysis: any;
  try {
    analysis = JSON.parse(analysisText);
  } catch {
    // Common failure modes: markdown fences, trailing commas. Repair and retry.
    const repaired = analysisText
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
    throw new Error('Invalid analysis structure from Hack Club AI');
  }
  return sanitizeApiResponse(analysis) as DesignAnalysis;
}

export async function analyzeDesignWithHackClub(imageFile: File): Promise<DesignAnalysis> {
  if (!isConfigured()) {
    throw new Error(
      'Hack Club AI key not configured. Set VITE_HACKCLUB_API_KEY in your .env file.'
    );
  }

  const base64Image = await fileToBase64(imageFile);
  const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

  // Try the primary model, then each fallback in turn (de-duplicated). Each
  // model gets two attempts, since the free models occasionally emit malformed
  // JSON that a fresh sample usually fixes.
  const models = [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])];
  const ATTEMPTS_PER_MODEL = 2;
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const content = await requestCompletion(model, dataUrl);
        return parseAnalysis(content);
      } catch (error) {
        lastError = error;
        console.error(`Hack Club AI analysis failed on ${model} (attempt ${attempt}):`, error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          // Network-level failure won't be fixed by retrying — stop early.
          throw new Error('Network error: Unable to reach Hack Club AI. Check your connection.');
        }
        // Otherwise retry this model, then fall through to the next one.
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Hack Club AI analysis failed on all models.');
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
