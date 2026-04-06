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
      visualReferences?: Array<{
        description: string;
        boundingBox: { x: number; y: number; width: number; height: number };
      }>;
    };
    colorHarmony: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
      visualReferences?: Array<{
        description: string;
        boundingBox: { x: number; y: number; width: number; height: number };
      }>;
    };
    composition: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
      visualReferences?: Array<{
        description: string;
        boundingBox: { x: number; y: number; width: number; height: number };
      }>;
    };
    hierarchy: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
      visualReferences?: Array<{
        description: string;
        boundingBox: { x: number; y: number; width: number; height: number };
      }>;
    };
    spacing: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
      visualReferences?: Array<{
        description: string;
        boundingBox: { x: number; y: number; width: number; height: number };
      }>;
    };
    contrast: {
      score: number;
      feedback: string;
      improvementIdeas: string[];
      references?: string[];
      visualReferences?: Array<{
        description: string;
        boundingBox: { x: number; y: number; width: number; height: number };
      }>;
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

// API Types
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiUsage {
  id: string;
  user_id: string;
  api_key_id: string | null;
  endpoint: string;
  method: string;
  usage_date: string;
  request_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: {
    userAgent?: string;
    platform?: string;
    language?: string;
  };
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface DailyQuota {
  used: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
  percentage: number;
}

export interface UsageStats {
  tier: SubscriptionTier;
  today: {
    date: string;
    usage: Record<string, DailyQuota>;
    resetsAt: string;
  };
  history: Array<{
    date: string;
    total: number;
    byEndpoint: Record<string, number>;
  }>;
  totals: {
    last7Days: number;
    last30Days: number;
  };
}
