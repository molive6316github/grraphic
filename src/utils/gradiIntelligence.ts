interface GradiResponse {
  message: string;
  action: string | null;
  highlight?: {
    x: number;
    y: number;
    width: number;
    height: number;
    description: string;
  };
}

export function generateIntelligentResponse(
  userMessage: string,
  analysisData: any
): GradiResponse {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes('color') || lowerMsg.includes('palette')) {
    if (analysisData.categories?.colors) {
      const colorScore = analysisData.categories.colors.score;
      const feedback = analysisData.categories.colors.feedback;

      let message = '';
      if (colorScore >= 80) {
        message = `Your color palette is excellent! ${feedback}. The colors work harmoniously together and create a cohesive design.`;
      } else if (colorScore >= 60) {
        message = `Your colors are good with room for improvement. ${feedback}. Consider adjusting the color relationships for better harmony.`;
      } else {
        message = `The color palette needs some work. ${feedback}. Try using a color wheel to find more harmonious combinations.`;
      }

      return {
        message,
        action: null,
        highlight: {
          x: 0.1,
          y: 0.1,
          width: 0.3,
          height: 0.2,
          description: 'Primary color areas'
        }
      };
    }
  }

  if (lowerMsg.includes('typography') || lowerMsg.includes('text') || lowerMsg.includes('font')) {
    if (analysisData.categories?.typography) {
      const typoScore = analysisData.categories.typography.score;
      const feedback = analysisData.categories.typography.feedback;

      let message = '';
      if (typoScore >= 80) {
        message = `Typography is excellent! ${feedback}. Text is highly readable with great contrast.`;
      } else if (typoScore >= 60) {
        message = `Typography is decent. ${feedback}. Consider increasing text size or improving contrast ratios.`;
      } else {
        message = `Typography needs attention. ${feedback}. Ensure text meets WCAG contrast standards (4.5:1).`;
      }

      return {
        message,
        action: null,
        highlight: {
          x: 0.15,
          y: 0.25,
          width: 0.7,
          height: 0.15,
          description: 'Text elements'
        }
      };
    }
  }

  if (lowerMsg.includes('spacing') || lowerMsg.includes('whitespace') || lowerMsg.includes('breathing')) {
    if (analysisData.categories?.spacing) {
      const spacingScore = analysisData.categories.spacing.score;
      const feedback = analysisData.categories.spacing.feedback;

      let message = '';
      if (spacingScore >= 80) {
        message = `Spacing is perfect! ${feedback}. Great use of whitespace that gives the design room to breathe.`;
      } else if (spacingScore >= 60) {
        message = `Spacing is okay. ${feedback}. Adding more breathing room could improve readability.`;
      } else {
        message = `Spacing needs work. ${feedback}. The design feels cramped - try increasing margins and padding.`;
      }

      return {
        message,
        action: null,
        highlight: {
          x: 0.05,
          y: 0.1,
          width: 0.9,
          height: 0.8,
          description: 'Spacing and margins'
        }
      };
    }
  }

  if (lowerMsg.includes('composition') || lowerMsg.includes('layout') || lowerMsg.includes('balance')) {
    if (analysisData.categories?.composition) {
      const compScore = analysisData.categories.composition.score;
      const feedback = analysisData.categories.composition.feedback;

      let message = '';
      if (compScore >= 80) {
        message = `Composition is excellent! ${feedback}. The layout is well-balanced and visually appealing.`;
      } else if (compScore >= 60) {
        message = `Composition is good. ${feedback}. Consider using a grid system for better alignment.`;
      } else {
        message = `Composition needs improvement. ${feedback}. Try the rule of thirds or golden ratio for better balance.`;
      }

      return {
        message,
        action: null,
        highlight: {
          x: 0.2,
          y: 0.2,
          width: 0.6,
          height: 0.6,
          description: 'Main composition area'
        }
      };
    }
  }

  if (lowerMsg.includes('contrast') || lowerMsg.includes('readability')) {
    if (analysisData.categories?.contrast) {
      const contrastScore = analysisData.categories.contrast.score;
      const feedback = analysisData.categories.contrast.feedback;

      let message = '';
      if (contrastScore >= 80) {
        message = `Contrast is excellent! ${feedback}. Everything is highly readable and accessible.`;
      } else if (contrastScore >= 60) {
        message = `Contrast is adequate. ${feedback}. Some elements could use more distinction.`;
      } else {
        message = `Contrast needs significant improvement. ${feedback}. Use bolder differences between foreground and background.`;
      }

      return {
        message,
        action: null,
        highlight: {
          x: 0.1,
          y: 0.3,
          width: 0.8,
          height: 0.4,
          description: 'Contrast areas'
        }
      };
    }
  }

  if (lowerMsg.includes('usability')) {
    if (analysisData.categories?.usability) {
      const usabilityScore = analysisData.categories.usability.score;
      const feedback = analysisData.categories.usability.feedback;

      return {
        message: `${feedback}. Score: ${usabilityScore}/100. ${
          usabilityScore >= 80 ? 'The interface is very user-friendly!' :
          usabilityScore >= 60 ? 'Good usability with room for improvement.' :
          'Consider simplifying the interface for better usability.'
        }`,
        action: null
      };
    }
  }

  if (lowerMsg.includes('accessibility')) {
    if (analysisData.categories?.accessibility) {
      const accessScore = analysisData.categories.accessibility.score;
      const feedback = analysisData.categories.accessibility.feedback;

      return {
        message: `${feedback}. Score: ${accessScore}/100. ${
          accessScore >= 80 ? 'Great accessibility standards!' :
          accessScore >= 60 ? 'Decent accessibility but could be better.' :
          'Critical: Accessibility needs immediate attention for WCAG compliance.'
        }`,
        action: null
      };
    }
  }

  if (lowerMsg.includes('improve') || lowerMsg.includes('suggestion') || lowerMsg.includes('fix')) {
    if (analysisData.improvements && analysisData.improvements.length > 0) {
      const topImprovements = analysisData.improvements.slice(0, 3).join(', ');
      return {
        message: `Here are the top improvements: ${topImprovements}. Want me to explain any of these in detail?`,
        action: null
      };
    }
  }

  if (lowerMsg.includes('strength') || lowerMsg.includes('good') || lowerMsg.includes('what works')) {
    if (analysisData.strengths && analysisData.strengths.length > 0) {
      const topStrengths = analysisData.strengths.slice(0, 3).join(', ');
      return {
        message: `Your design's strengths: ${topStrengths}. These are solid foundations to build on!`,
        action: null
      };
    }
  }

  if (lowerMsg.includes('weakness') || lowerMsg.includes('problem') || lowerMsg.includes('issue')) {
    if (analysisData.weaknesses && analysisData.weaknesses.length > 0) {
      const topWeaknesses = analysisData.weaknesses.slice(0, 2).join(', ');
      return {
        message: `Areas to work on: ${topWeaknesses}. These are opportunities to make your design even better!`,
        action: null
      };
    }
  }

  if (lowerMsg.includes('overall') || lowerMsg.includes('general') || lowerMsg.includes('summary')) {
    const score = analysisData.overall || 0;
    const summary = analysisData.summary || '';

    return {
      message: `Overall score: ${score}/100. ${summary} ${
        score >= 80 ? "You're doing great! 🎉" :
        score >= 60 ? "Good work with potential for refinement!" :
        "There's room for improvement - focus on the key areas I mentioned!"
      }`,
      action: null
    };
  }

  return {
    message: "I can explain specific aspects of your design! Ask me about colors, typography, spacing, composition, contrast, or any category you'd like to understand better.",
    action: null
  };
}

export function generateContextResponse(userMessage: string, analysisData: any): string {
  const response = generateIntelligentResponse(userMessage, analysisData);
  return response.message;
}
