import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database } from './database.types';

// Supabase Project: snqpircwrkwadzceqjuc
// Use the new Supabase integration environment variables
// Falls back to VITE_ prefixed vars for local development compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

// Provide fallback values to prevent initialization errors
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

export const supabase = createClient<Database>(
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
  return createClient<Database>(
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
