import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<any>;
  onSignUp: (email: string, password: string, username?: string) => Promise<any>;
  onSignInWithGoogle?: () => Promise<any>;
  onSignInWithGitHub?: () => Promise<any>;
  onGoogleSignIn?: () => Promise<any>;
  onPasswordReset?: (email: string) => Promise<any>;
}

type AuthView = 'signin' | 'signup' | 'reset' | 'reset-sent' | 'verify-email';

export function AuthModal({ 
  isOpen, 
  onClose, 
  onSignIn, 
  onSignUp, 
  onSignInWithGoogle,
  onSignInWithGitHub,
  onGoogleSignIn,
  onPasswordReset 
}: AuthModalProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = onSignInWithGoogle || onGoogleSignIn;

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
    setView('signin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }

        const { data, error } = await onSignUp(email, password, username);
        if (error) {
          setError(error.message);
        } else if (data?.user && !data.session) {
          setView('verify-email');
        } else {
          handleClose();
        }
      } else if (view === 'signin') {
        const { error } = await onSignIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          handleClose();
        }
      } else if (view === 'reset' && onPasswordReset) {
        if (!email.trim()) {
          setError('Please enter your email address');
          setLoading(false);
          return;
        }
        const { error } = await onPasswordReset(email);
        if (error) {
          setError(error.message);
        } else {
          setView('reset-sent');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!handleGoogleSignIn) return;
    setError('');
    setLoading(true);
    try {
      const { error } = await handleGoogleSignIn();
      if (error) setError(error.message);
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success states
  if (view === 'verify-email' || view === 'reset-sent') {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
        <div className="glass-card w-full max-w-md p-8 animate-scale-in" onClick={e => e.stopPropagation()}>
          <button onClick={handleClose} className="absolute top-4 right-4 btn-icon text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {view === 'verify-email' ? 'Check Your Email' : 'Reset Email Sent'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {view === 'verify-email' 
                ? `We've sent a verification link to ${email}. Click the link to verify your account.`
                : `We've sent a password reset link to ${email}. Click the link to reset your password.`
              }
            </p>
            <button onClick={handleClose} className="btn-gradient w-full">
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-md p-8 animate-scale-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 btn-icon text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>

        {view === 'reset' && (
          <button onClick={() => { setView('signin'); setError(''); }} className="absolute top-4 left-4 btn-icon text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft-lg">
            {view === 'reset' ? <Mail className="w-7 h-7 text-white" /> : <User className="w-7 h-7 text-white" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {view === 'signup' ? 'Create Account' : view === 'reset' ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {view === 'signup' ? 'Sign up to save your design analyses' 
              : view === 'reset' ? 'Enter your email to receive a reset link'
              : 'Sign in to access your saved analyses'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {view === 'signin' ? 'Email or Username' : 'Email'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={view === 'signin' ? 'text' : 'email'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input pl-10"
                placeholder={view === 'signin' ? 'Email or username' : 'Enter your email'}
                required
              />
            </div>
          </div>

          {view === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>
          )}

          {view !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {view === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 rounded-xl">
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gradient w-full py-3">
            {loading ? 'Please wait...' : view === 'signup' ? 'Create Account' : view === 'reset' ? 'Send Reset Link' : 'Sign In'}
          </button>
        </form>

        {view === 'signin' && onPasswordReset && (
          <div className="mt-4 text-center">
            <button onClick={() => { setView('reset'); setError(''); }} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              Forgot your password?
            </button>
          </div>
        )}

        {view !== 'reset' && (handleGoogleSignIn || onSignInWithGitHub) && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white dark:bg-slate-900 text-sm text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="flex gap-3">
              {handleGoogleSignIn && (
                <button
                  onClick={handleGoogleClick}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Google</span>
                </button>
              )}

              {onSignInWithGitHub && (
                <button
                  onClick={async () => {
                    setError('');
                    setLoading(true);
                    try {
                      const { error } = await onSignInWithGitHub();
                      if (error) setError(error.message);
                    } catch (err) {
                      setError('Failed to sign in with GitHub. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="font-medium text-slate-700 dark:text-slate-300">GitHub</span>
                </button>
              )}
            </div>
          </>
        )}

        {view !== 'reset' && (
          <div className="mt-6 text-center">
            <button onClick={() => { setView(view === 'signin' ? 'signup' : 'signin'); setError(''); }} className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
              {view === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
