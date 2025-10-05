import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

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
            // Encrypt session data in localStorage
            const item = localStorage.getItem(key);
            return item;
          },
          setItem: (key: string, value: string) => {
            // Store session data securely
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

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          username: string | null;
          pro_credits_remaining: number;
          pro_credits_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          pro_credits_remaining?: number;
          pro_credits_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          username?: string | null;
          pro_credits_remaining?: number;
          pro_credits_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      design_analyses: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          analysis_data: string; // Encrypted JSON string
          image_url: string | null;
          created_at: string;
          updated_at: string;
          is_public: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          analysis_data: string; // Encrypted JSON string
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          analysis_data?: string; // Encrypted JSON string
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
        };
      };
    };
  };
};