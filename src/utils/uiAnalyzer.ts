import { UIUpload, UIAnalysis } from '../types';
import { analyzeWithGemini } from '../services/geminiService';

const UI_ANALYSIS_PROMPT = `You are an expert UI/UX analyst and web developer. Analyze the provided UI implementation comprehensively.

Evaluate these key areas:
1. **Usability**: Navigation clarity, user flow, consistency, learnability
2. **Accessibility**: ARIA labels, semantic HTML, keyboard navigation, screen reader support, color contrast
3. **Responsiveness**: Mobile-first design, breakpoints, flexible layouts, touch targets
4. **Performance**: Code efficiency, asset optimization, render-blocking resources
5. **Semantics**: Proper HTML5 elements, document structure, SEO considerations
6. **UX Patterns**: Modern UI patterns, user expectations, interaction feedback

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

async function fetchWebsiteHTML(url: string): Promise<string> {
  try {
    const corsProxy = 'https://api.allorigins.win/get?url=';
    const response = await fetch(corsProxy + encodeURIComponent(url));

    if (!response.ok) {
      throw new Error('Failed to fetch website');
    }

    const data = await response.json();
    return data.contents;
  } catch (error) {
    console.error('Error fetching website:', error);
    throw new Error('Unable to fetch website content. The site may block automated requests or the URL may be invalid.');
  }
}

function cleanHTML(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const scripts = tempDiv.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());

  let cleaned = tempDiv.innerHTML;

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length > 20000) {
    cleaned = cleaned.substring(0, 20000) + '...';
  }

  return cleaned;
}

export async function analyzeUI(upload: UIUpload, apiKey: string): Promise<UIAnalysis> {
  let htmlContent = '';
  let analysisContext = '';

  if (upload.type === 'html') {
    htmlContent = cleanHTML(upload.content);
    analysisContext = `Analyzing uploaded HTML file: ${upload.name}`;
  } else {
    analysisContext = `Analyzing website: ${upload.url}`;
    try {
      const fetchedHTML = await fetchWebsiteHTML(upload.url || '');
      htmlContent = cleanHTML(fetchedHTML);
    } catch (error) {
      throw new Error('Failed to fetch website content. Please try uploading the HTML file instead, or ensure the URL is accessible.');
    }
  }

  const analysisContent = `${analysisContext}

IMPORTANT: Base your analysis ONLY on the actual HTML code provided below. Be specific and reference actual elements, attributes, and patterns you see in the code.

HTML CODE TO ANALYZE:
${htmlContent}

Analyze the above HTML code for:
1. **Usability**: Examine navigation structure, form elements, interactive components
2. **Accessibility**: Check for ARIA attributes, alt texts, semantic tags, heading hierarchy
3. **Responsiveness**: Look for viewport meta tags, media queries in inline styles, responsive class patterns
4. **Performance**: Identify script tags, external resources, inline styles vs stylesheets
5. **Semantics**: Evaluate use of HTML5 semantic elements (header, nav, main, article, section, footer)
6. **UX Patterns**: Identify forms, buttons, navigation patterns, content organization

Be specific in your feedback - reference actual HTML elements and attributes you observe.`;

  const fullPrompt = `${UI_ANALYSIS_PROMPT}\n\n${analysisContent}`;

  const result = await analyzeWithGemini(fullPrompt, apiKey, null);

  return result as UIAnalysis;
}
