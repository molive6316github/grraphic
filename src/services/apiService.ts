import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: boolean;
  message?: string;
  code?: string;
}

// Generate a secure API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'grr_';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Simple hash function for client-side (not cryptographically secure, use server-side for production)
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

// API Keys - with Supabase fallback
export const apiKeysService = {
  list: async (): Promise<ApiResponse<any[]>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Not authenticated' };

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { success: false, message: error.message };
    return { success: true, data: data || [] };
  },
  
  create: async (name: string, scopes?: string[], expiresIn?: string): Promise<ApiResponse<any>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Not authenticated' };

    // Generate key
    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    // Calculate expiry
    let expiresAt = null;
    if (expiresIn && expiresIn !== 'never') {
      const now = new Date();
      switch (expiresIn) {
        case '7d': expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break;
        case '30d': expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); break;
        case '90d': expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); break;
        case '1y': expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); break;
      }
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: scopes || ['read', 'write'],
        is_active: true,
        expires_at: expiresAt?.toISOString() || null,
      })
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    
    // Return the key only on creation (won't be stored)
    return { 
      success: true, 
      data: { ...data, key: rawKey },
      message: 'Save this key - it will not be shown again!'
    };
  },
  
  update: async (id: string, updates: { name?: string; is_active?: boolean; scopes?: string[] }): Promise<ApiResponse<any>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Not authenticated' };

    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data };
  },
  
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Not authenticated' };

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { success: false, message: error.message };
    return { success: true };
  },
};

// API Usage - with Supabase fallback
export const apiUsageService = {
  getCurrent: async (): Promise<ApiResponse<any>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Not authenticated' };

    // Get subscription tier
    const { data: subscription } = await supabase
      .from('stripe_subscriptions')
      .select('status')
      .eq('customer_id', user.id)
      .maybeSingle();

    const tier = subscription?.status === 'active' ? 'pro' : 'free';
    const today = new Date().toISOString().split('T')[0];

    // Get today's usage
    const { data: usageData } = await supabase
      .from('api_usage')
      .select('endpoint, request_count')
      .eq('user_id', user.id)
      .eq('usage_date', today);

    // Daily limits for free tier
    const limits: Record<string, number | 'unlimited'> = tier === 'pro' 
      ? { analysis: 'unlimited', gradi: 'unlimited', 'site-designer': 'unlimited' }
      : { analysis: 1, gradi: 10, 'site-designer': 2 };

    const usage: Record<string, any> = {};
    for (const [endpoint, limit] of Object.entries(limits)) {
      const used = usageData?.find(u => u.endpoint === endpoint)?.request_count || 0;
      usage[endpoint] = {
        used,
        limit,
        remaining: limit === 'unlimited' ? 'unlimited' : Math.max(0, limit - used),
        percentage: limit === 'unlimited' ? 0 : Math.min(100, (used / limit) * 100)
      };
    }

    // Get history (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: historyData } = await supabase
      .from('api_usage')
      .select('usage_date, endpoint, request_count')
      .eq('user_id', user.id)
      .gte('usage_date', weekAgo.toISOString().split('T')[0])
      .order('usage_date', { ascending: false });

    // Group by date
    const historyMap = new Map<string, { total: number; byEndpoint: Record<string, number> }>();
    historyData?.forEach(item => {
      if (!historyMap.has(item.usage_date)) {
        historyMap.set(item.usage_date, { total: 0, byEndpoint: {} });
      }
      const entry = historyMap.get(item.usage_date)!;
      entry.total += item.request_count;
      entry.byEndpoint[item.endpoint] = item.request_count;
    });

    const history = Array.from(historyMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));

    // Calculate totals
    const last7Days = history.reduce((sum, h) => sum + h.total, 0);

    return {
      success: true,
      data: {
        tier,
        today: {
          date: today,
          usage,
          resetsAt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        history,
        totals: {
          last7Days,
          last30Days: last7Days, // Simplified
        }
      }
    };
  },
  
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
