
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Analyzer } from './components/Analyzer';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Account } from './components/Account';
import { Usage } from './components/Usage';
import { ChatBot } from './components/ChatBot';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { UpdatePassword } from './components/UpdatePassword';
import { EvaluationView } from './components/EvaluationView';
import { Roster } from './components/Roster';
import { Pricing } from './components/Pricing';
import { Training } from './components/Training';
import { Admin } from './components/Admin';
import { Terms } from './components/Terms';
import { Privacy } from './components/Privacy';
import { RefundPolicy } from './components/RefundPolicy';
import { ViewState, AnalysisResult, Criteria, DEFAULT_CRITERIA, User } from './types';
import { Menu, Loader2 } from 'lucide-react';
import { RevuLogo } from './components/RevuLogo';
import { supabase } from './lib/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { hasPermission } from './lib/permissions';

const APP_ROUTES: Record<string, ViewState> = {
  '/dashboard': 'dashboard',
  '/settings': 'settings',
  '/account': 'account',
  '/analyze': 'analyze',
  '/ai-training': 'training',
  '/usageandlimits': 'usage',
  '/history': 'history',
  '/team': 'roster',
  '/admin': 'admin'
};

const VIEW_TO_PATH: Record<string, string> = {
  'dashboard': '/dashboard',
  'settings': '/settings',
  'account': '/account',
  'analyze': '/analyze',
  'training': '/ai-training',
  'usage': '/usageandlimits',
  'history': '/history',
  'roster': '/team',
  'admin': '/admin'
};

// Safe History Wrappers
const safePushState = (data: any, unused: string, url: string) => {
    try { window.history.pushState(data, unused, url); } catch (e) {}
};
const safeReplaceState = (data: any, unused: string, url: string) => {
    try { window.history.replaceState(data, unused, url); } catch (e) {}
};

