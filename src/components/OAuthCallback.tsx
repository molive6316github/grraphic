import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function OAuthCallback() {
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for hash fragment (Supabase OAuth returns tokens in URL hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          // Let Supabase handle the session from the URL
          setStatus('Establishing session...');
          
          // Supabase auto-detects and sets session from URL hash
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
            setStatus('Authentication failed');
            setTimeout(() => window.location.href = '/', 2000);
            return;
          }
          
          if (session) {
            setStatus('Authentication successful! Redirecting...');
          }
        }
        
        // Small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect back to the stored return URL (OAuth consent page)
        const returnUrl = localStorage.getItem('oauth_return_url');
        if (returnUrl) {
          localStorage.removeItem('oauth_return_url');
          window.location.href = returnUrl;
        } else {
          // Default redirect to home
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('Something went wrong');
        setTimeout(() => window.location.href = '/', 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={24} />
        <span>{status}</span>
      </div>
    </div>
  );
}
