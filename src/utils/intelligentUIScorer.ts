import { AnalysisMetrics } from './imageAnalysisEngine';
import { UIAnalysis } from '../types';

interface UIMetrics extends AnalysisMetrics {
  textRegions: number;
  buttonLikeShapes: number;
  horizontalLines: number;
  verticalSections: number;
}

function scoreUsability(metrics: UIMetrics): { score: number; feedback: string; ideas: string[] } {
  let score = 0;
  const ideas: string[] = [];

  if (metrics.complexityScore >= 30 && metrics.complexityScore <= 60) {
    score += 30;
  } else if (metrics.complexityScore > 60) {
    score += 15;
    ideas.push('Simplify the interface by removing non-essential elements');
  } else {
    score += 20;
    ideas.push('Add more visual cues and interactive elements for clarity');
  }

  if (metrics.whitespaceRatio >= 35 && metrics.whitespaceRatio <= 55) {
    score += 35;
  } else if (metrics.whitespaceRatio < 35) {
    score += 20;
    ideas.push('Add more spacing between sections for better readability');
  } else {
    score += 25;
    ideas.push('Increase content density to make better use of space');
  }

  if (metrics.symmetryScore >= 50) {
    score += 35;
  } else {
    score += 20;
    ideas.push('Align elements to a consistent grid for better visual hierarchy');
  }

  return {
    score: Math.round(score),
    feedback: score >= 75 ? 'Interface is clean and intuitive' :
              score >= 60 ? 'Good usability with room for refinement' :
              'Interface could be more user-friendly',
    ideas
  };
}

function scoreAccessibility(metrics: UIMetrics): { score: number; feedback: string; ideas: string[] } {
  let score = 0;
  const ideas: string[] = [];

  if (metrics.textContrast >= 70) {
    score += 40;
  } else if (metrics.textContrast >= 50) {
    score += 25;
    ideas.push('Ensure all text meets WCAG AA contrast ratio (4.5:1)');
  } else {
    score += 15;
    ideas.push('Critical: Text contrast is too low - increase to at least 4.5:1');
    ideas.push('Use darker text on light backgrounds for better readability');
  }

  if (metrics.averageContrast >= 60) {
    score += 30;
  } else {
    score += 15;
    ideas.push('Improve contrast between UI elements and backgrounds');
  }

  if (metrics.colorCount >= 3 && metrics.colorCount <= 8) {
    score += 30;
  } else if (metrics.colorCount > 8) {
    score += 15;
    ideas.push('Too many colors may confuse users with color blindness');
  }

  return {
    score: Math.round(score),
    feedback: score >= 75 ? 'Excellent accessibility standards' :
              score >= 60 ? 'Good accessibility with minor issues' :
              'Accessibility needs significant improvement',
    ideas
  };
}

function scoreResponsiveness(metrics: UIMetrics): { score: number; feedback: string; ideas: string[] } {
  let score = 0;
  const ideas: string[] = [];

  if (metrics.symmetryScore >= 60) {
    score += 35;
  } else {
    score += 20;
    ideas.push('Use responsive grid system for better layout flexibility');
  }

  if (metrics.edgeDensity >= 20 && metrics.edgeDensity <= 50) {
    score += 35;
  } else if (metrics.edgeDensity > 50) {
    score += 20;
    ideas.push('Reduce number of elements for better mobile responsiveness');
  }

  if (metrics.whitespaceRatio >= 30) {
    score += 30;
  } else {
    score += 15;
    ideas.push('Add more padding for touch-friendly mobile interface');
  }

  return {
    score: Math.round(score),
    feedback: score >= 75 ? 'Layout appears well-structured' :
              score >= 60 ? 'Layout is functional but could be optimized' :
              'Layout may struggle on smaller screens',
    ideas
  };
}

function scorePerformance(metrics: UIMetrics): { score: number; feedback: string; ideas: string[] } {
  let score = 0;
  const ideas: string[] = [];

  if (metrics.complexityScore <= 70) {
    score += 40;
  } else {
    score += 25;
    ideas.push('Reduce visual complexity to improve perceived performance');
  }

  if (metrics.edgeDensity <= 60) {
    score += 35;
  } else {
    score += 20;
    ideas.push('Simplify graphics and reduce the number of elements');
  }

  if (metrics.colorCount <= 10) {
    score += 25;
  } else {
    score += 15;
    ideas.push('Limit color palette to reduce rendering overhead');
  }

  return {
    score: Math.round(score),
    feedback: score >= 75 ? 'Design appears optimized for performance' :
              score >= 60 ? 'Good performance potential' :
              'Performance could be improved with simplification',
    ideas
  };
}

