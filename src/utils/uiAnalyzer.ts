import { UIUpload, UIAnalysis } from '../types';

const UI_ANALYSIS_PROMPT = `You are an expert UI/UX analyst and designer. Analyze the provided website/UI screenshot comprehensively based on what you can see visually.

Evaluate these key areas based on visual inspection:
1. **Usability**: Navigation clarity, button placement, visual hierarchy, ease of understanding the interface
2. **Accessibility**: Color contrast, text readability, visual indicators, icon clarity
3. **Responsiveness**: Layout balance, spacing, visual organization, content density
4. **Performance**: Visual complexity, number of elements, loading indicators visible
5. **Semantics**: Clear content structure, proper visual grouping, logical flow
6. **UX Patterns**: Modern design patterns, consistency, visual feedback elements, call-to-action clarity

Return ONLY valid JSON with this exact structure:
{
  "overall": <number 0-100>,
  "categories": {
    "usability": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"]
    },
    "accessibility": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"]
    },
    "responsiveness": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"]
    },
    "performance": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"]
    },
    "semantics": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"]
    },
    "uxPatterns": {
      "score": <number 0-100>,
      "feedback": "<detailed assessment>",
      "improvementIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"]
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

async function fileToBase64(file: File): Promise<string> {
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

export async function analyzeUI(upload: UIUpload, apiKey: string): Promise<UIAnalysis> {
  let base64Image = '';
  let mimeType = 'image/jpeg';
  let analysisContext = '';

  if (upload.type === 'html') {
    throw new Error('HTML file upload is not yet supported for visual analysis. Please use the URL option instead.');
  } else {
    analysisContext = `Analyzing website screenshot: ${upload.url}`;
    try {
      base64Image = await fetchWebsiteScreenshot(upload.url || '');
    } catch (error) {
      throw new Error('Failed to capture website screenshot. Please ensure the URL is accessible and valid.');
    }
  }

  const analysisPrompt = `${UI_ANALYSIS_PROMPT}

${analysisContext}

IMPORTANT: Analyze what you can SEE in the screenshot. Focus on visual design, layout, colors, typography, spacing, and overall user interface appearance.

Provide specific feedback based on:
1. **Usability**: How clear and intuitive does the interface appear? Are buttons and navigation easy to identify?
2. **Accessibility**: Is the text readable? Is there good color contrast? Are visual elements clear?
3. **Responsiveness**: Does the layout look balanced? Is content well-organized visually?
4. **Performance**: How complex does the interface appear? Is it cluttered or clean?
5. **Semantics**: Is the visual hierarchy clear? Can you easily identify different sections?
6. **UX Patterns**: Does it follow modern design patterns? Are interactive elements obvious?

Be specific about what you observe in the visual design.`;

  if (!apiKey || !apiKey.startsWith('AIza')) {
    throw new Error('Gemini API key not configured or invalid.');
  }

  try {
    const requestBody = {
      contents: [{
        parts: [
          {
            text: analysisPrompt
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

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    const url = `${GEMINI_API_URL}?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error (${response.status})`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]) {
      throw new Error('Invalid response from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    const analysis = JSON.parse(analysisText);

    return analysis as UIAnalysis;
  } catch (error) {
    console.error('UI analysis error:', error);
    throw error;
  }
}
