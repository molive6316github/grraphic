import React, { useState } from 'react';
import { useEffect } from 'react';
import { Sparkles, User, History, Shield } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { LoadingAnalysis } from './components/LoadingAnalysis';
import { AnalysisResults } from './components/AnalysisResults';
import { DarkModeToggle } from './components/DarkModeToggle';
import { AuthModal } from './components/AuthModal';
import AnalysisHistory from './components/AnalysisHistory';
import { PublicAnalysisView } from './components/PublicAnalysisView';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { CheckoutSuccess } from './components/CheckoutSuccess';
import { UsernameModal } from './components/UsernameModal';
import { AdminPanel } from './components/AdminPanel';
import { DesignHelpLanding } from './components/DesignHelpLanding';
import { DesignInfoLanding } from './components/DesignInfoLanding';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { analyzeDesign } from './utils/designAnalyzer';
import { UploadedFile, DesignAnalysis } from './types';
import { useDarkMode } from './hooks/useDarkMode';
import { useAuth } from './hooks/useAuth';
import { useAnalysisHistory } from './hooks/useAnalysisHistory';
import { useCredits } from './hooks/useCredits';
import { useSubscription } from './hooks/useSubscription';
import { useUsername } from './hooks/useUsername';
import { useAdmin } from './hooks/useAdmin';
import { CreditsDisplay } from './components/CreditsDisplay';
import { ProSubscriptionCard } from './components/ProSubscriptionCard';
import { STRIPE_PRODUCTS } from './stripe-config';

type AppState = 'upload' | 'analyzing' | 'results' | 'history' | 'public' | 'success' | 'admin' | 'design-help' | 'design-info' | 'privacy' | 'terms';

// lib/gtag.js
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
export const pageview = (url) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

