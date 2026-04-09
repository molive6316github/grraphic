import { createClient } from '@supabase/supabase-js';

// Use the new Supabase integration environment variables
// Falls back to VITE_ prefixed vars for local development compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

// Provide fallback values to prevent initialization errors
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const hasValidUrl = supabaseUrl && 
                     supabaseUrl !== 'https://placeholder.supabase.co' &&
                     supabaseUrl.startsWith('https://') && 
                     (supabaseUrl.includes('.supabase.co') || supabaseUrl.includes('supabase'));
  
  const hasValidKey = supabaseAnonKey && 
                     supabaseAnonKey !== 'placeholder-key' &&
                     supabaseAnonKey.length > 20;
  
  return hasValidUrl && hasValidKey;
};

// Enhanced client with additional security headers
export const createSecureClient = () => {
  return createClient(
    supabaseUrl || defaultUrl,
    supabaseAnonKey || defaultKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string) => {
            const item = localStorage.getItem(key);
            return item;
          },
          setItem: (key: string, value: string) => {
            localStorage.setItem(key, value);
          },
          removeItem: (key: string) => {
            localStorage.removeItem(key);
          }
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'grraphic-app',
        }
      }
    }
  );
};

// Database types matching the new schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          is_admin: boolean;
          subscription_tier: 'free' | 'pro' | 'enterprise';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email?: string | null;
          is_admin?: boolean;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string | null;
          is_admin?: boolean;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
      };
      design_analyses: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          analysis_data: string;
          image_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          analysis_data: string;
          image_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          analysis_data?: string;
          image_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: string[];
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          scopes?: string[];
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_usage: {
        Row: {
          id: string;
          user_id: string;
          api_key_id: string | null;
          endpoint: string;
          method: string;
          usage_date: string;
          request_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_key_id?: string | null;
          endpoint: string;
          method: string;
          usage_date: string;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          api_key_id?: string | null;
          endpoint?: string;
          method?: string;
          usage_date?: string;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      asset_folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_folder_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_folder_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_folder_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      design_assets: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          storage_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          storage_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          storage_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gradi_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          messages: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          messages?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          messages?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
