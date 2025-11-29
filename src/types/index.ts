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
    };
    colorHarmony: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    composition: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    hierarchy: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    spacing: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    contrast: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
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
    };
    accessibility: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    responsiveness: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    performance: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    semantics: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
    };
    uxPatterns: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
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