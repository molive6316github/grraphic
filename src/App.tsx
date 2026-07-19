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
import { SharedView } from './components/SharedView';
import { ApiDashboard } from './components/ApiDashboard';
import { ApiDocs } from './components/ApiDocs';
import { OAuthConsent } from './components/OAuthConsent';
import { OAuthCallback } from './components/OAuthCallback';
import { DeveloperPortal } from './components/DeveloperPortal';
import { analyzeDesign } from './utils/designAnalyzer';
import { analyzeUI } from './utils/uiAnalyzer';
import { UploadedFile, DesignAnalysis, UIUpload as UIUploadType, UIAnalysis, AnalysisMode, AnalysisRecord } from './types';
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

type AppState = 'upload' | 'analyzing' | 'results' | 'history' | 'public' | 'success' | 'admin' | 'design-help' | 'design-info' | 'privacy' | 'terms' | 'gradi' | 'site-designer' | 'boxt' | 'palettex' | 'mockup' | 'assets' | 'api' | 'api-docs' | 'oauth-consent' | 'oauth-callback' | 'developer' | 'shared';

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
  const [viewingAnalysis, setViewingAnalysis] = useState<AnalysisRecord | null>(null);
  const [publicAnalysis, setPublicAnalysis] = useState<AnalysisRecord | null>(null);
  const [sharedToken, setSharedToken] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mockupSection, setMockupSection] = useState<MockupSection>('home');
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user, session, loading: authLoading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const { analyses, loading: historyLoading, saveAnalysis, deleteAnalysis, togglePublic, getPublicAnalysis } = useAnalysisHistory(user?.id);
  const { credits, loading: creditsLoading, hasProCredits, useProCredit } = useCredits(user?.id);
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription(user?.id);
  const { username, loading: usernameLoading, error: usernameError, updateUsername, clearError } = useUsername(user?.id);
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  


  // Check for shared analysis and custom pages in URL on component mount
  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('analysis');
    const shareToken = urlParams.get('share');
    if (shareToken) {
      setSharedToken(shareToken);
      setState('shared');
      return;
    }
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
    } else if (path === '/api/auth/consent' || path.startsWith('/api/auth/consent')) {
      setState('oauth-consent');
      return;
    } else if (path === '/api/auth/consent/callback') {
      setState('oauth-callback');
      return;
    } else if (path === '/developer' || path === '/developers') {
      setState('developer');
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
        setPublicAnalysis(analysis as any);
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
      
      const requestBody: Record<string, string> = {
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
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

  const handleViewAnalysis = (analysisRecord: AnalysisRecord) => {
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
    <div className="min-h-screen bg-[#0b0b12] text-white relative">
      {/* Atmosphere: aurora glows + dot grid + film grain */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="aurora w-[42rem] h-[42rem] -top-48 -left-32 bg-indigo-600/20" />
        <div className="aurora w-[36rem] h-[36rem] top-1/4 -right-40 bg-fuchsia-600/15" style={{ animationDelay: '-6s' }} />
        <div className="aurora w-[30rem] h-[30rem] -bottom-32 left-1/4 bg-violet-500/10" style={{ animationDelay: '-11s' }} />
        <div className="dot-grid absolute inset-0" />
      </div>
      <div className="grain-overlay" aria-hidden="true" />

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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 ring-1 ring-white/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">Grraphic</span>
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <User size={16} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative z-10">
          {/* Floating score chips — the product, orbiting the headline */}
          <div className="hidden lg:block" aria-hidden="true">
            <div className="score-chip absolute left-2 top-28 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-lg shadow-black/20" style={{ '--chip-tilt': '-4deg', '--chip-delay': '0s' } as React.CSSProperties}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-gray-300">Typography</span>
              <span className="text-xs font-mono font-semibold text-emerald-300">94</span>
            </div>
            <div className="score-chip absolute right-4 top-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-lg shadow-black/20" style={{ '--chip-tilt': '3deg', '--chip-delay': '-2s' } as React.CSSProperties}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-medium text-gray-300">Color harmony</span>
              <span className="text-xs font-mono font-semibold text-amber-300">88</span>
            </div>
            <div className="score-chip absolute right-14 bottom-6 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-lg shadow-black/20" style={{ '--chip-tilt': '-2deg', '--chip-delay': '-4s' } as React.CSSProperties}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-xs font-medium text-gray-300">Composition</span>
              <span className="text-xs font-mono font-semibold text-violet-300">91</span>
            </div>
          </div>

          <div className="reveal reveal-1 inline-flex items-center gap-2 px-4 py-1.5 mb-7 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-md">
            <Sparkles size={13} className="text-violet-300" />
            <span className="text-xs font-medium tracking-wide text-gray-300 uppercase">Your AI design studio</span>
          </div>

          <h1 className="reveal reveal-2 font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            <span className="block text-balance">
              {mode === 'design' ? 'Design critique,' : 'UI analysis,'}
            </span>
            <span className="block">
              <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300">
                {mode === 'design' ? 'graded in seconds' : 'graded in seconds'}
              </em>
            </span>
          </h1>
          <p className="reveal reveal-3 text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
            {mode === 'design'
              ? 'Drop in any design and get an honest, detailed read on typography, color harmony, composition, and hierarchy — the feedback of a seasoned art director, on demand.'
              : 'Upload HTML or paste a URL for a full UI/UX read — usability, accessibility, responsiveness, and performance, scored and explained.'}
          </p>

          {(state === 'results' || state === 'history' || state === 'success') && (
            <>
              <button
                onClick={startNewAnalysis}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300 mb-8"
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
            <div className="reveal reveal-4 mb-8 flex justify-center">
              <ModeToggle mode={mode} onModeChange={handleModeChange} />
            </div>

            <div className="reveal reveal-5">
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
            </div>

            {/* Quiet proof strip under the upload zone */}
            <div className="reveal reveal-5 mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-400/30 hover:bg-white/[0.05] transition-all duration-300">
                <div className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase mb-2">01 — Grade</div>
                <p className="text-sm text-gray-300 leading-relaxed">Six-category scorecard across typography, color, composition, hierarchy, spacing, and contrast.</p>
              </div>
              <div className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-400/30 hover:bg-white/[0.05] transition-all duration-300">
                <div className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase mb-2">02 — Fix</div>
                <p className="text-sm text-gray-300 leading-relaxed">Concrete, prioritized improvement ideas — not vague vibes. Know exactly what to change first.</p>
              </div>
              <div className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-400/30 hover:bg-white/[0.05] transition-all duration-300">
                <div className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase mb-2">03 — Ship</div>
                <p className="text-sm text-gray-300 leading-relaxed">Iterate in Boxt, build palettes in PaletteX, mock it up, and share your polished work.</p>
              </div>
            </div>

            {/* Pro Subscription Card - Show for non-pro users below upload */}
            {user && !credits?.is_pro_subscriber && (
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
            isProSubscriber={credits?.is_pro_subscriber || false}
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
            isProSubscriber={credits?.is_pro_subscriber || false}
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
              setMockupSection(section as MockupSection);
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

        {state === 'oauth-consent' && (
          <OAuthConsent />
        )}

        {state === 'oauth-callback' && (
          <OAuthCallback />
        )}

        {state === 'developer' && user && (
          <DeveloperPortal
            userId={user.id}
            onBack={() => {
              setState('upload');
              window.history.pushState({}, '', '/');
            }}
          />
        )}
        
        {state === 'shared' && sharedToken && (
          <SharedView
            token={sharedToken}
            onGoHome={() => {
              setSharedToken(null);
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
      <footer className="relative z-10 border-t border-white/[0.07] bg-black/20 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 rounded-lg shadow-lg shadow-violet-500/25 ring-1 ring-white/20">
                  <Sparkles size={16} className="text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">Grraphic</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md leading-relaxed">
                The AI design studio that grades your work like a seasoned art director —
                honest scores, concrete fixes, and the tools to ship something better.
              </p>
            </div>

            <div>
              <h4 className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase mb-4">Studio</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Typography Analysis</li>
                <li>Color Harmony Check</li>
                <li>Composition Review</li>
                <li>Accessibility Testing</li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={() => {
                      setState('privacy');
                      window.history.pushState({}, '', '/privacy');
                    }}
                    className="hover:text-white transition-colors"
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
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <a href="mailto:support@grraphic.com" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.07] pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Grraphic. Built with care for designers.</p>
            <p className="font-mono text-xs text-gray-600">grade · fix · ship</p>
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
