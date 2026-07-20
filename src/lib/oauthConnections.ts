import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Supabase only allows redirectTo URLs on its allow-list, so OAuth always
// returns to the origin. We remember where the user started (and which
// provider they picked) in sessionStorage, then restore it after the
// session lands.
const REDIRECT_KEY = 'post_auth_redirect';
const PROVIDER_KEY = 'pending_oauth_provider';

export function rememberOAuthOrigin(path: string, provider?: string) {
  try {
    sessionStorage.setItem(REDIRECT_KEY, path);
    if (provider) sessionStorage.setItem(PROVIDER_KEY, provider);
  } catch { /* private browsing */ }
}

export function consumePostAuthRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(REDIRECT_KEY);
    if (path) sessionStorage.removeItem(REDIRECT_KEY);
    return path;
  } catch {
    return null;
  }
}

// provider_token only exists in the session right after an OAuth sign-in and
// is never stored by Supabase. Persist it so integrations (GitHub push etc.)
// survive reloads and the user never has to re-link.
export async function persistProviderConnection(session: Session): Promise<void> {
  const token = session.provider_token;
  if (!token) return;

  let pendingProvider: string | null = null;
  try {
    pendingProvider = sessionStorage.getItem(PROVIDER_KEY);
    sessionStorage.removeItem(PROVIDER_KEY);
  } catch { /* private browsing */ }

  const provider = pendingProvider || session.user.app_metadata?.provider;
  if (!provider || provider === 'email') return;

  let username: string | null = null;
  if (provider === 'github') {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) username = (await res.json()).login ?? null;
    } catch { /* still save the token */ }
  }

  await supabase.from('user_oauth_connections').upsert({
    user_id: session.user.id,
    provider,
    provider_token: token,
    provider_username: username,
    connected_at: new Date().toISOString(),
  });
}

export interface OAuthConnection {
  provider_token: string | null;
  provider_username: string | null;
  connected_at: string | null;
}

export async function getOAuthConnection(userId: string, provider: string): Promise<OAuthConnection | null> {
  const { data } = await supabase
    .from('user_oauth_connections')
    .select('provider_token, provider_username, connected_at')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  return data;
}

export async function removeOAuthConnection(userId: string, provider: string): Promise<void> {
  await supabase
    .from('user_oauth_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
}
