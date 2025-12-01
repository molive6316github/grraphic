import { DesignAnalysis } from '../types';
import { analyzeDesignWithGemini } from '../services/geminiService';
import { analyzeImageMetrics } from './imageAnalysisEngine';
import { generateIntelligentAnalysis } from './intelligentScorer';

export async function analyzeDesign(fileName: string, file?: File): Promise<DesignAnalysis> {
  if (!file) {
    return Promise.reject(new Error('No file provided for analysis'));
  }

  try {
    const metrics = await analyzeImageMetrics(file);
    const intelligentAnalysis = generateIntelligentAnalysis(metrics);

    try {
      const geminiAnalysis = await analyzeDesignWithGemini(file);

      return {
        overall: Math.round((intelligentAnalysis.overall + geminiAnalysis.overall) / 2),
        categories: {
          typography: {
            score: Math.round((intelligentAnalysis.categories.typography.score + geminiAnalysis.categories.typography.score) / 2),
            feedback: geminiAnalysis.categories.typography.feedback
          },
          colors: {
            score: Math.round((intelligentAnalysis.categories.colors.score + geminiAnalysis.categories.colors.score) / 2),
            feedback: geminiAnalysis.categories.colors.feedback
          },
          spacing: {
            score: Math.round((intelligentAnalysis.categories.spacing.score + geminiAnalysis.categories.spacing.score) / 2),
            feedback: geminiAnalysis.categories.spacing.feedback
          },
          composition: {
            score: Math.round((intelligentAnalysis.categories.composition.score + geminiAnalysis.categories.composition.score) / 2),
            feedback: geminiAnalysis.categories.composition.feedback
          },
          contrast: {
            score: Math.round((intelligentAnalysis.categories.contrast.score + geminiAnalysis.categories.contrast.score) / 2),
            feedback: geminiAnalysis.categories.contrast.feedback
          }
        },
        strengths: [
          ...intelligentAnalysis.strengths.slice(0, 3),
          ...geminiAnalysis.strengths.slice(0, 2)
        ].slice(0, 5),
        weaknesses: [
          ...intelligentAnalysis.weaknesses.slice(0, 3),
          ...geminiAnalysis.weaknesses.slice(0, 2)
        ].slice(0, 5),
        improvements: [
          ...intelligentAnalysis.improvements.slice(0, 5),
          ...geminiAnalysis.improvements.slice(0, 3)
        ].slice(0, 8),
        summary: geminiAnalysis.summary
      };
    } catch (geminiError) {
      console.warn('Gemini analysis failed, using intelligent analysis only:', geminiError);
      return intelligentAnalysis;
    }
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}