function AppContent() {
  const { t, isRTL } = useLanguage();
  
  // Initialize View State based on URL to prevent flash/reload loops
  const getInitialAuthView = () => {
      const path = window.location.pathname;
      if (path === '/login') return 'login';
      if (path === '/signup') return 'signup';
      if (path === '/pricing') return 'pricing';
      if (path === '/terms') return 'terms';
      if (path === '/privacy') return 'privacy';
      if (path === '/refund') return 'refund';
      return 'landing';
  };

  const [authView, setAuthView] = useState<string>(getInitialAuthView());
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AnalysisResult | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'high' | 'low' | 'trash'>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Handle Navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      
      // Public Route Handling
      if (['/login', '/signup', '/pricing', '/terms', '/privacy', '/refund'].includes(path)) {
          setAuthView(path.substring(1)); // remove slash
          return;
      }
      
      // App Route Handling
      if (APP_ROUTES[path]) {
        setCurrentView(APP_ROUTES[path]);
      } else if (path === '/' && user) {
        setCurrentView('dashboard');
      } else if (path === '/' && !user) {
        setAuthView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleNavigate = (view: ViewState) => {
      // Permission Checks
      if (view === 'admin' && !hasPermission(user, 'view_admin_console')) {
          return; // Silently fail or show toast
      }
      if (view === 'roster' && !hasPermission(user, 'manage_team')) {
          return;
      }
      if (view === 'settings' && !hasPermission(user, 'configure_qa')) {
          return;
      }
      if (view === 'usage' && !hasPermission(user, 'manage_billing')) {
          return;
      }

      const path = VIEW_TO_PATH[view];
      if (path) safePushState({}, '', path);
      setCurrentView(view);
      
      // Reset states on navigation
      if (view !== 'history' && view !== 'evaluation') setHistoryFilter('all');
      setIsSidebarOpen(false); // Close mobile menu
  };

  // Auth & Data Loading
  useEffect(() => {
    let mounted = true;
    
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
    }

    const loadUserData = async (userId: string) => {
        try {
          // Load Criteria
          const { data: criteriaData } = await supabase.from('criteria').select('*').eq('user_id', userId);
          if (criteriaData && criteriaData.length > 0 && mounted) setCriteria(criteriaData);
          
          // Load Evaluations
          const { data: evals } = await supabase
            .from('evaluations')
            .select('*')
            .order('timestamp', { ascending: false });
    
          if (evals && mounted) {
            const mappedEvals: AnalysisResult[] = evals.map(e => ({
              id: e.id,
              timestamp: e.timestamp,
              agent_name: e.agent_name, 
              agentName: e.agent_name || 'Unknown Agent', 
              customerName: e.customer_name || 'Unknown Customer', 
              summary: e.summary || '',
              overallScore: e.overall_score || 0,
              sentiment: e.sentiment || 'Neutral',
              criteriaResults: e.criteria_results || [], 
              rawTranscript: e.raw_transcript || '',
              isDeleted: e.is_deleted || false
            }));
            setHistory(mappedEvals);
          }
        } catch (e) { 
            console.error("Error loading user data", e); 
        }
    };

    const processSession = async (session: any) => {
        if (!session) {
            if (mounted) {
                // Determine if we should stay on a public page or go to landing
                const currentPath = window.location.pathname;
                const publicPaths = ['/pricing', '/signup', '/login', '/terms', '/privacy', '/refund'];
                
                if (!publicPaths.includes(currentPath)) {
                    setAuthView('landing');
                    if (currentPath !== '/') safeReplaceState({}, '', '/');
                } else {
                    // Ensure authView matches URL if we refreshed on a public page
                    setAuthView(currentPath.substring(1));
                }
                
                setUser(null);
                setIsLoadingUser(false);
            }
            return;
        }

        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            
            if (mounted) {
                setUser({
                    id: session.user.id,
                    name: profile?.name || session.user.email?.split('@')[0],
                    email: session.user.email,
                    company: profile?.company,
                    website: profile?.website,
                    role: profile?.role as any || 'agent',
                    avatar_url: profile?.avatar_url
                });
                
                // Handle Initial Route Mapping for Logged In User
                const currentPath = window.location.pathname;
                if (APP_ROUTES[currentPath]) {
                    setCurrentView(APP_ROUTES[currentPath]);
                } else {
                    // Default to dashboard if on root or unknown route
                    setCurrentView('dashboard');
                    if (currentPath !== '/dashboard') safeReplaceState({}, '', '/dashboard');
                }

                setAuthView('app');
                setIsLoadingUser(false); 
            }
            await loadUserData(session.user.id);
        } catch (error) {
            console.error("Error processing session:", error);
            if (mounted) setIsLoadingUser(false);
        }
    };

    supabase.auth.getSession().then(({ data }) => processSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => processSession(session));

    // Dark mode init
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Update HTML class for theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth Navigation Helpers
  const handleNavToLogin = () => {
      setAuthView('login');
      safePushState({}, '', '/login');
  };
  const handleNavToSignup = () => {
      setAuthView('signup');
      safePushState({}, '', '/signup');
  };
  const handleNavToPricing = () => {
      setAuthView('pricing');
      safePushState({}, '', '/pricing');
  };
  const handleNavToLanding = () => {
      setAuthView('landing');
      safePushState({}, '', '/');
  };
  const handleNavToTerms = () => {
      setAuthView('terms');
      safePushState({}, '', '/terms');
  };
  const handleNavToPrivacy = () => {
      setAuthView('privacy');
      safePushState({}, '', '/privacy');
  };
  const handleNavToRefund = () => {
      setAuthView('refund');
      safePushState({}, '', '/refund');
  };

  const renderAppView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard history={history.filter(h => !h.isDeleted)} setView={handleNavigate} />;
      case 'analyze':
        return <Analyzer criteria={criteria} onAnalysisComplete={(res) => {
            setHistory(prev => [res, ...prev]);
        }} user={user} />;
      case 'training':
        return <Training user={user} history={history.filter(h => !h.isDeleted)} onAnalysisComplete={(res) => setHistory(prev => [res, ...prev])} />;
      case 'history':
        return <History history={history} onSelectEvaluation={(r) => {setSelectedEvaluation(r); setCurrentView('evaluation');}} filter={historyFilter} />;
      case 'roster':
        return <Roster history={history.filter(h => !h.isDeleted)} setView={handleNavigate} onSelectEvaluation={(r) => {setSelectedEvaluation(r); setCurrentView('evaluation');}} />;
      case 'usage':
        return <Usage user={user} />;
      case 'settings':
        return <Settings criteria={criteria} setCriteria={setCriteria} user={user} onUpdateUser={setUser} />;
      case 'account':
        return <Account user={user} onUpdateUser={setUser} onViewPricing={handleNavToPricing} />;
      case 'admin':
        return <Admin user={user} />;
      case 'evaluation':
        if (!selectedEvaluation) return <History history={history} onSelectEvaluation={(r) => {setSelectedEvaluation(r); setCurrentView('evaluation');}} filter='all' />;
        return <EvaluationView result={selectedEvaluation} onBack={() => handleNavigate('history')} onDelete={() => { /* del logic handled in component usually, or pass handler */ }} />;
      default:
        return <Dashboard history={history} setView={handleNavigate} />;
    }
  };

  if (isLoadingUser && !isRecoveryMode) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-[#0500e2]" size={40} /></div>;
  }

  // Recovery Mode (Password Reset)
  if (isRecoveryMode) {
      return <UpdatePassword onComplete={() => { setIsRecoveryMode(false); setAuthView('app'); }} />;
  }

  // Public Views
  if (authView !== 'app') {
      if (authView === 'login') return <Login onLogin={() => {}} onSwitchToSignup={handleNavToSignup} onBackToHome={handleNavToLanding} onPricing={handleNavToPricing} />;
      if (authView === 'signup') return <Signup onSignup={() => {}} onSwitchToLogin={handleNavToLogin} onBackToHome={handleNavToLanding} onPricing={handleNavToPricing} />;
      if (authView === 'pricing') return <Pricing isLoggedIn={false} onBack={handleNavToLanding} onLogin={handleNavToLogin} onSignup={handleNavToSignup} onTermsClick={handleNavToTerms} onPrivacyClick={handleNavToPrivacy} onRefundClick={handleNavToRefund} />;
      if (authView === 'terms') return <Terms onBack={handleNavToLanding} onLogin={handleNavToLogin} onSignup={handleNavToSignup} onPricing={handleNavToPricing} />;
      if (authView === 'privacy') return <Privacy onBack={handleNavToLanding} onLogin={handleNavToLogin} onSignup={handleNavToSignup} onPricing={handleNavToPricing} />;
      if (authView === 'refund') return <RefundPolicy onBack={handleNavToLanding} onLogin={handleNavToLogin} onSignup={handleNavToSignup} onPricing={handleNavToPricing} />;
      
      // Landing Page
      return <LandingPage 
        onLoginClick={handleNavToLogin} 
        onSignupClick={handleNavToSignup} 
        onPricingClick={handleNavToPricing}
        onTermsClick={handleNavToTerms}
        onPrivacyClick={handleNavToPrivacy}
        onRefundClick={handleNavToRefund}
      />;
  }

  // Main App View
  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 ${isRTL ? 'rtl' : ''}`}>
      <Sidebar 
        currentView={currentView === 'evaluation' ? 'history' : currentView} 
        setView={handleNavigate} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme as any}
        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onLogout={async () => { 
            await supabase.auth.signOut(); 
            setAuthView('landing'); 
            setUser(null);
            safePushState({}, '', '/');
        }}
        user={user}
      />
      
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa]">
            <RevuLogo className="h-8 w-auto" />
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
            <Menu size={24} />
        </button>
      </div>

      <main className={`flex-1 w-full lg:ms-64 transition-all duration-300`}>
        <div className="h-full p-4 pt-24 lg:p-8 lg:pt-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
             {renderAppView()}
          </div>
        </div>
      </main>
      <ChatBot user={user} />
    </div>
  );
}

function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}

export default App;
