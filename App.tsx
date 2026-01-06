import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Analyzer } from './components/Analyzer';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { ChatBot } from './components/ChatBot';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { EvaluationView } from './components/EvaluationView';
import { ViewState, AnalysisResult, Criteria, DEFAULT_CRITERIA, User } from './types';
import { Menu, Loader2 } from 'lucide-react';
import { RevuLogo } from './components/RevuLogo';
import { supabase } from './lib/supabase';

type AuthState = 'landing' | 'login' | 'signup' | 'app';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthState>('landing');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AnalysisResult | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth & Data Loading Effect
  useEffect(() => {
    let mounted = true;

    const loadUserData = async (userId: string) => {
        try {
          // Fetch Criteria
          const { data: criteriaData } = await supabase
            .from('criteria')
            .select('*')
            .eq('user_id', userId);
          
          if (criteriaData && criteriaData.length > 0) {
             if (mounted) setCriteria(criteriaData);
          } else {
            // Insert defaults if missing (background operation)
            const defaultWithUserId = DEFAULT_CRITERIA.map(c => ({
                id: crypto.randomUUID(), 
                user_id: userId,
                name: c.name,
                description: c.description,
                weight: c.weight
            }));
            
            // Optimistic update locally
            if (mounted) setCriteria(defaultWithUserId);

            await supabase.from('criteria').insert(defaultWithUserId.map(c => ({
                user_id: c.user_id,
                name: c.name,
                description: c.description,
                weight: c.weight
            }))); 
          }
    
          // Fetch Evaluations
          const { data: evals } = await supabase
            .from('evaluations')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
    
          if (evals && mounted) {
            const mappedEvals: AnalysisResult[] = evals.map(e => ({
              id: e.id,
              timestamp: e.timestamp,
              agentName: e.agent_name,
              customerName: e.customer_name,
              summary: e.summary,
              overallScore: e.overall_score,
              sentiment: e.sentiment,
              criteriaResults: e.criteria_results,
              rawTranscript: e.raw_transcript
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
                setUser(null);
                setAuthView('landing');
                setIsLoadingUser(false);
            }
            return;
        }

        try {
            // 1. Set minimal user immediately to unblock UI
            const basicUser: User = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                company: session.user.user_metadata?.company || 'My Company'
            };
            
            if (mounted) {
                setUser(basicUser);
                setAuthView('app');
                setIsLoadingUser(false); // Stop loading immediately
            }

            // 2. Fetch/Update Profile details in background
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profile && mounted) {
                setUser(prev => prev ? ({ ...prev, name: profile.name, company: profile.company }) : prev);
            } else if (!profile) {
                // Auto-create profile if missing
                const newProfile = {
                    id: session.user.id,
                    name: basicUser.name,
                    email: basicUser.email,
                    company: basicUser.company
                };
                await supabase.from('profiles').insert(newProfile);
            }

            // 3. Load App Data in background
            await loadUserData(session.user.id);

        } catch (error) {
            console.error("Error processing session:", error);
            if (mounted) setIsLoadingUser(false);
        }
    };

    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
        processSession(session);
    });

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            processSession(session);
        } else if (event === 'SIGNED_OUT') {
            if (mounted) {
                setUser(null);
                setAuthView('landing');
                setHistory([]);
                setIsLoadingUser(false);
            }
        }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAnalysisComplete = async (result: AnalysisResult) => {
    setHistory((prev) => [result, ...prev]);

    if (user) {
        try {
            await supabase.from('evaluations').insert({
                id: result.id,
                user_id: user.id,
                timestamp: result.timestamp,
                agent_name: result.agentName,
                customer_name: result.customerName,
                summary: result.summary,
                overall_score: result.overallScore,
                sentiment: result.sentiment,
                criteria_results: result.criteriaResults,
                raw_transcript: result.rawTranscript
            });
        } catch (e) {
            console.error("Failed to save evaluation", e);
        }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!user) return;
    
    // Optimistic update
    setUser(updatedUser);

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                name: updatedUser.name,
                company: updatedUser.company
            })
            .eq('id', user.id);
        
        if (error) throw error;
    } catch (e) {
        console.error("Failed to update profile", e);
    }
  };

  const handleSaveCriteria = async (newCriteria: Criteria[]) => {
      setCriteria(newCriteria); // Optimistic update
      
      if (user) {
          try {
             await supabase.from('criteria').delete().eq('user_id', user.id);
             
             const records = newCriteria.map(c => ({
                 user_id: user.id,
                 name: c.name,
                 description: c.description,
                 weight: c.weight
             }));
             
             await supabase.from('criteria').insert(records);
          } catch (e) {
              console.error("Failed to save criteria", e);
          }
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthView('landing');
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
  };

  const handleSelectEvaluation = (result: AnalysisResult) => {
    setSelectedEvaluation(result);
    setCurrentView('evaluation');
  };

  const renderAppView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard history={history} />;
      case 'analyze':
        return <Analyzer criteria={criteria} onAnalysisComplete={handleAnalysisComplete} />;
      case 'history':
        return <History history={history} onSelectEvaluation={handleSelectEvaluation} />;
      case 'settings':
        return <Settings 
            criteria={criteria} 
            setCriteria={handleSaveCriteria} 
            user={user}
            onUpdateUser={handleUpdateUser}
        />;
      case 'evaluation':
        if (!selectedEvaluation) return <History history={history} onSelectEvaluation={handleSelectEvaluation} />;
        return (
          <EvaluationView 
            result={selectedEvaluation} 
            onBack={() => setCurrentView('history')} 
            backLabel="Back to History"
          />
        );
      default:
        return <Dashboard history={history} />;
    }
  };

  if (isLoadingUser) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              <Loader2 className="animate-spin text-[#0500e2]" size={40} />
          </div>
      )
  }

  if (authView === 'landing') {
      return (
        <LandingPage 
            onLoginClick={() => setAuthView('login')} 
            onSignupClick={() => setAuthView('signup')} 
        />
      );
  }

  if (authView === 'login') {
      return (
          <Login 
            onLogin={() => {}} 
            onSwitchToSignup={() => setAuthView('signup')}
            onBackToHome={() => setAuthView('landing')}
          />
      );
  }

  if (authView === 'signup') {
      return (
          <Signup 
            onSignup={() => {}} 
            onSwitchToLogin={() => setAuthView('login')}
            onBackToHome={() => setAuthView('landing')}
          />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 print:block print:bg-white print:min-h-0 print:h-auto transition-colors duration-300">
      <Sidebar 
        currentView={currentView === 'evaluation' ? 'history' : currentView} 
        setView={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        user={user}
      />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 z-10 flex items-center justify-between shadow-sm h-16 no-print mobile-header transition-colors duration-300">
        <div className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa]">
          <RevuLogo className="h-12 w-auto" />
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      <main className="flex-1 w-full lg:ml-64 transition-all duration-300 print:ml-0 print:w-full print:block">
        <div className="h-full p-4 pt-24 lg:p-8 lg:pt-8 overflow-y-auto print:h-auto print:overflow-visible print:p-0 content-wrapper">
          <div className="max-w-6xl mx-auto print:max-w-none">
            <header className="mb-6 lg:mb-8 no-print">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#000000] dark:text-white tracking-tight capitalize">
                  {currentView === 'analyze' ? 'Analyze Interaction' : 
                   currentView === 'evaluation' ? 'Evaluation Details' : 
                   currentView === 'settings' ? 'System Settings' : currentView}
                </h1>
                <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-2">
                  {currentView === 'dashboard' && `Welcome back, ${user?.name.split(' ')[0]}. Here is your team's quality overview.`}
                  {currentView === 'analyze' && 'Upload transcripts or paste text to generate instant QA insights.'}
                  {currentView === 'history' && 'Review past evaluations and track improvement over time.'}
                  {currentView === 'settings' && 'Manage your profile and customize quality standards.'}
                  {currentView === 'evaluation' && 'Detailed breakdown of the selected conversation analysis.'}
                </p>
            </header>
            
            {renderAppView()}
          </div>
        </div>
      </main>

      {/* Global Chat Bot Widget */}
      <ChatBot />
    </div>
  );
}

export default App;