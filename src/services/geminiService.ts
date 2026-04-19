import { DesignAnalysis } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Check if Groq API is configured
const isGroqConfigured = () => {
  return GROQ_API_KEY && 
         GROQ_API_KEY.trim() !== '' && 
         GROQ_API_KEY !== 'your-groq-api-key-here';
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

export async function analyzeDesignWithGroq(imageFile: File): Promise<DesignAnalysis> {
  if (!isGroqConfigured()) {
    throw new Error('Groq API key not configured or invalid. Please set VITE_GROQ_API_KEY in your .env file.');
  }

  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

    const prompt = `Analyze this graphic design image and provide a comprehensive, encouraging design review. Be generous with scores (aim for 75-95 range) and focus on constructive feedback. Try to understand the design's purpose, target audience, and goals from visual context.

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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400) {
        throw new Error(`Groq API error (400): Invalid request. Check your API key and request format.`);
      } else if (response.status === 403) {
        throw new Error(`Groq API error (403): Access denied. Check your API key permissions.`);
      } else if (response.status === 429) {
        throw new Error(`Groq API rate limit exceeded (429). Please wait a moment and try again.`);
      } else {
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }
    }

    const rawData = await response.json();
    const data = sanitizeApiResponse(rawData);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid Groq response structure:', data);
      throw new Error('Invalid response from Groq API - missing choices or message');
    }

    const analysisText = data.choices[0].message.content;

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse response (first 500 chars):', analysisText.substring(0, 500));

      // Try to repair the JSON
      try {
        let repairedText = analysisText;
        // Remove any trailing commas before closing braces/brackets
        repairedText = repairedText.replace(/,(\s*[}\]])/g, '$1');
        analysis = JSON.parse(repairedText);
        console.log('Successfully repaired JSON');
      } catch (repairError) {
        console.error('Failed to repair JSON:', repairError);
        throw new Error(`Failed to parse Groq response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }
    
    // Validate the structure
    if (!analysis.overall || !analysis.categories || !analysis.strengths) {
      throw new Error('Invalid analysis structure from Groq');
    }

    return sanitizeApiResponse(analysis);
  } catch (error) {
    console.error('Groq analysis error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to Groq API. Please check your internet connection.');
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

export async function analyzeWithGroq(prompt: string, apiKey: string): Promise<any> {
  const effectiveApiKey = apiKey || GROQ_API_KEY;

  if (!effectiveApiKey || effectiveApiKey.trim() === '') {
    throw new Error('Groq API key not configured or invalid.');
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error(`Groq API rate limit exceeded (429). Please wait a moment and try again.`);
      }
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const rawData = await response.json();
    const data = sanitizeApiResponse(rawData);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Groq API');
    }

    const analysisText = data.choices[0].message.content;

    try {
      const analysis = JSON.parse(analysisText);
      return sanitizeApiResponse(analysis);
    } catch (parseError) {
      // If not JSON, return as string
      return { result: analysisText };
    }
  } catch (error) {
    console.error('Groq analysis error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to Groq API.');
    }
    throw error;
  }
}
