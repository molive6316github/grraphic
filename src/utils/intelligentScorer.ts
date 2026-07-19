import { AnalysisMetrics } from './imageAnalysisEngine';
import { DesignAnalysis } from '../types';

interface ScoringFactors {
  score: number;
  feedback: string;
  suggestions: string[];
}

function scoreColorUsage(metrics: AnalysisMetrics): ScoringFactors {
  let score = 0;
  const suggestions: string[] = [];
  let feedback = '';

  if (metrics.colorCount >= 3 && metrics.colorCount <= 7) {
    score += 35;
    feedback = 'Excellent color palette size';
  } else if (metrics.colorCount < 3) {
    score += 15;
    feedback = 'Limited color variety';
    suggestions.push('Consider adding 1-2 accent colors to create more visual interest');
  } else if (metrics.colorCount <= 12) {
    score += 25;
    feedback = 'Good color variety';
    suggestions.push('Consider consolidating similar colors to strengthen the palette');
  } else {
    score += 10;
    feedback = 'Too many colors may create visual confusion';
    suggestions.push('Reduce to 5-7 core colors for a more cohesive design');
  }

  if (metrics.colorHarmony >= 70) {
    score += 30;
  } else if (metrics.colorHarmony >= 50) {
    score += 20;
    suggestions.push('Colors could be more harmonious - try using complementary or analogous colors');
  } else {
    score += 10;
    suggestions.push('Color relationships need improvement - use a color wheel to find harmonious combinations');
  }

  if (metrics.averageContrast >= 70) {
    score += 35;
  } else if (metrics.averageContrast >= 50) {
    score += 25;
    suggestions.push('Increase contrast between foreground and background elements');
  } else {
    score += 15;
    suggestions.push('Low contrast makes elements hard to distinguish - aim for 4.5:1 ratio minimum');
  }

  return { score: Math.round(score), feedback, suggestions };
}

function scoreComposition(metrics: AnalysisMetrics): ScoringFactors {
  let score = 0;
  const suggestions: string[] = [];
  let feedback = '';

  if (metrics.symmetryScore >= 60) {
    score += 30;
    feedback = 'Strong visual balance';
  } else if (metrics.symmetryScore >= 40) {
    score += 20;
    feedback = 'Moderate balance';
    suggestions.push('Consider aligning elements more symmetrically or using a clear grid system');
  } else {
    score += 10;
    feedback = 'Asymmetric composition';
    suggestions.push('Use the rule of thirds or golden ratio for better visual balance');
  }

  if (metrics.complexityScore >= 30 && metrics.complexityScore <= 70) {
    score += 35;
  } else if (metrics.complexityScore < 30) {
    score += 20;
    suggestions.push('Design feels too simple - add visual interest with textures or patterns');
  } else {
    score += 15;
    suggestions.push('Design is too complex - simplify by removing unnecessary elements');
  }

  if (metrics.edgeDensity >= 20 && metrics.edgeDensity <= 60) {
    score += 35;
  } else if (metrics.edgeDensity < 20) {
    score += 20;
    suggestions.push('Add more defined edges and shapes for better structure');
  } else {
    score += 15;
    suggestions.push('Too many edges create visual noise - reduce detail in less important areas');
  }

  return { score: Math.round(score), feedback, suggestions };
}

function scoreSpacing(metrics: AnalysisMetrics): ScoringFactors {
  let score = 0;
  const suggestions: string[] = [];
  let feedback = '';

  if (metrics.whitespaceRatio >= 30 && metrics.whitespaceRatio <= 60) {
    score += 50;
    feedback = 'Excellent use of whitespace';
  } else if (metrics.whitespaceRatio < 30) {
    score += 30;
    feedback = 'Design feels crowded';
    suggestions.push('Add more breathing room between elements');
    suggestions.push('Increase margins and padding for better readability');
  } else {
    score += 35;
    feedback = 'Design feels sparse';
    suggestions.push('Add more content or reduce whitespace for better balance');
  }

  if (metrics.visualWeight >= 40 && metrics.visualWeight <= 70) {
    score += 50;
  } else if (metrics.visualWeight < 40) {
    score += 30;
    suggestions.push('Add more visual weight with bolder elements or richer colors');
  } else {
    score += 35;
    suggestions.push('Reduce visual weight by using lighter colors or thinner elements');
  }

  return { score: Math.round(score), feedback, suggestions };
}

