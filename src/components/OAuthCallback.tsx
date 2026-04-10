import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function OAuthCallback() {
  useEffect(() => {
    // After OAuth login, redirect back to the stored return URL
    const returnUrl = localStorage.getItem('oauth_return_url');
    if (returnUrl) {
      localStorage.removeItem('oauth_return_url');
      window.location.href = returnUrl;
    } else {
      // Default redirect to home
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={24} />
        <span>Completing authentication...</span>
      </div>
    </div>
  );
}
