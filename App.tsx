
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

// ... (Routes Config - Keep existing)
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

// Safe History Wrappers (Keep existing)
const safePushState = (data: any, unused: string, url: string) => {
    try { window.history.pushState(data, unused, url); } catch (e) {}
};
const safeReplaceState = (data: any, unused: string, url: string) => {
    try { window.history.replaceState(data, unused, url); } catch (e) {}
};

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const { t, isRTL } = useLanguage();
  const [authView, setAuthView] = useState<string>('landing');
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AnalysisResult | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'high' | 'low' | 'trash'>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // ... (Keep existing Navigation logic, PopState, Auth Helper, Theme)

  const handleNavigate = (view: ViewState) => {
      // Permission Check for Routing
      if (view === 'admin' && !hasPermission(user, 'view_admin_console')) {
          alert("Access Denied: Founder privileges required.");
          return;
      }
      if (view === 'roster' && !hasPermission(user, 'manage_team')) {
          alert("Access Denied: Manager privileges required.");
          return;
      }
      
      const path = VIEW_TO_PATH[view];
      if (path) safePushState({}, '', path);
      setCurrentView(view);
      if (view !== 'history' && view !== 'evaluation') setHistoryFilter('all');
  };

  // ... (Keep existing Auth Effect and Load User Data)
  useEffect(() => {
    let mounted = true;
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
    }

    const loadUserData = async (userId: string) => {
        try {
          const { data: criteriaData } = await supabase.from('criteria').select('*').eq('user_id', userId);
          if (criteriaData && criteriaData.length > 0 && mounted) setCriteria(criteriaData);
          
          // Evaluations Fetching (RLS will automatically filter based on role now!)
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
        } catch (e) { console.error("Error loading user data", e); }
    };

    const processSession = async (session: any) => {
        if (!session) {
            if (mounted) {
                if (['pricing', 'signup', 'terms', 'privacy', 'refund'].includes(authView)) return;
                setAuthView('landing');
                setUser(null);
                setIsLoadingUser(false);
            }
            return;
        }

        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            
            if (mounted) {
                // Default fallback if profile is missing (shouldn't happen with triggers, but safe)
                setUser({
                    id: session.user.id,
                    name: profile?.name || session.user.email?.split('@')[0],
                    email: session.user.email,
                    company: profile?.company,
                    website: profile?.website,
                    role: profile?.role as any || 'agent', // Default to agent
                    avatar_url: profile?.avatar_url
                });
                
                // ... (Route handling)
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

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ... (Keep existing Handlers: Theme, UpdateUser, Delete, etc.)

  const renderAppView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard history={history.filter(h => !h.isDeleted)} setView={handleNavigate} />;
      case 'analyze':
        return <Analyzer criteria={criteria} onAnalysisComplete={(res) => {
            setHistory(prev => [res, ...prev]);
            // Re-save logic handled in component usually, but ensure simple update here
        }} user={user} />;
      case 'training':
        return <Training user={user} history={history.filter(h => !h.isDeleted)} onAnalysisComplete={(res) => setHistory(prev => [res, ...prev])} />;
      case 'history':
        return <History history={history} onSelectEvaluation={(r) => {setSelectedEvaluation(r); setCurrentView('evaluation');}} filter={historyFilter} />;
      case 'roster':
        // Guarded by handleNavigate, but double check
        if (!hasPermission(user, 'manage_team')) return <div>Access Denied</div>;
        return <Roster history={history.filter(h => !h.isDeleted)} setView={handleNavigate} onSelectEvaluation={(r) => {setSelectedEvaluation(r); setCurrentView('evaluation');}} />;
      case 'usage':
        if (!hasPermission(user, 'manage_billing')) return <div>Access Denied</div>;
        return <Usage user={user} />;
      case 'settings':
        if (!hasPermission(user, 'configure_qa')) return <div>Access Denied</div>;
        return <Settings criteria={criteria} setCriteria={setCriteria} user={user} onUpdateUser={setUser} />;
      case 'account':
        return <Account user={user} onUpdateUser={setUser} onViewPricing={() => handleNavigate('pricing')} />;
      case 'admin':
        if (!hasPermission(user, 'view_admin_console')) return <div>Access Denied</div>;
        return <Admin user={user} />;
      case 'evaluation':
        if (!selectedEvaluation) return <History history={history} onSelectEvaluation={(r) => {setSelectedEvaluation(r); setCurrentView('evaluation');}} filter='all' />;
        return <EvaluationView result={selectedEvaluation} onBack={() => handleNavigate('history')} onDelete={() => { /* del logic */ }} />;
      default:
        return <Dashboard history={history} setView={handleNavigate} />;
    }
  };

  // ... (Keep loading checks and Auth View renders)
  
  if (isLoadingUser && !isRecoveryMode) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#0500e2]" size={40} /></div>;

  // Only render main app structure if authView === 'app'
  if (authView !== 'app') {
      // Return Landing/Login/Signup components as before
      if (authView === 'login') return <Login onLogin={() => {}} onSwitchToSignup={() => setAuthView('signup')} onBackToHome={() => setAuthView('landing')} onPricing={() => setAuthView('pricing')} />;
      if (authView === 'signup') return <Signup onSignup={() => {}} onSwitchToLogin={() => setAuthView('login')} onBackToHome={() => setAuthView('landing')} onPricing={() => setAuthView('pricing')} />;
      if (authView === 'pricing') return <Pricing isLoggedIn={false} onBack={() => setAuthView('landing')} />;
      return <LandingPage onLoginClick={() => setAuthView('login')} onSignupClick={() => setAuthView('signup')} onPricingClick={() => setAuthView('pricing')} onTermsClick={() => {}} onPrivacyClick={() => {}} onRefundClick={() => {}} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 ${isRTL ? 'rtl' : ''}`}>
      <Sidebar 
        currentView={currentView === 'evaluation' ? 'history' : currentView} 
        setView={handleNavigate} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme as any}
        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onLogout={async () => { await supabase.auth.signOut(); setAuthView('landing'); setUser(null); }}
        user={user}
      />
      {/* ... Mobile Header & Main Content Wrapper (Keep existing) */}
      <main className={`flex-1 w-full lg:ms-64`}>
        <div className="h-full p-4 pt-24 lg:p-8 lg:pt-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
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
