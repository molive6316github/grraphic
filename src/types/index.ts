export type AnalysisMode = 'design' | 'ui';

export interface DesignAnalysis {
  overall: number;
  designContext?: {
    perceivedGoal: string;
    targetAudience: string;
    designType: string;
  };
  categories: {
    typography: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    colorHarmony: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    composition: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    hierarchy: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    spacing: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    contrast: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
  };
  strengths: string[];
  improvements: string[];
  designPrinciples: string[];
}

export interface UIAnalysis {
  overall: number;
  categories: {
    usability: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    accessibility: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    responsiveness: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    performance: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    semantics: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
    uxPatterns: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
    };
  };
  strengths: string[];
  improvements: string[];
  bestPractices: string[];
}

export interface UploadedFile {
  file: File;
  preview: string;
  name: string;
  size: number;
}

export interface UIUpload {
  type: 'html' | 'url';
  content: string;
  name: string;
  url?: string;
}

export interface AnalysisRecord {
  id: string;
  file_name: string;
  analysis_data: DesignAnalysis;
  created_at: string;
  image_url?: string;
  is_public?: boolean;
  user?: {
    username?: string;
  };
}