import Script from 'next/script';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../lib/gtag';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url) => gtag.pageview(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtag.GA_TRACKING_ID}', { page_path: window.location.pathname });
          `,
        }}
      />
      <Component {...pageProps} />
    </>
  );
}



function App() {
  const [state, setState] = useState<AppState>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [viewingAnalysis, setViewingAnalysis] = useState<any>(null);
  const [publicAnalysis, setPublicAnalysis] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const { analyses, loading: historyLoading, saveAnalysis, deleteAnalysis, togglePublic, getPublicAnalysis } = useAnalysisHistory(user?.id);
  const { credits, loading: creditsLoading, hasProCredits, useProCredit } = useCredits(user?.id);
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription(user?.id);
  const { username, loading: usernameLoading, error: usernameError, updateUsername, clearError } = useUsername(user?.id);
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  
  // Get user session for authenticated requests
  const [userSession, setUserSession] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      // Get the current session
      import('./lib/supabase').then(({ supabase }) => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUserSession(session);
        });
      });
    }
  }, [user]);

  // Check for shared analysis and custom pages in URL on component mount
  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('analysis');
    const success = urlParams.get('success');

    // Check for custom landing pages and legal pages
    if (path === '/design-help') {
      setState('design-help');
      return;
    } else if (path === '/design-info') {
      setState('design-info');
      return;
    } else if (path === '/privacy') {
      setState('privacy');
      return;
    } else if (path === '/terms') {
      setState('terms');
      return;
    }

    if (analysisId) {
      loadPublicAnalysis(analysisId);
    } else if (success === 'true') {
      setState('success');
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh subscription status
      if (user) {
        refreshSubscription();
      }
    }
  }, [user, refreshSubscription]);

  const loadPublicAnalysis = async (analysisId: string) => {
    try {
      const analysis = await getPublicAnalysis(analysisId);
      if (analysis) {
        setPublicAnalysis(analysis);
        setAnalysis(analysis.analysis_data);
        setState('public');
      } else {
        // Analysis not found or not public - show user-friendly message
        alert('This analysis is either not found or not publicly shared. Please check the link and try again.');
        setState('upload');
      }
    } catch (error) {
      console.error('Error loading public analysis:', error);
      alert('Failed to load the shared analysis. Please try again later.');
      setState('upload');
    }
  };
  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setCheckoutLoading(true);

    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        alert('Subscription service not available. Please configure Supabase.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSession?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: STRIPE_PRODUCTS.grraphicPro.priceId,
          success_url: `${window.location.origin}?success=true`,
          cancel_url: `${window.location.origin}?canceled=true`,
          mode: STRIPE_PRODUCTS.grraphicPro.mode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(`Subscription error: ${response.status} - ${errorText}`);
        return;
      }
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      alert(`Subscription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleFileUpload = async (file: UploadedFile) => {
    setUploadedFile(file);

    // Use pro credit if file is over 3MB and user has credits
    const MAX_FREE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.file.size > MAX_FREE_SIZE && user && hasProCredits) {
      await useProCredit();
    }

    setState('analyzing');

    try {
      const result = await analyzeDesign(file.name, file.file);
      setAnalysis(result);

      // Save analysis if user is logged in
      if (user && result) {
        // Convert preview URL to blob for storage
        try {
          const response = await fetch(file.preview);
          const blob = await response.blob();
          await saveAnalysis(file.name, result, blob);
        } catch (error) {
          console.error('Error converting image for storage:', error);
          await saveAnalysis(file.name, result);
        }
      }

      setState('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during analysis';
      setErrorMessage(message);
      setState('upload');
      // Auto-hide error after 10 seconds
      setTimeout(() => setErrorMessage(null), 10000);
    }
  };

  const handleRemoveFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    setAnalysis(null);
    setState('upload');
  };

  const startNewAnalysis = () => {
    handleRemoveFile();
    setViewingAnalysis(null);
    setPublicAnalysis(null);
    setState('upload');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleViewAnalysis = (analysisRecord: any) => {
    setViewingAnalysis(analysisRecord);
    setAnalysis(analysisRecord.analysis_data);
    // Create a mock uploaded file with the saved image
    setUploadedFile({
      file: new File([], analysisRecord.file_name),
      preview: analysisRecord.image_url || '',
      name: analysisRecord.file_name,
      size: 0
    });
    setState('results');
  };

  const handleSignOut = async () => {
    await signOut();
    setState('upload');
    handleRemoveFile();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 shadow-lg">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (state === 'design-help') {
    return (
      <>
        <DesignHelpLanding
          onGetStarted={startNewAnalysis}
          onShowAuth={() => setShowAuthModal(true)}
          user={user}
        />
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSignIn={signIn}
          onSignUp={signUp}
          onSignInWithGoogle={signInWithGoogle}
        />
      </>
    );
  }

  if (state === 'design-info') {
    return (
      <>
        <DesignInfoLanding
          onGetStarted={startNewAnalysis}
          onShowAuth={() => setShowAuthModal(true)}
          user={user}
        />
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSignIn={signIn}
          onSignUp={signUp}
          onSignInWithGoogle={signInWithGoogle}
        />
      </>
    );
  }

  if (state === 'privacy') {
    return (
      <>
        <PrivacyPolicy onBack={startNewAnalysis} />
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      </>
    );
  }

  if (state === 'terms') {
    return (
      <>
        <TermsOfService onBack={startNewAnalysis} />
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      </>
    );
  }

  if (state === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen">
        <AdminPanel onBack={startNewAnalysis} />
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={startNewAnalysis}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Grraphic</h1>
            </button>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setState('history')}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <History size={16} />
                    <span className="hidden sm:inline">History</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setState('admin')}
                      className="flex items-center space-x-2 px-3 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                      title="Admin Panel"
                    >
                      <Shield size={16} />
                      <span className="hidden sm:inline">Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    title="Edit username"
                  >
                    <User size={16} className="text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 hidden sm:inline">
                      @{username || 'user'}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <User size={16} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            Get AI-Powered 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              {' '}Design Feedback
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto transition-colors duration-300">
            Upload your graphic design and receive comprehensive feedback on typography, 
            color harmony, composition, and more. Improve your designs with professional insights.
          </p>
          
          {(state === 'results' || state === 'history' || state === 'success') && (
            <>
              <button
                onClick={startNewAnalysis}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mb-8"
              >
                <Sparkles size={20} className="mr-2" />
                Analyze New Design
              </button>
              {user && state !== 'success' && (
                <div className="flex flex-col items-center space-y-4">
                  <SubscriptionStatus 
                    subscription={subscription} 
                    loading={subscriptionLoading} 
                  />
                  <CreditsDisplay 
                    credits={credits} 
                    loading={creditsLoading} 
                  />
                </div>
              )}
              {user && state === 'success' && (
                <CreditsDisplay 
                  credits={credits} 
                  loading={creditsLoading} 
                />
              )}
            </>
            
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Analysis Failed</h3>
                <p className="text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="flex-shrink-0 text-white hover:text-red-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {state === 'success' && (
          <CheckoutSuccess onContinue={startNewAnalysis} />
        )}
        
        {state === 'upload' && (
          <>
            <FileUpload
              onFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              onRemoveFile={handleRemoveFile}
              hasProCredits={hasProCredits}
              isProSubscriber={credits?.is_pro_subscriber || false}
              isAuthenticated={!!user}
              onShowAuth={() => setShowAuthModal(true)}
            />
            
            {/* Pro Subscription Card - Show for non-pro users below upload */}
            {user && !credits?.is_pro_subscriber && user.email !== 'maxolive6316@gmail.com' && (
              <div className="mt-8">
                <ProSubscriptionCard onSubscribe={handleSubscribe} loading={checkoutLoading} />
              </div>
            )}
          </>
        )}

        {state === 'analyzing' && <LoadingAnalysis />}

        {state === 'results' && analysis && (
          <AnalysisResults 
            analysis={analysis} 
            fileName={uploadedFile?.name || viewingAnalysis?.file_name || 'Unknown'}
            imagePreview={uploadedFile?.preview}
            isProSubscriber={credits?.is_pro_subscriber || user?.email === 'maxolive6316@gmail.com' || false}
            onUpgrade={handleSubscribe}
            userId={user?.id}
          />
        )}

        {state === 'history' && user && (
          <AnalysisHistory
            analyses={analyses}
            loading={historyLoading}
            onDeleteAnalysis={deleteAnalysis}
            onViewAnalysis={handleViewAnalysis}
            onTogglePublic={togglePublic}
          />
        )}

        {state === 'public' && publicAnalysis && (
          <PublicAnalysisView
            analysis={publicAnalysis}
            onStartNewAnalysis={startNewAnalysis}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-black/20 backdrop-blur-sm border-t border-gray-200 dark:border-white/10 mt-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">Grraphic</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">
                AI-powered design analysis tool that helps creators improve their graphic designs 
                with professional feedback and actionable insights.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Features</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300 transition-colors duration-300">
                <li>Typography Analysis</li>
                <li>Color Harmony Check</li>
                <li>Composition Review</li>
                <li>Accessibility Testing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Legal</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300 transition-colors duration-300">
                <li>
                  <button
                    onClick={() => {
                      setState('privacy');
                      window.history.pushState({}, '', '/privacy');
                    }}
                    className="hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setState('terms');
                      window.history.pushState({}, '', '/terms');
                    }}
                    className="hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <a href="mailto:support@grraphic.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 pt-8 mt-8 text-center text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <p>&copy; 2025 Grraphic. Built with ❤️ for designers.</p>
          </div>
        </div>
      </footer>
      
      {/* Dark Mode Toggle */}
      <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={signIn}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
      />

      {/* Username Modal */}
      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        currentUsername={username}
        onUpdate={updateUsername}
        loading={usernameLoading}
        error={usernameError}
        clearError={clearError}
        onSignOut={handleSignOut}
      />
    </div>
  );
}

export default App;
