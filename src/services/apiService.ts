import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: boolean;
  message?: string;
  code?: string;
}

// Helper to make authenticated API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

// API Keys
export const apiKeysService = {
  list: () => apiCall<any[]>('api-keys'),
  
  create: (name: string, scopes?: string[], expiresIn?: string) =>
    apiCall('api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, scopes, expiresIn }),
    }),
  
  update: (id: string, data: { name?: string; is_active?: boolean; scopes?: string[] }) =>
    apiCall(`api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiCall(`api-keys/${id}`, { method: 'DELETE' }),
};

// API Usage
export const apiUsageService = {
  getCurrent: () => apiCall('api-usage'),
  getByKeys: () => apiCall('api-usage/keys'),
};

// Account
export const apiAccountService = {
  get: () => apiCall('api-account'),
  update: (data: { username?: string }) =>
    apiCall('api-account', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSessions: () => apiCall('api-account/sessions'),
  revokeSession: (id: string) =>
    apiCall(`api-account/sessions/${id}`, { method: 'DELETE' }),
  getSubscription: () => apiCall('api-account/subscription'),
};

// Analysis
export const apiAnalysisService = {
  analyze: (url: string, imageBase64?: string, saveResult = true) =>
    apiCall('api-analysis', {
      method: 'POST',
      body: JSON.stringify({ url, imageBase64, saveResult }),
    }),
  get: (id: string) => apiCall(`api-analysis/${id}`),
  list: (limit = 20, offset = 0) =>
    apiCall(`api-analysis?limit=${limit}&offset=${offset}`),
};

// Gradi Chat
export const apiGradiService = {
  chat: (message: string, conversationHistory?: any[], sessionId?: string) =>
    apiCall('api-gradi/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory, sessionId }),
    }),
  createSession: (title?: string) =>
    apiCall('api-gradi/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  listSessions: () => apiCall('api-gradi/sessions'),
  getSession: (id: string) => apiCall(`api-gradi/sessions/${id}`),
};

// Generate API key hash for display (client-side)
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 12) return key;
  return key.substring(0, 12) + '...' + key.substring(key.length - 4);
}

// Copy to clipboard with feedback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
