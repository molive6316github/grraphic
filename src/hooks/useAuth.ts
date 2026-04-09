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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
        data: {
          username: username || ''
        }
      }
    });
    return { data, error };
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please connect to Supabase to sign in.' } };
    }

    // Check if input is an email (contains @) or username
    const isEmail = emailOrUsername.includes('@');

    if (isEmail) {
      // Sign in with email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });
      return { data, error };
    } else {
      // Look up email by username from profiles table
      const { data: userData, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailOrUsername.toLowerCase())
        .maybeSingle();

      if (lookupError || !userData) {
        // Also try case-insensitive search
        const { data: userDataILike } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', emailOrUsername)
          .maybeSingle();
        
        if (!userDataILike) {
          return {
            data: null,
            error: { message: 'Username not found. Please check your username or try signing in with your email address.' }
          };
        }
        
        // Sign in with the found email (case-insensitive match)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: userDataILike.email,
          password,
        });
        return { data, error };
      }

      // Sign in with the found email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });
      return { data, error };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please connect to Supabase to sign in with Google.' } };
    }

    // Use the origin only (no pathname) to avoid callback issues
    const redirectUrl = window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    return { data, error };
  };

  const signInWithGitHub = async () => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please connect to Supabase to sign in with GitHub.' } };
    }

    const redirectUrl = window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
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
    signInWithGitHub,
    signOut,
    resetPassword,
  };
}
