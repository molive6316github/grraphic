import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, type GkUser, type GkSession } from '../lib/supabase';

// Auth is provided by GateKey. The GateKey user token is held client-side (see
// lib/supabase) and used as the MXT DB bearer. This hook exposes the current
// user/session and a sign-out; sign-in happens via a redirect to /api/auth/login.
export function useAuth() {
  const [user, setUser] = useState<GkUser | null>(null);
  const [session, setSession] = useState<GkSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event: string, s: GkSession | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => { data.subscription.unsubscribe(); };
  }, []);

  const signInWithGateKey = () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/login?return_to=${encodeURIComponent(returnTo)}`;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    return { error: null };
  };

  // Legacy no-ops kept so existing callers keep compiling; GateKey replaces them.
  const redirectToLogin = async () => { signInWithGateKey(); return { data: null, error: null }; };

  return {
    user,
    session,
    loading,
    signInWithGateKey,
    signOut,
    signIn: redirectToLogin,
    signUp: redirectToLogin,
    signInWithGoogle: redirectToLogin,
    resetPassword: redirectToLogin,
  };
}
