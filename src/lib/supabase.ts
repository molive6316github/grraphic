import { PostgrestClient } from '@supabase/postgrest-js';
import type { Database } from './database.types';

export type { Database } from './database.types';

// ---------------------------------------------------------------------------
// MXT DB client (replaces Supabase). MXT DB is a PostgREST + Postgres-with-RLS
// service; auth identity comes from a GateKey user token sent as the Bearer.
// This module keeps the `supabase` name and a supabase-js-compatible surface
// (.from / .rpc / .auth / .storage) so existing call sites don't change.
// ---------------------------------------------------------------------------

const MXT_URL = (import.meta.env.VITE_MXTDB_URL as string | undefined)?.replace(/\/+$/, '');
const MXT_ANON = import.meta.env.VITE_MXTDB_ANON_KEY as string | undefined;

export const isSupabaseConfigured = () => !!(MXT_URL && MXT_ANON);

// --- GateKey session (held client-side; token is the DB bearer) ------------
export interface GkUser {
  id: string; // = auth.uid() (the GateKey token `sub`)
  username?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
}
export interface GkSession {
  access_token: string;
  expires_at: number; // unix seconds
  user: GkUser;
}

const SESSION_KEY = 'gk_session';
type AuthListener = (event: string, session: GkSession | null) => void;
const listeners = new Set<AuthListener>();

function decodeJwt(token: string): Record<string, any> {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function loadSession(): GkSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GkSession;
    if (s.expires_at && s.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

let session: GkSession | null = loadSession();

function persist(s: GkSession | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage failures (private mode)
  }
}

function notify(event: string) {
  for (const cb of listeners) {
    try { cb(event, session); } catch { /* ignore */ }
  }
}

/** Establish a session from a GateKey user token (called on the SSO callback). */
export function setGkSession(accessToken: string, profile?: Partial<GkUser>): GkSession {
  const claims = decodeJwt(accessToken);
  const id = String(profile?.id || claims.sub || '');
  const expires_at = Number(claims.exp) || Math.floor(Date.now() / 1000) + 900;
  session = {
    access_token: accessToken,
    expires_at,
    user: {
      id,
      username: profile?.username,
      display_name: profile?.display_name,
      avatar_url: profile?.avatar_url,
      email: profile?.email,
    },
  };
  persist(session);
  notify('SIGNED_IN');
  // Make sure a row exists in users for this identity (no auth.users trigger here).
  void ensureUserRow();
  return session;
}

export function clearGkSession() {
  session = null;
  persist(null);
  notify('SIGNED_OUT');
}

export function getGkSession(): GkSession | null {
  if (session && session.expires_at * 1000 < Date.now()) {
    clearGkSession();
  }
  return session;
}

async function ensureUserRow() {
  if (!isSupabaseConfigured() || !session) return;
  try {
    await rest
      .from('users')
      .upsert({ id: session.user.id, email: session.user.email ?? null }, { onConflict: 'id', ignoreDuplicates: true });
  } catch {
    // best-effort; defaults apply if the row is missing
  }
}

// --- PostgREST client with dynamic apikey + bearer -------------------------
// Always constructed (placeholder URL when unconfigured) so types resolve;
// isSupabaseConfigured() gates real usage.
const rest = new PostgrestClient<Database>(MXT_URL || 'https://mxtdb.invalid', {
  fetch: (input: any, init: any = {}) => {
    const headers = new Headers(init.headers || {});
    if (MXT_ANON) headers.set('apikey', MXT_ANON);
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
    else headers.delete('Authorization');
    return fetch(input, { ...init, headers });
  },
});

// --- Auth shim (GateKey-backed) --------------------------------------------
const notConfigured = async (..._args: any[]) => ({ data: null, error: { message: 'Sign in with GateKey.' } as any });

const authShim = {
  getSession: async () => ({ data: { session: getGkSession() }, error: null }),
  getUser: async () => ({ data: { user: getGkSession()?.user ?? null }, error: null }),
  onAuthStateChange: (cb: AuthListener) => {
    listeners.add(cb);
    // Emit current state asynchronously, matching supabase-js behaviour.
    Promise.resolve().then(() => cb('INITIAL_SESSION', session));
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
  signOut: async () => { clearGkSession(); return { error: null }; },
  // Legacy methods — GateKey handles sign-in via redirect, so these are inert.
  signInWithPassword: notConfigured,
  signInWithOtp: notConfigured,
  signUp: notConfigured,
  signInWithOAuth: notConfigured,
  resetPasswordForEmail: notConfigured,
  verifyOtp: notConfigured,
  updateUser: notConfigured,
  admin: {} as any,
};

// --- Storage stub -----------------------------------------------------------
// MXT DB's storage API is not yet wired up; fail soft so callers degrade
// gracefully (analysis still works without a stored thumbnail).
const storageError = { message: 'Storage is not available on MXT DB yet.' } as any;
const storageShim = {
  from: (_bucket: string) => ({
    list: async (..._args: any[]) => ({ data: null, error: storageError }),
    upload: async (..._args: any[]) => ({ data: null, error: storageError }),
    remove: async (..._args: any[]) => ({ data: null, error: null }),
    getPublicUrl: (..._args: any[]) => ({ data: { publicUrl: '' } }),
    createSignedUrl: async (..._args: any[]) => ({ data: null, error: storageError }),
  }),
};

// --- Exported client (supabase-compatible) ---------------------------------
// from/rpc are the real typed PostgREST methods (so call sites keep their
// types); auth/storage are the GateKey/stub shims.
export const supabase = {
  from: rest.from.bind(rest),
  rpc: rest.rpc.bind(rest),
  auth: authShim,
  storage: storageShim,
};

export const createSecureClient = () => supabase;
