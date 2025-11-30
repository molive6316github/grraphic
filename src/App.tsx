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

type AppState = 'upload' | 'analyzing' | 'results' | 'history' | 'public' | 'success' | 'admin' | 'design-help' | 'design-info' | 'privacy' | 'terms';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => {
                startNewAnalysis();
                setClickCount(prev => prev + 1);
                if (clickCount === 9) {
                  alert('🎉 You found the secret! You are a true design explorer!');
                  setClickCount(0);
                }
              }}
              className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg animate-bounce-slow">
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
        {/* Cursor follower effect */}
        {state === 'upload' && (
          <div
            className="fixed w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-xl pointer-events-none z-50 transition-all duration-300"
            style={{
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}

        {/* Floating shapes background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

          {state === 'upload' && (
            <>
              <div className="absolute top-32 left-1/4 text-blue-400/30 dark:text-blue-300/20 animate-bounce-slow">
                <Palette size={48} />
              </div>
              <div className="absolute top-48 right-1/3 text-purple-400/30 dark:text-purple-300/20 animate-bounce-slow animation-delay-2000">
                <Layout size={56} />
              </div>
              <div className="absolute bottom-32 left-1/3 text-pink-400/30 dark:text-pink-300/20 animate-bounce-slow animation-delay-4000">
                <Type size={52} />
              </div>
              <div className="absolute top-64 right-1/4 text-blue-300/30 dark:text-blue-400/20 animate-bounce-slow animation-delay-2000">
                <Zap size={44} />
              </div>
            </>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative z-10">
          <div className="relative group">
            <h1
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-all duration-300 cursor-pointer"
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
              Get AI-Powered
              <span
                className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 transition-all duration-500 ${
                  isHoveringHeader ? 'animate-pulse-glow inline-block scale-110' : ''
                }`}
              >
                {mode === 'design' ? ' Design Feedback' : ' UI Analysis'}
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
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto transition-colors duration-300">
            {mode === 'design'
              ? 'Upload your graphic design and receive comprehensive feedback on typography, color harmony, composition, and more. Improve your designs with professional insights.'
              : 'Upload HTML or enter a website URL to receive comprehensive UI/UX analysis covering usability, accessibility, responsiveness, and performance.'}
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