function scoreSemantics(metrics: UIMetrics): { score: number; feedback: string; ideas: string[] } {
  let score = 0;
  const ideas: string[] = [];

  if (metrics.symmetryScore >= 55) {
    score += 35;
  } else {
    score += 20;
    ideas.push('Organize content into clear, logical sections');
  }

  if (metrics.visualWeight >= 40 && metrics.visualWeight <= 70) {
    score += 35;
  } else {
    score += 20;
    ideas.push('Balance visual hierarchy with appropriate heading sizes');
  }

  if (metrics.whitespaceRatio >= 30) {
    score += 30;
  } else {
    score += 15;
    ideas.push('Use spacing to separate distinct content sections');
  }

  return {
    score: Math.round(score),
    feedback: score >= 75 ? 'Clear content structure and hierarchy' :
              score >= 60 ? 'Good structure with room for clarity' :
              'Content structure needs better organization',
    ideas
  };
}

function scoreUXPatterns(metrics: UIMetrics): { score: number; feedback: string; ideas: string[] } {
  let score = 0;
  const ideas: string[] = [];

  if (metrics.colorHarmony >= 60) {
    score += 30;
  } else {
    score += 15;
    ideas.push('Use consistent color scheme following modern UI patterns');
  }

  if (metrics.symmetryScore >= 60 && metrics.complexityScore <= 65) {
    score += 35;
  } else {
    score += 20;
    ideas.push('Follow established UX patterns for familiar user experience');
  }

  if (metrics.averageContrast >= 55) {
    score += 35;
  } else {
    score += 20;
    ideas.push('Improve visual feedback with better hover and active states');
  }

  return {
    score: Math.round(score),
    feedback: score >= 75 ? 'Follows modern UX best practices' :
              score >= 60 ? 'Good UX patterns with minor gaps' :
              'Could better leverage established UX patterns',
    ideas
  };
}

export function generateIntelligentUIAnalysis(metrics: AnalysisMetrics): UIAnalysis {
  const uiMetrics: UIMetrics = {
    ...metrics,
    textRegions: 0,
    buttonLikeShapes: 0,
    horizontalLines: 0,
    verticalSections: 0
  };

  const usability = scoreUsability(uiMetrics);
  const accessibility = scoreAccessibility(uiMetrics);
  const responsiveness = scoreResponsiveness(uiMetrics);
  const performance = scorePerformance(uiMetrics);
  const semantics = scoreSemantics(uiMetrics);
  const uxPatterns = scoreUXPatterns(uiMetrics);

  const overallScore = Math.round(
    (usability.score * 0.2 +
     accessibility.score * 0.2 +
     responsiveness.score * 0.15 +
     performance.score * 0.15 +
     semantics.score * 0.15 +
     uxPatterns.score * 0.15)
  );

  return {
    overall: overallScore,
    categories: {
      usability: {
        score: usability.score,
        feedback: usability.feedback,
        improvementIdeas: usability.ideas,
        references: ['Overall interface layout', 'Visual hierarchy', 'Element spacing']
      },
      accessibility: {
        score: accessibility.score,
        feedback: accessibility.feedback,
        improvementIdeas: accessibility.ideas,
        references: ['Text contrast ratios', 'Color differentiation', 'Visual clarity']
      },
      responsiveness: {
        score: responsiveness.score,
        feedback: responsiveness.feedback,
        improvementIdeas: responsiveness.ideas,
        references: ['Layout structure', 'Element distribution', 'Spacing system']
      },
      performance: {
        score: performance.score,
        feedback: performance.feedback,
        improvementIdeas: performance.ideas,
        references: ['Visual complexity', 'Number of elements', 'Design efficiency']
      },
      semantics: {
        score: semantics.score,
        feedback: semantics.feedback,
        improvementIdeas: semantics.ideas,
        references: ['Content organization', 'Visual hierarchy', 'Section structure']
      },
      uxPatterns: {
        score: uxPatterns.score,
        feedback: uxPatterns.feedback,
        improvementIdeas: uxPatterns.ideas,
        references: ['Design consistency', 'Visual patterns', 'User expectations']
      }
    },
    strengths: [],
    improvements: [],
    bestPractices: [],
    summary: `UI scored ${overallScore}/100. ${
      overallScore >= 80 ? 'Excellent user experience with strong fundamentals.' :
      overallScore >= 60 ? 'Good foundation with opportunities for enhancement.' :
      'Interface needs improvement in key areas for better user experience.'
    }`
  };
}
