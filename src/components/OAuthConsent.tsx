import { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Shield, Check, X, ExternalLink, Github, Mail, User, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface OAuthClient {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  homepage_url: string | null;
  scopes: string[];
  is_verified: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
}

const SCOPE_DESCRIPTIONS: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  'profile': {
    label: 'Profile Information',
    description: 'Your username and profile picture',
    icon: <User size={16} />
  },
  'email': {
    label: 'Email Address',
    description: 'Your email address',
    icon: <Mail size={16} />
  },
  'github': {
    label: 'GitHub Connection',
    description: 'Access your connected GitHub account info',
    icon: <Github size={16} />
  },
  'read:projects': {
    label: 'Read Projects',
    description: 'View your Grraphic projects',
    icon: <Shield size={16} />
  },
  'write:projects': {
    label: 'Write Projects',
    description: 'Create and modify your Grraphic projects',
    icon: <Shield size={16} />
  },
};

export function OAuthConsent() {
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<OAuthClient | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // OAuth parameters from URL
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type') || 'code';
  const scope = searchParams.get('scope') || 'profile email';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  const requestedScopes = scope.split(' ').filter(Boolean);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    if (!isSupabaseConfigured()) {
      setError('Authentication service not configured');
      setLoading(false);
      return;
    }

    if (!clientId) {
      setError('Missing client_id parameter');
      setLoading(false);
      return;
    }

    if (!redirectUri) {
      setError('Missing redirect_uri parameter');
      setLoading(false);
      return;
    }

    if (responseType !== 'code') {
      setError('Invalid response_type. Only "code" is supported.');
      setLoading(false);
      return;
    }

    try {
      // Check if user is logged in
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, username')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email || authUser.email || '',
            username: profile.username,
            avatar_url: null
          });
        }
      } else {
        setShowLogin(true);
      }

      // Fetch client info using service role (via edge function)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL}/functions/v1/oauth-client-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid client');
        setLoading(false);
        return;
      }

      const clientData = await response.json();
      
      // Validate redirect URI
      if (!clientData.redirect_uris.includes(redirectUri)) {
        setError('Invalid redirect_uri for this client');
        setLoading(false);
        return;
      }

      setClient(clientData);
    } catch (err) {
      console.error('Error loading OAuth data:', err);
      setError('Failed to load authorization request');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, username')
          .eq('id', data.user.id)
          .single();

        setUser({
          id: data.user.id,
          email: profile?.email || data.user.email || '',
          username: profile?.username || null,
          avatar_url: null
        });
        setShowLogin(false);
      }
    } catch (err) {
      setLoginError('Failed to sign in');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const currentUrl = window.location.href;
    localStorage.setItem('oauth_return_url', currentUrl);
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/api/auth/consent/callback'
      }
    });
  };

  const handleGitHubLogin = async () => {
    const currentUrl = window.location.href;
    localStorage.setItem('oauth_return_url', currentUrl);
    
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/api/auth/consent/callback'
      }
    });
  };

  const handleAuthorize = async () => {
    if (!user || !client) return;
    
    setAuthorizing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Session expired. Please log in again.');
        setShowLogin(true);
        setAuthorizing(false);
        return;
      }

      // Call edge function to generate authorization code
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL}/functions/v1/oauth-authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: requestedScopes,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Authorization failed');
        setAuthorizing(false);
        return;
      }

      // Redirect back to client with authorization code
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', result.code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }
      
      window.location.href = redirectUrl.toString();
    } catch (err) {
      console.error('Authorization error:', err);
      setError('Authorization failed');
      setAuthorizing(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri) return;
    
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', 'User denied the authorization request');
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }
    
    window.location.href = redirectUrl.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading authorization request...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#12121a] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-400" size={32} />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Authorization Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Return to Grraphic
          </button>
        </div>
      </div>
    );
  }

  if (showLogin || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Sign in to Grraphic</h1>
            <p className="text-gray-400 text-sm">
              to continue to <span className="text-white font-medium">{client?.name || 'the application'}</span>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                placeholder="Your password"
                required
              />
            </div>
            
            {loginError && (
              <p className="text-red-400 text-sm">{loginError}</p>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl text-white font-medium transition-all disabled:opacity-50"
            >
              {loginLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Sign In'}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.1]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#12121a] text-sm text-gray-500">or continue with</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGoogleLogin}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-white text-sm font-medium">Google</span>
            </button>
            <button
              onClick={handleGitHubLogin}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-colors"
            >
              <Github size={20} className="text-white" />
              <span className="text-white text-sm font-medium">GitHub</span>
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            Don&apos;t have an account?{' '}
            <a href="/" className="text-violet-400 hover:text-violet-300">Create one</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            {client?.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="w-14 h-14 rounded-xl" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{client?.name?.charAt(0) || 'A'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-8 h-[2px] bg-gradient-to-r from-gray-700 to-gray-600" />
              <Lock size={14} />
              <div className="w-8 h-[2px] bg-gradient-to-r from-gray-600 to-gray-700" />
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">G</span>
            </div>
          </div>
          
          <h1 className="text-xl font-semibold text-white mb-2">
            {client?.name} wants to access your account
          </h1>
          {client?.homepage_url && (
            <a 
              href={client.homepage_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-400 flex items-center justify-center gap-1"
            >
              {new URL(client.homepage_url).hostname}
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user.username || 'User'}</p>
            <p className="text-gray-500 text-sm truncate">{user.email}</p>
          </div>
          <button 
            onClick={() => {
              supabase.auth.signOut();
              setUser(null);
              setShowLogin(true);
            }}
            className="text-xs text-gray-500 hover:text-gray-400"
          >
            Switch
          </button>
        </div>

        {/* Verification Badge */}
        {client?.is_verified && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
            <Check size={16} className="text-emerald-400" />
            <span className="text-sm text-emerald-400">Verified application</span>
          </div>
        )}

        {/* Scopes */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">This will allow {client?.name} to:</p>
          <div className="space-y-2">
            {requestedScopes.map((scopeKey) => {
              const scopeInfo = SCOPE_DESCRIPTIONS[scopeKey] || {
                label: scopeKey,
                description: `Access to ${scopeKey}`,
                icon: <Shield size={16} />
              };
              return (
                <div 
                  key={scopeKey}
                  className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
                >
                  <div className="text-violet-400 mt-0.5">{scopeInfo.icon}</div>
                  <div>
                    <p className="text-white text-sm font-medium">{scopeInfo.label}</p>
                    <p className="text-gray-500 text-xs">{scopeInfo.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning */}
        <p className="text-xs text-gray-600 text-center mb-6">
          By authorizing, you allow this app to use your information in accordance with their{' '}
          <span className="text-gray-400">terms of service</span> and{' '}
          <span className="text-gray-400">privacy policy</span>.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={authorizing}
            className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-white font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthorize}
            disabled={authorizing}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authorizing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Check size={18} />
                Authorize
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Powered by <span className="text-violet-400">Grraphic Auth</span>
        </p>
      </div>
    </div>
  );
}
