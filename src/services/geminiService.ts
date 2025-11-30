import { DesignAnalysis } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Check if Gemini API is configured
const isGeminiConfigured = () => {
  return GEMINI_API_KEY && 
         GEMINI_API_KEY.trim() !== '' && 
         GEMINI_API_KEY !== 'your-gemini-api-key-here' &&
         GEMINI_API_KEY.startsWith('AIza');
};

// Sanitize API responses to remove any potential sensitive data
const sanitizeApiResponse = (data: any): any => {
  // Remove any potential sensitive metadata from API responses
  if (data && typeof data === 'object') {
    const sanitized = { ...data };
    delete sanitized.metadata;
    delete sanitized.debug;
    delete sanitized.internal;
    return sanitized;
  }
  return data;
};

export async function analyzeDesignWithGemini(imageFile: File): Promise<DesignAnalysis> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key not configured or invalid. Please set a valid VITE_GEMINI_API_KEY in your .env file. The key should start with "AIza".');
  }

  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

    // Ensure we don't send any sensitive file metadata
    const sanitizedFileName = 'design_image.' + (mimeType.split('/')[1] || 'png');

    const requestBody = {
      contents: [{
        parts: [
          {
            text: `Analyze this graphic design image and provide a comprehensive, encouraging design review. Be generous with scores (aim for 75-95 range) and focus on constructive feedback. Try to understand the design's purpose, target audience, and goals from visual context.

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
- visualReferences: (OPTIONAL - only include if you can accurately identify specific regions) array of 1-2 bounding boxes. Coordinates are NORMALIZED (0-1 range, use simple decimals like 0.1, 0.5):
  * {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.15}
  * ONLY include visualReferences if you're confident about the locations. It's better to omit than to guess.

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
- Be specific and actionable in your improvement ideas`
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      }
    };

    const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400) {
        throw new Error(`Gemini API error (400): Invalid request. Check if the Generative Language API is enabled and your API key has proper restrictions configured.`);
      } else if (response.status === 403) {
        throw new Error(`Gemini API error (403): Access denied. Check your API key permissions and ensure localhost:5173 is allowed in HTTP referrer restrictions.`);
      } else if (response.status === 404) {
        throw new Error(`Gemini API error (404): Model not found. The 'gemini-2.5-flash' model may not be available or accessible with your current API key/project configuration.`);
      } else if (response.status === 429) {
        throw new Error(`Gemini API rate limit exceeded (429). The free tier allows 15 requests per minute. Please wait a moment and try again, or consider upgrading to a paid plan for higher limits.`);
      } else {
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
    }

    const rawData = await response.json();
    const data = sanitizeApiResponse(rawData);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response structure:', data);
      throw new Error('Invalid response from Gemini API - missing candidates or content');
    }

    if (!data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid parts structure:', data.candidates[0].content);
      throw new Error('Invalid response from Gemini API - missing content parts');
    }

    const analysisText = data.candidates[0].content.parts[0].text;

    // With responseMimeType: "application/json", Gemini returns valid JSON directly
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse response:', analysisText);
      throw new Error(`Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    // Validate the structure
    if (!analysis.overall || !analysis.categories || !analysis.strengths) {
      throw new Error('Invalid analysis structure from Gemini');
    }

    // Sanitize the final analysis to ensure no sensitive data
    const sanitizedAnalysis = sanitizeApiResponse(analysis);
    return sanitizedAnalysis;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection, ensure the Generative Language API is enabled in Google Cloud Console, and verify your API key restrictions allow requests from localhost:5173.');
    }
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeWithGemini(prompt: string, apiKey: string, url?: string | null): Promise<any> {
  const effectiveApiKey = apiKey || GEMINI_API_KEY;

  if (!effectiveApiKey || effectiveApiKey.trim() === '' || !effectiveApiKey.startsWith('AIza')) {
    throw new Error('Gemini API key not configured or invalid.');
  }

  try {
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      }
    };

    const apiUrl = `${GEMINI_API_URL}?key=${effectiveApiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error(`Gemini API rate limit exceeded (429). The free tier allows 15 requests per minute. Please wait a moment and try again, or consider upgrading to a paid plan for higher limits.`);
      }
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const rawData = await response.json();
    const data = sanitizeApiResponse(rawData);

    if (!data.candidates?.[0]?.content?.parts?.[0]) {
      throw new Error('Invalid response from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;

    try {
      const analysis = JSON.parse(analysisText);
      return sanitizeApiResponse(analysis);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(`Failed to parse Gemini response as JSON`);
    }
  } catch (error) {
    console.error('Gemini analysis error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to Gemini API.');
    }
    throw error;
  }
}