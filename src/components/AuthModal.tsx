import { X, ShieldCheck } from 'lucide-react';

// Auth is handled by GateKey (server-side SSO). This modal is now just the
// entry point: it sends the browser to /api/auth/login, which redirects to
// GateKey and, on return, establishes the Supabase session. The legacy
// email/password/Google props are accepted but unused so existing callers
// keep compiling during the transition.
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn?: (email: string, password: string) => Promise<any>;
  onSignUp?: (email: string, password: string, username?: string) => Promise<any>;
  onSignInWithGoogle?: () => Promise<any>;
  onGoogleSignIn?: () => Promise<any>;
  onPasswordReset?: (email: string) => Promise<any>;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  const startLogin = () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/login?return_to=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-md p-8 animate-scale-in relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn-icon text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft-lg">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in to Grraphic</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Continue with your GateKey account to save your design analyses and palettes.
          </p>
        </div>

        <button onClick={startLogin} className="btn-gradient w-full py-3 flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Continue with GateKey
        </button>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          You'll be redirected to GateKey to sign in securely.
        </p>
      </div>
    </div>
  );
}
