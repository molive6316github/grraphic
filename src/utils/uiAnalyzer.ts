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

export async function analyzeUI(upload: UIUpload, apiKey: string): Promise<UIAnalysis> {
  let analysisContent = '';

  if (upload.type === 'html') {
    analysisContent = `Analyze this HTML code:\n\n${upload.content}`;
  } else {
    analysisContent = `Analyze the UI of this website: ${upload.url}\n\nNote: Provide analysis based on best practices for modern web UIs. Focus on common patterns and standards.`;
  }

  const fullPrompt = `${UI_ANALYSIS_PROMPT}\n\n${analysisContent}`;

  const result = await analyzeWithGemini(fullPrompt, apiKey, upload.type === 'html' ? null : upload.url || null);

  return result as UIAnalysis;
}
