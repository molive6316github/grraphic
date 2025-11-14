import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hashSensitiveData } from '../utils/encryption';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please connect to Supabase to create an account.' } };
    }

    // Hash username for privacy if provided
    const hashedUsername = username ? hashSensitiveData(username) : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
        data: {
          username: hashedUsername
        }
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please connect to Supabase to sign in.' } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please connect to Supabase to sign in with Google.' } };
    }

    const currentUrl = new URL(window.location.href);
    const redirectUrl = `${currentUrl.origin}${currentUrl.pathname}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return;
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please connect to Supabase to reset password.' } };
    }

    const currentUrl = new URL(window.location.href);
    const redirectUrl = `${currentUrl.origin}${currentUrl.pathname}`;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };
}