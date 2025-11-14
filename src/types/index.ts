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

export interface UploadedFile {
  file: File;
  preview: string;
  name: string;
  size: number;
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