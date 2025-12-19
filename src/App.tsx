import React, { useState } from 'react';
import { useEffect } from 'react';
import { Sparkles, User, History, Shield, Palette, Layout, Type, Zap } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { LoadingAnalysis } from './components/LoadingAnalysis';
import { AnalysisResults } from './components/AnalysisResults';
import { ModeToggle } from './components/ModeToggle';
import { UIUpload } from './components/UIUpload';
import { UIAnalysisResults } from './components/UIAnalysisResults';
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
import { AIAssistant } from './components/AIAssistant';
import { GradiChat } from './components/GradiChat';
import { Boxt } from './components/Boxt';
import { analyzeDesign } from './utils/designAnalyzer';
import { analyzeUI } from './utils/uiAnalyzer';
import { UploadedFile, DesignAnalysis, UIUpload as UIUploadType, UIAnalysis, AnalysisMode } from './types';
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

type AppState = 'upload' | 'analyzing' | 'results' | 'history' | 'public' | 'success' | 'admin' | 'design-help' | 'design-info' | 'privacy' | 'terms' | 'gradi' | 'boxt';

function App() {
  const [mode, setMode] = useState<AnalysisMode>('design');
  const [state, setState] = useState<AppState>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadedUI, setUploadedUI] = useState<UIUploadType | null>(null);
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null);
  const [uiAnalysis, setUIAnalysis] = useState<UIAnalysis | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [viewingAnalysis, setViewingAnalysis] = useState<any>(null);
  const [publicAnalysis, setPublicAnalysis] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [headingOffset, setHeadingOffset] = useState(150);
  const [isRecentering, setIsRecentering] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    } else if (path === '/gradi') {
      setState('gradi');
      return;
    } else if (path === '/boxt') {
      setState('boxt');
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
  const handleSubscribe = async (discountCode?: string) => {
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

      const requestBody: any = {
        price_id: STRIPE_PRODUCTS.grraphicPro.priceId,
        success_url: `${window.location.origin}?success=true`,
        cancel_url: `${window.location.origin}?canceled=true`,
        mode: STRIPE_PRODUCTS.grraphicPro.mode,
      };

      if (discountCode) {
        requestBody.discount_code = discountCode;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSession?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  const handleUIUpload = async (upload: UIUploadType) => {
    setUploadedUI(upload);
    setState('analyzing');

    try {
      const result = await analyzeUI(upload, import.meta.env.VITE_GEMINI_API_KEY);
      setUIAnalysis(result);
      setState('results');
    } catch (error) {
      console.error('UI Analysis failed:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during analysis';
      setErrorMessage(message);
      setState('upload');
      setTimeout(() => setErrorMessage(null), 10000);
    }
  };

  const handleRemoveUI = () => {
    setUploadedUI(null);
    setUIAnalysis(null);
    setState('upload');
  };

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    handleRemoveFile();
    handleRemoveUI();
    setState('upload');
  };

  const startNewAnalysis = () => {
    handleRemoveFile();
    handleRemoveUI();
    setViewingAnalysis(null);
    setPublicAnalysis(null);
    setState('upload');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleViewAnalysis = (analysisRecord: any) => {
    setViewingAnalysis(analysisRecord);
    setAnalysis(analysisRecord.analysis_data);
    setMode('design'); // Set mode to design when viewing from history
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

  if (state === 'gradi') {
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900">
          <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
            <Sparkles size={64} className="mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to Chat with Gradi</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create an account or sign in to access your personal AI design assistant.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl transition-all duration-300"
            >
              Sign In / Sign Up
            </button>
          </div>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSignIn={signIn}
            onSignUp={signUp}
            onGoogleSignIn={signInWithGoogle}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen">
        <GradiChat userId={user.id} />
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      </div>
    );
  }

  if (state === 'boxt') {
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900">
          <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
            <Sparkles size={64} className="mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to Use Boxt</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create an account or sign in to access the powerful design editor.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl transition-all duration-300"
            >
              Sign In / Sign Up
            </button>
          </div>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSignIn={signIn}
            onSignUp={signUp}
            onGoogleSignIn={signInWithGoogle}
          />
        </div>
      );
    }

    return <Boxt userId={user.id} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-all duration-500 relative">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-primary-400/30 to-accent-400/20 dark:from-primary-600/20 dark:to-accent-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-accent-400/30 to-primary-400/20 dark:from-accent-600/20 dark:to-primary-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-primary-300/20 to-accent-300/20 dark:from-primary-700/10 dark:to-accent-700/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-200/60 dark:border-slate-700/50 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => {
                startNewAnalysis();
                setClickCount(prev => prev + 1);
                if (clickCount === 9) {
                  alert('🎉 You found the secret! You are a true design explorer!');
                  setClickCount(0);
                }
              }}
              className="group flex items-center space-x-3 hover:scale-105 transition-all duration-500"
            >
              <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 rounded-xl shadow-soft-lg group-hover:shadow-glow transition-all duration-500 group-hover:rotate-12">
                <Sparkles size={22} className="text-white group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 dark:from-slate-100 dark:via-primary-400 dark:to-slate-100 bg-clip-text text-transparent">Grraphic</h1>
            </button>
            
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setState('boxt');
                      window.history.pushState({}, '', '/boxt');
                    }}
                    className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-accent-100 dark:hover:bg-accent-900/30 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5"
                    title="Design Editor"
                  >
                    <Palette size={18} className="text-accent-600 dark:text-accent-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-200">Boxt</span>
                  </button>
                  <button
                    onClick={() => {
                      setState('gradi');
                      window.history.pushState({}, '', '/gradi');
                    }}
                    className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-primary-100 dark:hover:bg-primary-900/30 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5"
                    title="Chat with Gradi AI"
                  >
                    <Sparkles size={18} className="text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-200">Gradi AI</span>
                  </button>
                  <button
                    onClick={() => setState('history')}
                    className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5"
                  >
                    <History size={18} className="text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-200">History</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setState('admin')}
                      className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-100/80 dark:bg-accent-900/30 hover:bg-accent-200/80 dark:hover:bg-accent-800/40 border border-accent-200/50 dark:border-accent-700/50 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5"
                      title="Admin Panel"
                    >
                      <Shield size={18} className="text-accent-600 dark:text-accent-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="hidden sm:inline font-medium text-accent-700 dark:text-accent-300">Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 glass-card hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5"
                    title="Edit username"
                  >
                    <User size={18} className="text-slate-600 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline">
                      @{username || 'user'}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 btn-primary"
                >
                  <User size={18} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Cursor follower effect */}
        {state === 'upload' && (
          <div
            className="fixed w-12 h-12 rounded-full bg-gradient-to-r from-primary-500/40 to-accent-500/40 blur-2xl pointer-events-none z-50 transition-all duration-500"
            style={{
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}

        {/* Floating shapes background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-80 h-80 bg-primary-400/20 dark:bg-primary-600/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-accent-400/20 dark:bg-accent-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-primary-300/15 dark:bg-primary-700/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

          {state === 'upload' && (
            <>
              <div className="absolute top-32 left-1/4 text-primary-400/30 dark:text-primary-400/20 animate-float">
                <Palette size={52} />
              </div>
              <div className="absolute top-48 right-1/3 text-accent-400/30 dark:text-accent-400/20 animate-float animation-delay-2000">
                <Layout size={60} />
              </div>
              <div className="absolute bottom-32 left-1/3 text-primary-300/30 dark:text-primary-500/20 animate-float animation-delay-4000">
                <Type size={56} />
              </div>
              <div className="absolute top-64 right-1/4 text-accent-300/30 dark:text-accent-500/20 animate-float animation-delay-2000">
                <Zap size={48} />
              </div>
            </>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-16 text-center relative z-10">
          <div className="relative group">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-slate-50 mb-8 transition-all duration-500 cursor-pointer leading-tight tracking-tight"
              style={{
                transform: isRecentering ? 'translateX(0)' : `translateX(${headingOffset}px)`,
                transition: isRecentering ? 'transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none'
              }}
              onMouseEnter={() => setIsHoveringHeader(true)}
              onMouseLeave={() => setIsHoveringHeader(false)}
              onClick={() => {
                if (!isRecentering && headingOffset !== 0) {
                  setIsRecentering(true);
                  setHeadingOffset(0);
                  setConfettiActive(true);
                  setTimeout(() => {
                    setIsRecentering(false);
                    setConfettiActive(false);
                  }, 1000);
                }
              }}
            >
              <span className="block text-balance">Get AI-Powered</span>
              <span
                className={`block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 dark:from-primary-400 dark:via-accent-400 dark:to-primary-500 transition-all duration-500 ${
                  isHoveringHeader ? 'scale-105' : ''
                }`}
              >
                {mode === 'design' ? 'Design Feedback' : 'UI Analysis'}
              </span>
            </h1>

            {headingOffset !== 0 && !isRecentering && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-lg px-4 py-2 whitespace-nowrap shadow-xl">
                  Try recentering me! 🎯
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                </div>
              </div>
            )}

            {confettiActive && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: ['#3b82f6', '#a855f7', '#ec4899', '#f59e0b'][i % 4],
                      left: '50%',
                      top: '50%',
                      animation: `confetti-${i % 4} 1s ease-out forwards`,
                      transform: `translate(-50%, -50%) rotate(${i * 18}deg)`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto transition-colors duration-500 leading-relaxed text-balance">
            {mode === 'design'
              ? 'Upload your graphic design and receive comprehensive feedback on typography, color harmony, composition, and more. Improve your designs with professional insights.'
              : 'Upload HTML or enter a website URL to receive comprehensive UI/UX analysis covering usability, accessibility, responsiveness, and performance.'}
          </p>

          {(state === 'results' || state === 'history' || state === 'success') && (
            <>
              <button
                onClick={startNewAnalysis}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 hover:from-primary-700 hover:via-accent-700 hover:to-primary-800 text-white text-lg font-semibold rounded-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-soft-lg hover:shadow-glow mb-10"
              >
                <Sparkles size={22} className="animate-pulse" />
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
            <div className="mb-8 flex justify-center">
              <ModeToggle mode={mode} onModeChange={handleModeChange} />
            </div>

            {mode === 'design' ? (
              <FileUpload
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
                onRemoveFile={handleRemoveFile}
                hasProCredits={hasProCredits}
                isProSubscriber={credits?.is_pro_subscriber || false}
                isAuthenticated={!!user}
                onShowAuth={() => setShowAuthModal(true)}
              />
            ) : (
              <UIUpload
                onUpload={handleUIUpload}
                uploadedUI={uploadedUI}
                onRemove={handleRemoveUI}
                hasProCredits={hasProCredits}
                isProSubscriber={credits?.is_pro_subscriber || false}
                isAuthenticated={!!user}
                onShowAuth={() => setShowAuthModal(true)}
              />
            )}

            {/* Pro Subscription Card - Show for non-pro users below upload */}
            {user && !credits?.is_pro_subscriber && user.email !== 'maxolive6316@gmail.com' && (
              <div className="mt-8">
                <ProSubscriptionCard onSubscribe={handleSubscribe} loading={checkoutLoading} />
              </div>
            )}
          </>
        )}

        {state === 'analyzing' && <LoadingAnalysis mode={mode} />}

        {state === 'results' && mode === 'design' && analysis && (
          <AnalysisResults
            analysis={analysis}
            fileName={uploadedFile?.name || viewingAnalysis?.file_name || 'Unknown'}
            imagePreview={uploadedFile?.preview}
            isProSubscriber={credits?.is_pro_subscriber || user?.email === 'maxolive6316@gmail.com' || false}
            onUpgrade={handleSubscribe}
            userId={user?.id}
          />
        )}

        {state === 'results' && mode === 'ui' && uiAnalysis && uploadedUI && (
          <UIAnalysisResults
            analysis={uiAnalysis}
            uploadName={uploadedUI.name}
            uploadType={uploadedUI.type}
            uploadUrl={uploadedUI.url}
            screenshotUrl={(uiAnalysis as any).screenshotUrl}
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
      
      {/* AI Assistant */}
      <AIAssistant
        isAdmin={isAdmin}
        userId={user?.id}
        screenshotUrl={mode === 'design' ? uploadedFile?.preview : (uiAnalysis as any)?.screenshotUrl}
        analysisData={mode === 'design' ? analysis : uiAnalysis}
        currentPage={state}
        hasResults={state === 'results' && (analysis !== null || uiAnalysis !== null)}
      />

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
