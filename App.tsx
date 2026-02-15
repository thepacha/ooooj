
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

// Mapping URL paths to internal ViewState
const PATH_TO_VIEW: Record<string, ViewState> = {
  '/dashboard': 'dashboard',
  '/analyze': 'analyze',
  '/history': 'history',
  '/team': 'roster',
  '/ai-training': 'training',
  '/usageandlimits': 'usage',
  '/settings': 'settings',
  '/account': 'account',
  '/admin': 'admin'
};

const VIEW_TO_PATH: Record<string, string> = {
  'dashboard': '/dashboard',
  'analyze': '/analyze',
  'history': '/history',
  'roster': '/team',
  'training': '/ai-training',
  'usage': '/usageandlimits',
  'settings': '/settings',
  'account': '/account',
  'admin': '/admin'
};

function AppContent() {
  const { isRTL } = useLanguage();
  
  // --- Global State ---
  const [isInitializing, setIsInitializing] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  
  // --- Navigation State ---
  // We initialize strictly based on the URL to prevent "jumping"
  const getInitialView = (): ViewState => {
    const path = window.location.pathname;
    return PATH_TO_VIEW[path] || 'dashboard';
  };
  const [currentView, setCurrentView] = useState<ViewState>(getInitialView());
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // --- App Data State ---
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AnalysisResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // --- Initialization Effect ---
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      // 1. Check for Recovery Mode (Password Reset)
      if (window.location.hash && window.location.hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
        setIsInitializing(false);
        return;
      }

      // 2. Get Supabase Session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (mounted) {
        setSession(initialSession);
        if (initialSession) {
          await loadUserProfile(initialSession.user.id);
        }
        setIsInitializing(false);
      }
    };

    initializeApp();

    // 3. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      setSession(newSession);
      
      if (newSession && !userProfile) {
        await loadUserProfile(newSession.user.id);
      } else if (!newSession) {
        setUserProfile(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    // 4. Listen for Browser Navigation (Back/Forward)
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      if (PATH_TO_VIEW[path]) {
        setCurrentView(PATH_TO_VIEW[path]);
      }
    };
    window.addEventListener('popstate', handlePopState);

    // 5. Theme Preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // --- Helper: Load Profile & Data ---
  const loadUserProfile = async (userId: string) => {
    try {
      // Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // User Object Construction
      const fullUser: User = {
        id: userId,
        name: profile?.name || 'User',
        email: profile?.email || '',
        company: profile?.company,
        website: profile?.website,
        role: profile?.role || 'agent',
        avatar_url: profile?.avatar_url
      };
      setUserProfile(fullUser);

      // App Data (Parallel)
      const [criteriaRes, evalsRes] = await Promise.all([
        supabase.from('criteria').select('*').eq('user_id', userId),
        supabase
          .from('evaluations')
          .select('*')
          .order('timestamp', { ascending: false })
      ]);

      if (criteriaRes.data && criteriaRes.data.length > 0) {
        setCriteria(criteriaRes.data);
      }

      if (evalsRes.data) {
        const mappedEvals: AnalysisResult[] = evalsRes.data.map(e => ({
          id: e.id,
          timestamp: e.timestamp,
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
      console.error("Error loading profile data", e);
    }
  };

  // --- Helper: Navigation ---
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    
    // If it's an app route, update currentView
    if (PATH_TO_VIEW[path]) {
      setCurrentView(PATH_TO_VIEW[path]);
    }
    
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Theme Effect ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);


  // ==========================================
  // VIEW LOGIC
  // ==========================================

  // 1. Loading State (Strict Blocking)
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-[#0500e2]" size={48} />
      </div>
    );
  }

  // 2. Recovery Mode
  if (isRecoveryMode) {
    return (
      <UpdatePassword onComplete={() => { 
        setIsRecoveryMode(false); 
        navigate('/dashboard'); 
      }} />
    );
  }

  // 3. Authenticated App View
  if (session && userProfile) {
    // Redirect public routes to dashboard if logged in
    if (['/', '/login', '/signup', '/pricing', '/terms', '/privacy', '/refund'].includes(currentPath)) {
        // Use replaceState to avoid back-button traps
        window.history.replaceState({}, '', '/dashboard');
        setCurrentPath('/dashboard');
        setCurrentView('dashboard');
    }

    const handleAppNavigate = (view: ViewState) => {
      // Check permissions
      if (view === 'admin' && !hasPermission(userProfile, 'view_admin_console')) return;
      if (view === 'roster' && !hasPermission(userProfile, 'manage_team')) return;
      
      const path = VIEW_TO_PATH[view];
      if (path) navigate(path);
    };

    const renderMainContent = () => {
      switch (currentView) {
        case 'dashboard': return <Dashboard history={history.filter(h => !h.isDeleted)} setView={handleAppNavigate} />;
        case 'analyze': return <Analyzer criteria={criteria} onAnalysisComplete={(res) => setHistory(prev => [res, ...prev])} user={userProfile} />;
        case 'training': return <Training user={userProfile} history={history.filter(h => !h.isDeleted)} onAnalysisComplete={(res) => setHistory(prev => [res, ...prev])} />;
        case 'history': return <History history={history} onSelectEvaluation={(r) => { setSelectedEvaluation(r); setCurrentView('evaluation'); }} filter='all' />;
        case 'roster': return <Roster history={history.filter(h => !h.isDeleted)} setView={handleAppNavigate} onSelectEvaluation={(r) => { setSelectedEvaluation(r); setCurrentView('evaluation'); }} />;
        case 'usage': return <Usage user={userProfile} />;
        case 'settings': return <Settings criteria={criteria} setCriteria={setCriteria} user={userProfile} onUpdateUser={setUserProfile} />;
        case 'account': return <Account user={userProfile} onUpdateUser={setUserProfile} onViewPricing={() => navigate('/pricing')} />; // Note: Pricing inside app might need modal or special handling if we want to keep sidebar
        case 'admin': return <Admin user={userProfile} />;
        case 'evaluation': 
          if (!selectedEvaluation) return <History history={history} onSelectEvaluation={(r) => { setSelectedEvaluation(r); setCurrentView('evaluation'); }} />;
          return <EvaluationView result={selectedEvaluation} onBack={() => handleAppNavigate('history')} onDelete={() => { /* Implement delete logic */ }} />;
        default: return <Dashboard history={history} setView={handleAppNavigate} />;
      }
    };

    return (
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 ${isRTL ? 'rtl' : ''}`}>
        <Sidebar 
          currentView={currentView === 'evaluation' ? 'history' : currentView} 
          setView={handleAppNavigate} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          theme={theme as any}
          toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          onLogout={async () => { 
            await supabase.auth.signOut();
            setSession(null);
            setUserProfile(null);
            navigate('/');
          }}
          user={userProfile}
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
               {renderMainContent()}
            </div>
          </div>
        </main>
        <ChatBot user={userProfile} />
      </div>
    );
  }

  // 4. Public Pages (Logged Out)
  // Protected routes redirect to Login
  if (['/dashboard', '/analyze', '/history', '/team', '/ai-training', '/usageandlimits', '/settings', '/account', '/admin'].includes(currentPath)) {
      navigate('/login');
      return null;
  }

  switch (currentPath) {
    case '/login':
      return <Login onLogin={() => {}} onSwitchToSignup={() => navigate('/signup')} onBackToHome={() => navigate('/')} onPricing={() => navigate('/pricing')} />;
    case '/signup':
      return <Signup onSignup={() => {}} onSwitchToLogin={() => navigate('/login')} onBackToHome={() => navigate('/')} onPricing={() => navigate('/pricing')} />;
    case '/pricing':
      return <Pricing isLoggedIn={false} onBack={() => navigate('/')} onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} onTermsClick={() => navigate('/terms')} onPrivacyClick={() => navigate('/privacy')} onRefundClick={() => navigate('/refund')} />;
    case '/terms':
      return <Terms onBack={() => navigate('/')} onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} onPricing={() => navigate('/pricing')} />;
    case '/privacy':
      return <Privacy onBack={() => navigate('/')} onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} onPricing={() => navigate('/pricing')} />;
    case '/refund':
      return <RefundPolicy onBack={() => navigate('/')} onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} onPricing={() => navigate('/pricing')} />;
    default:
      return (
        <LandingPage 
          onLoginClick={() => navigate('/login')} 
          onSignupClick={() => navigate('/signup')} 
          onPricingClick={() => navigate('/pricing')}
          onTermsClick={() => navigate('/terms')}
          onPrivacyClick={() => navigate('/privacy')}
          onRefundClick={() => navigate('/refund')}
        />
      );
  }
}

function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}

export default App;
