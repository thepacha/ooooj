
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Analyzer } from './components/Analyzer';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Settings } from './components/Settings';
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
import { ViewState, AnalysisResult, Criteria, DEFAULT_CRITERIA, User } from './types';
import { Menu, Loader2 } from 'lucide-react';
import { RevuLogo } from './components/RevuLogo';
import { supabase } from './lib/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

type AuthState = 'landing' | 'login' | 'signup' | 'app' | 'pricing';

// Inner App Component to use the Language Context
function AppContent() {
  // Domain Detection
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAppDomain = hostname.startsWith('app.');
  const isProductionLanding = hostname === 'revuqai.com' || hostname === 'www.revuqai.com';

  const [user, setUser] = useState<User | null>(null);
  const { t, isRTL } = useLanguage();
  
  const [authView, setAuthView] = useState<AuthState>(() => {
      if (isAppDomain) {
          if (typeof window !== 'undefined' && window.location.hash === '#signup') {
              return 'signup';
          }
          return 'login';
      }
      return 'landing';
  });

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AnalysisResult | null>(null);
  
  // Filter state for History view
  const [historyFilter, setHistoryFilter] = useState<'all' | 'high' | 'low' | 'trash'>('all');
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
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

    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
    }

    const loadUserData = async (userId: string) => {
        try {
          const { data: criteriaData } = await supabase
            .from('criteria')
            .select('*')
            .eq('user_id', userId);
          
          if (criteriaData && criteriaData.length > 0) {
             if (mounted) setCriteria(criteriaData);
          } else {
            const defaultWithUserId = DEFAULT_CRITERIA.map(c => ({
                id: crypto.randomUUID(), 
                user_id: userId,
                name: c.name,
                description: c.description,
                weight: c.weight
            }));
            
            if (mounted) setCriteria(defaultWithUserId);

            await supabase.from('criteria').insert(defaultWithUserId.map(c => ({
                user_id: c.user_id,
                name: c.name,
                description: c.description,
                weight: c.weight
            }))); 
          }
    
          const { data: evals } = await supabase
            .from('evaluations')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
    
          if (evals && mounted) {
            const mappedEvals: AnalysisResult[] = evals.map(e => ({
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
          console.error("Error loading user data", e);
        }
    };

    const processSession = async (session: any) => {
        if (!session) {
            if (mounted) {
                if (authView !== 'pricing' && authView !== 'signup') {
                    setAuthView(isAppDomain ? 'login' : 'landing');
                }
                setUser(null);
                setIsLoadingUser(false);
            }
            return;
        }

        if (isProductionLanding) {
            window.location.href = 'https://app.revuqai.com';
            return;
        }

        try {
            const basicUser: User = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                company: session.user.user_metadata?.company || 'My Company'
            };
            
            if (mounted) {
                setUser(basicUser);
                setAuthView('app');
                setIsLoadingUser(false); 
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profile && mounted) {
                setUser(prev => prev ? ({ 
                    ...prev, 
                    name: profile.name, 
                    company: profile.company,
                    role: profile.role 
                }) : prev);
            } else if (!profile) {
                const newProfile = {
                    id: session.user.id,
                    name: basicUser.name,
                    email: basicUser.email,
                    company: basicUser.company,
                    role: 'user'
                };
                await supabase.from('profiles').insert(newProfile);
            }

            await loadUserData(session.user.id);

        } catch (error) {
            console.error("Error processing session:", error);
            if (mounted) setIsLoadingUser(false);
        }
    };

    const safetyTimeout = setTimeout(() => {
        if (mounted && isLoadingUser) {
            console.warn("Auth check timed out, forcing default view.");
            setIsLoadingUser(false);
            if (authView !== 'pricing') {
               setAuthView(isAppDomain ? 'login' : 'landing');
            }
        }
    }, 5000);

    supabase.auth.getSession().then(({ data, error }) => {
        clearTimeout(safetyTimeout);
        if (error) {
            supabase.auth.signOut().then(() => {
                if(mounted) {
                    setIsLoadingUser(false);
                    setAuthView(isAppDomain ? 'login' : 'landing');
                }
            });
            return;
        }
        processSession(data.session);
    }).catch(err => {
        clearTimeout(safetyTimeout);
        supabase.auth.signOut();
        if(mounted) {
            setIsLoadingUser(false);
            setAuthView(isAppDomain ? 'login' : 'landing');
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryMode(true);
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
            processSession(session);
        } else if (event === 'SIGNED_OUT') {
            if (isAppDomain) {
                window.location.href = 'https://revuqai.com';
                return;
            }
            if (mounted) {
                setUser(null);
                setAuthView('landing');
                setHistory([]);
                setIsLoadingUser(false);
                setIsRecoveryMode(false);
            }
        }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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
      setCriteria(newCriteria);
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

  const handleDeleteEvaluation = async (id: string) => {
    if (!window.confirm("Move this evaluation to Trash?")) return;
    setHistory(prev => prev.map(item => item.id === id ? { ...item, isDeleted: true } : item));
    if (selectedEvaluation?.id === id) {
        setSelectedEvaluation(null);
        setCurrentView('history');
    }
    if (user) {
        try {
            await supabase.from('evaluations').update({ is_deleted: true }).eq('id', id);
        } catch(e) {
            console.error("Error deleting evaluation:", e);
        }
    }
  };

  const handleRestoreEvaluation = async (id: string) => {
      setHistory(prev => prev.map(item => item.id === id ? { ...item, isDeleted: false } : item));
      if (user) {
          try {
              await supabase.from('evaluations').update({ is_deleted: false }).eq('id', id);
          } catch(e) {
              console.error("Error restoring evaluation:", e);
          }
      }
  };

  const handlePermanentDelete = async (id: string) => {
      if (!window.confirm("Permanently delete this evaluation? This action cannot be undone.")) return;
      setHistory(prev => prev.filter(item => item.id !== id));
      if (user) {
          try {
              await supabase.from('evaluations').delete().eq('id', id);
          } catch(e) {
              console.error("Error permanently deleting evaluation:", e);
          }
      }
  };

  const handleUpdateEvaluation = async (updated: AnalysisResult) => {
      setHistory(prev => prev.map(item => item.id === updated.id ? updated : item));
      setSelectedEvaluation(updated);
      if (user) {
          try {
              await supabase.from('evaluations').update({
                  agent_name: updated.agentName,
                  customer_name: updated.customerName,
                  summary: updated.summary,
                  overall_score: updated.overallScore,
                  sentiment: updated.sentiment,
                  criteria_results: updated.criteriaResults,
                  raw_transcript: updated.rawTranscript
              }).eq('id', updated.id);
          } catch(e) {
              console.error("Error updating evaluation:", e);
          }
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (isAppDomain) {
        window.location.href = 'https://revuqai.com';
        return;
    }
    setUser(null);
    setAuthView('landing');
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
  };

  const handleSelectEvaluation = (result: AnalysisResult) => {
    setSelectedEvaluation(result);
    setCurrentView('evaluation');
  };
  
  const handleNavWithFilter = (view: ViewState) => {
      setHistoryFilter('all');
      setCurrentView(view);
  };

  const handlePlanSelect = (plan: string) => {
     if (user) {
         alert(`You selected the ${plan} plan. Payment integration coming soon!`);
     } else {
         setAuthView('signup');
     }
  }

  const handleBackToHome = () => {
      if (isAppDomain) {
          window.location.href = 'https://revuqai.com';
      } else {
          setAuthView('landing');
      }
  };

  const handleLandingLoginClick = () => {
      if (isProductionLanding) {
          window.location.href = 'https://app.revuqai.com';
      } else {
          setAuthView('login');
      }
  };

  const handleLandingSignupClick = () => {
      if (isProductionLanding) {
          window.location.href = 'https://app.revuqai.com/#signup';
      } else {
          setAuthView('signup');
      }
  };

  const renderAppView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            history={history.filter(h => !h.isDeleted)} 
            setView={setCurrentView} 
            onFilterSelect={(filter) => {
                setHistoryFilter(filter);
                setCurrentView('history');
            }}
          />
        );
      case 'analyze':
        return <Analyzer criteria={criteria} onAnalysisComplete={handleAnalysisComplete} user={user} />;
      case 'training':
        return <Training user={user} history={history.filter(h => !h.isDeleted)} onAnalysisComplete={handleAnalysisComplete} />;
      case 'history':
        return (
          <History 
            history={history} 
            onSelectEvaluation={handleSelectEvaluation} 
            onDeleteEvaluation={handleDeleteEvaluation}
            onRestoreEvaluation={handleRestoreEvaluation}
            onPermanentDelete={handlePermanentDelete}
            filter={historyFilter}
          />
        );
      case 'roster':
        return <Roster history={history.filter(h => !h.isDeleted)} setView={setCurrentView} onSelectEvaluation={handleSelectEvaluation} />;
      case 'usage':
        return <Usage user={user} />;
      case 'settings':
        return <Settings 
            criteria={criteria} 
            setCriteria={handleSaveCriteria} 
            user={user}
            onUpdateUser={handleUpdateUser}
        />;
      case 'admin':
        if (user?.role !== 'admin') {
            return (
                <Dashboard 
                    history={history.filter(h => !h.isDeleted)} 
                    setView={setCurrentView} 
                    onFilterSelect={(filter) => {
                        setHistoryFilter(filter);
                        setCurrentView('history');
                    }}
                />
            );
        }
        return <Admin user={user} />;
      case 'pricing':
        return <Pricing onPlanSelect={handlePlanSelect} isLoggedIn={true} />;
      case 'evaluation':
        if (!selectedEvaluation) return <History history={history} onSelectEvaluation={handleSelectEvaluation} onDeleteEvaluation={handleDeleteEvaluation} filter='all' />;
        return (
          <EvaluationView 
            result={selectedEvaluation} 
            onBack={() => setCurrentView('history')} 
            onDelete={() => handleDeleteEvaluation(selectedEvaluation.id)}
            onUpdate={handleUpdateEvaluation}
            backLabel="Back to History"
          />
        );
      default:
        return <Dashboard history={history.filter(h => !h.isDeleted)} setView={setCurrentView} />;
    }
  };

  if (isLoadingUser && !isRecoveryMode) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 animate-fade-in">
              <Loader2 className="animate-spin text-[#0500e2]" size={40} />
          </div>
      )
  }

  if (isRecoveryMode) {
      return (
        <div className="animate-fade-in w-full min-h-screen">
          <UpdatePassword onComplete={() => setIsRecoveryMode(false)} />
        </div>
      );
  }

  if (authView === 'landing') {
      return (
        <div className="animate-fade-in w-full min-h-screen">
            <LandingPage 
                onLoginClick={handleLandingLoginClick} 
                onSignupClick={handleLandingSignupClick} 
                onPricingClick={() => setAuthView('pricing')}
            />
        </div>
      );
  }

  if (authView === 'pricing') {
      return (
        <div className="animate-fade-in w-full min-h-screen">
            <Pricing 
                onPlanSelect={handleLandingSignupClick} 
                onLogin={handleLandingLoginClick}
                onSignup={handleLandingSignupClick}
                isLoggedIn={false} 
                onBack={handleBackToHome}
            />
        </div>
      );
  }

  if (authView === 'login') {
      return (
        <div className="animate-fade-in w-full min-h-screen">
            <Login 
                onLogin={() => {}} 
                onSwitchToSignup={() => setAuthView('signup')}
                onPricing={() => setAuthView('pricing')}
                onBackToHome={handleBackToHome}
            />
        </div>
      );
  }

  if (authView === 'signup') {
      return (
        <div className="animate-fade-in w-full min-h-screen">
            <Signup 
                onSignup={() => {}} 
                onSwitchToLogin={() => setAuthView('login')}
                onPricing={() => setAuthView('pricing')}
                onBackToHome={handleBackToHome}
            />
        </div>
      );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex font-sans text-slate-900 dark:text-slate-100 print:block print:bg-white print:min-h-0 print:h-auto transition-colors duration-300 ${isRTL ? 'rtl' : ''}`}>
      <Sidebar 
        currentView={currentView === 'evaluation' ? 'history' : currentView} 
        setView={handleNavWithFilter} 
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

      <main className={`flex-1 w-full lg:ms-64 transition-all duration-300 print:ms-0 print:w-full print:block`}>
        <div className="h-full p-4 pt-24 lg:p-8 lg:pt-8 overflow-y-auto print:h-auto print:overflow-visible print:p-0 content-wrapper">
          <div className="max-w-6xl mx-auto print:max-w-none">
            <div key={currentView} className="animate-fade-in-up">
                <header className="mb-6 lg:mb-8 no-print">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#000000] dark:text-white tracking-tight capitalize">
                    {currentView === 'analyze' ? t('nav.analyze') : 
                    currentView === 'evaluation' ? 'Evaluation Details' : 
                    currentView === 'training' ? t('nav.training') :
                    currentView === 'usage' ? t('nav.usage') :
                    currentView === 'roster' ? t('nav.roster') :
                    currentView === 'settings' ? t('nav.settings') : 
                    currentView === 'admin' ? t('nav.admin') :
                    currentView === 'pricing' ? 'Subscription Plans' : 
                    currentView === 'dashboard' ? t('nav.dashboard') : 
                    currentView === 'history' ? t('nav.history') : currentView}
                    </h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-2">
                    {currentView === 'dashboard' && `${t('dash.welcome')}, ${(user?.name || 'User').split(' ')[0]}. ${t('dash.team_overview')}`}
                    {/* Simplified for brevity in code output, can add all dynamic descriptions later */}
                    </p>
                </header>
                
                {renderAppView()}
            </div>
          </div>
        </div>
      </main>

      <ChatBot user={user} />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
