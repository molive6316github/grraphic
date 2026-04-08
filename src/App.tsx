import React, { useState } from 'react';
import { useEffect } from 'react';
import { Sparkles, User, History, Shield, Package, Monitor, Globe } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { LoadingAnalysis } from './components/LoadingAnalysis';
import { AnalysisResults } from './components/AnalysisResults';
import { ModeToggle } from './components/ModeToggle';
import { UIUploadComponent } from './components/UIUpload';
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
import { SiteDesigner } from './components/SiteDesigner';
import { Boxt } from './components/Boxt';
import { PaletteX } from './components/PaletteX';
import { MockupStudio } from './components/MockupStudio';
import { AssetVault } from './components/AssetVault';
import { ApiDashboard } from './components/ApiDashboard';
import { ApiDocs } from './components/ApiDocs';
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

type AppState = 'upload' | 'analyzing' | 'results' | 'history' | 'public' | 'success' | 'admin' | 'design-help' | 'design-info' | 'privacy' | 'terms' | 'gradi' | 'site-designer' | 'boxt' | 'palettex' | 'mockup' | 'assets' | 'api' | 'api-docs';

type MockupSection = 'home' | 'devices' | 'intros' | 'products' | 'scenes' | 'video' | 'logo' | 'text' | 'slideshow' | 'social' | 'apparel' | 'environments';

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
  const [mockupSection, setMockupSection] = useState<MockupSection>('home');
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
    } else if (path === '/gradi') {
      setState('gradi');
      return;
    } else if (path === '/site-designer') {
      setState('site-designer');
      return;
    } else if (path === '/boxt') {
      setState('boxt');
      return;
    } else if (path.startsWith('/mockup')) {
      setState('mockup');
      const section = path.split('/')[2] as MockupSection;
      if (section && ['devices', 'intros', 'products', 'scenes', 'video', 'logo', 'text', 'slideshow', 'social', 'apparel', 'environments'].includes(section)) {
        setMockupSection(section);
      } else {
        setMockupSection('home');
      }
      return;
    } else if (path === '/api' || path === '/api/dashboard') {
      setState('api');
      return;
    } else if (path === '/api/docs') {
      setState('api-docs');
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

      // Ensure price_id is clean - no quotes, no whitespace
      const cleanPriceId = STRIPE_PRODUCTS.grraphicPro.priceId.trim().replace(/['"]/g, '');
      
      const requestBody: any = {
        price_id: cleanPriceId,
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
        // Check for price not found error
        if (errorText.includes('No such price')) {
          alert('The subscription price is not configured correctly. Please contact support or verify the Stripe price ID exists in your Stripe dashboard.');
        } else {
          alert(`Subscription error: ${response.status} - ${errorText}`);
        }
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

  if (state === 'site-designer') {
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-600 to-teal-800 dark:from-teal-900 dark:via-cyan-800 dark:to-slate-900">
          <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
            <Globe size={64} className="mx-auto mb-4 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to Use Site Designer</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create an account or sign in to build websites with AI.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-xl transition-all duration-300"
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
      <SiteDesigner 
        userId={user.id} 
        onBack={() => {
          setState('upload');
          window.history.pushState({}, '', '/');
        }}
      />
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
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => {
                setState('upload');
                window.history.pushState({}, '', '/');
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Grraphic</span>
            </button>
            
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <nav className="hidden md:flex items-center gap-1 mr-2">
                    <button
                      onClick={() => { setState('boxt'); window.history.pushState({}, '', '/boxt'); }}
                      className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Boxt
                    </button>
                    <button
                      onClick={() => { setState('gradi'); window.history.pushState({}, '', '/gradi'); }}
                      className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Gradi AI
                    </button>
                    <button
                      onClick={() => { setState('site-designer'); window.history.pushState({}, '', '/site-designer'); }}
                      className="px-3 py-2 text-sm text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors"
                    >
                      Site Designer
                    </button>
                    <button
                      onClick={() => setState('history')}
                      className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      History
                    </button>
                    <button
                      onClick={() => setState('palettex')}
                      className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      PaletteX
                    </button>
                    <button
                      onClick={() => { setState('mockup'); setMockupSection('home'); window.history.pushState({}, '', '/mockup'); }}
                      className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Mockups
                    </button>
                    <button
                      onClick={() => setState('assets')}
                      className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Assets
                    </button>
                    <button
                      onClick={() => { setState('api'); window.history.pushState({}, '', '/api'); }}
                      className="px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      API
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setState('admin')}
                        className="px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                      >
                        Admin
                      </button>
                    )}
                  </nav>
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300 hidden sm:inline">@{username || 'user'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <User size={16} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            <span className="block text-balance">Get AI-Powered</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
              {mode === 'design' ? 'Design Feedback' : 'UI Analysis'}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
            {mode === 'design'
              ? 'Upload your graphic design and receive comprehensive feedback on typography, color harmony, composition, and more.'
              : 'Upload HTML or enter a website URL to receive comprehensive UI/UX analysis covering usability, accessibility, responsiveness, and performance.'}
          </p>

          {(state === 'results' || state === 'history' || state === 'success') && (
            <>
              <button
                onClick={startNewAnalysis}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity mb-8"
              >
                <Sparkles size={20} />
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
              <UIUploadComponent
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
            userId={user.id}
          />
        )}

        {state === 'palettex' && (
          <PaletteX userId={user?.id} />
        )}

        {state === 'mockup' && (
          <MockupStudio
            userId={user?.id}
            initialSection={mockupSection}
            onNavigate={(section) => {
              setMockupSection(section);
              const newPath = section === 'home' ? '/mockup' : `/mockup/${section}`;
              window.history.pushState({}, '', newPath);
            }}
          />
        )}

        {state === 'assets' && (
          <AssetVault userId={user?.id} />
        )}

        {state === 'api' && (
          <ApiDashboard 
            onBack={() => {
              setState('upload');
              window.history.pushState({}, '', '/');
            }}
          />
        )}

        {state === 'api-docs' && (
          <ApiDocs 
            onBack={() => {
              setState('upload');
              window.history.pushState({}, '', '/');
            }}
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