function scoreContrast(metrics: AnalysisMetrics): ScoringFactors {
  let score = 0;
  const suggestions: string[] = [];
  let feedback = '';

  if (metrics.textContrast >= 75) {
    score += 50;
    feedback = 'Excellent text readability';
  } else if (metrics.textContrast >= 50) {
    score += 35;
    feedback = 'Good text contrast';
    suggestions.push('Some text may be hard to read - ensure 4.5:1 contrast ratio');
  } else {
    score += 20;
    feedback = 'Text contrast needs improvement';
    suggestions.push('Text is likely hard to read - increase contrast to at least 4.5:1');
    suggestions.push('Use darker text on light backgrounds or vice versa');
  }

  if (metrics.averageContrast >= 70) {
    score += 50;
  } else if (metrics.averageContrast >= 50) {
    score += 35;
    suggestions.push('Increase overall contrast between design elements');
  } else {
    score += 25;
    suggestions.push('Low contrast throughout - use bolder color differences');
  }

  return { score: Math.round(score), feedback, suggestions };
}

function generateStrengths(metrics: AnalysisMetrics, scores: Record<string, ScoringFactors>): string[] {
  const strengths: string[] = [];

  if (scores.colors.score >= 80) {
    strengths.push('Excellent color palette and harmony');
  }
  if (scores.composition.score >= 80) {
    strengths.push('Strong visual composition and balance');
  }
  if (scores.spacing.score >= 80) {
    strengths.push('Great use of whitespace and visual breathing room');
  }
  if (scores.contrast.score >= 80) {
    strengths.push('High contrast ensures excellent readability');
  }

  if (metrics.symmetryScore >= 70) {
    strengths.push('Well-balanced and symmetric layout');
  }
  if (metrics.colorHarmony >= 75) {
    strengths.push('Colors work harmoniously together');
  }
  if (metrics.complexityScore >= 40 && metrics.complexityScore <= 65) {
    strengths.push('Perfect balance of simplicity and detail');
  }

  if (strengths.length === 0) {
    strengths.push('Good foundation to build upon');
  }

  return strengths.slice(0, 5);
}

function generateWeaknesses(scores: Record<string, ScoringFactors>): string[] {
  const weaknesses: string[] = [];

  Object.entries(scores).forEach(([category, result]) => {
    if (result.score < 60 && result.feedback) {
      weaknesses.push(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${result.feedback}`);
    }
  });

  if (weaknesses.length === 0) {
    weaknesses.push('Minor refinements could enhance the design further');
  }

  return weaknesses.slice(0, 5);
}

function generateImprovements(scores: Record<string, ScoringFactors>): string[] {
  const improvements: string[] = [];
  const allSuggestions = Object.values(scores).flatMap(s => s.suggestions);

  const prioritized = allSuggestions.filter((s, i, arr) => arr.indexOf(s) === i);

  return prioritized.slice(0, 8);
}

export function generateIntelligentAnalysis(metrics: AnalysisMetrics): DesignAnalysis {
  const scores = {
    colors: scoreColorUsage(metrics),
    composition: scoreComposition(metrics),
    spacing: scoreSpacing(metrics),
    contrast: scoreContrast(metrics)
  };

  const typography = {
    score: scores.contrast.score,
    feedback: 'Text contrast and readability analysis',
    suggestions: scores.contrast.suggestions.filter(s => s.toLowerCase().includes('text'))
  };

  const overallScore = Math.round(
    (scores.colors.score * 0.25 +
     scores.composition.score * 0.25 +
     scores.spacing.score * 0.25 +
     scores.contrast.score * 0.25)
  );

  return {
    overall: overallScore,
    categories: {
      typography: {
        score: typography.score,
        feedback: typography.feedback,
        improvementIdeas: typography.suggestions
      },
      colorHarmony: {
        score: scores.colors.score,
        feedback: scores.colors.feedback,
        improvementIdeas: scores.colors.suggestions
      },
      spacing: {
        score: scores.spacing.score,
        feedback: scores.spacing.feedback,
        improvementIdeas: scores.spacing.suggestions
      },
      composition: {
        score: scores.composition.score,
        feedback: scores.composition.feedback,
        improvementIdeas: scores.composition.suggestions
      },
      hierarchy: {
        score: scores.composition.score,
        feedback: 'Visual hierarchy derived from composition analysis',
        improvementIdeas: []
      },
      contrast: {
        score: scores.contrast.score,
        feedback: scores.contrast.feedback,
        improvementIdeas: scores.contrast.suggestions
      }
    },
    strengths: generateStrengths(metrics, scores),
    improvements: [...generateWeaknesses(scores), ...generateImprovements(scores)],
    designPrinciples: []
  };
}
