
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

type AuthState = 'landing' | 'login' | 'signup' | 'app' | 'pricing';

function App() {
  // Domain Detection
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAppDomain = hostname.startsWith('app.');
  const isProductionLanding = hostname === 'revuqai.com' || hostname === 'www.revuqai.com';
  const isLocalhost = hostname.includes('localhost');

  const [user, setUser] = useState<User | null>(null);
  
  // Initialize view based on domain: 
  // If App Domain: Check hash for specific view (e.g. #signup), otherwise default to Login.
  // If Landing Domain: Default to Landing.
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

    // CRITICAL: Check for recovery flow in URL hash immediately
    // Supabase redirects with #access_token=...&type=recovery
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery')) {
        console.log("Detected password recovery flow from URL hash");
        setIsRecoveryMode(true);
    }

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
            // FIX: Map database snake_case columns to AnalysisResult camelCase properties
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
              isDeleted: e.is_deleted || false // Map soft delete flag
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
                // Logic: If on App Domain, stay on login. If on Landing Domain, go to Landing.
                // Exception: Pricing page should stay accessible.
                if (authView !== 'pricing' && authView !== 'signup') {
                    setAuthView(isAppDomain ? 'login' : 'landing');
                }
                setUser(null);
                setIsLoadingUser(false);
            }
            return;
        }

        // Logic: User exists. 
        // If on Landing Domain (Production), redirect to App Domain.
        if (isProductionLanding) {
            window.location.href = 'https://app.revuqai.com';
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
                setUser(prev => prev ? ({ 
                    ...prev, 
                    name: profile.name, 
                    company: profile.company,
                    role: profile.role // Load role
                }) : prev);
            } else if (!profile) {
                // Auto-create profile if missing
                const newProfile = {
                    id: session.user.id,
                    name: basicUser.name,
                    email: basicUser.email,
                    company: basicUser.company,
                    role: 'user'
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

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
        if (mounted && isLoadingUser) {
            console.warn("Auth check timed out, forcing default view.");
            setIsLoadingUser(false);
            if (authView !== 'pricing') {
               setAuthView(isAppDomain ? 'login' : 'landing');
            }
        }
    }, 5000);

    // Initial Session Check
    supabase.auth.getSession().then(({ data, error }) => {
        clearTimeout(safetyTimeout);
        if (error) {
            console.warn("Session check error (likely invalid refresh token):", error.message);
            // Explicitly sign out to clear invalid tokens from storage
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
        console.error("Supabase session check exception:", err);
        clearTimeout(safetyTimeout);
        // Force cleanup
        supabase.auth.signOut();
        if(mounted) {
            setIsLoadingUser(false);
            setAuthView(isAppDomain ? 'login' : 'landing');
        }
    });

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth Event:", event);
        // Handle Password Recovery Event explicitly
        if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryMode(true);
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
            processSession(session);
        } else if (event === 'SIGNED_OUT') {
            // Redirect to marketing site if on app domain
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

  const handleDeleteEvaluation = async (id: string) => {
    // Soft Delete: Just mark as deleted
    if (!window.confirm("Move this evaluation to Trash?")) {
      return;
    }

    // Optimistic soft delete
    setHistory(prev => prev.map(item => item.id === id ? { ...item, isDeleted: true } : item));
    
    // If deleting the currently selected one, go back
    if (selectedEvaluation?.id === id) {
        setSelectedEvaluation(null);
        setCurrentView('history');
    }

    if (user) {
        try {
            // Perform Update instead of Delete
            await supabase.from('evaluations').update({ is_deleted: true }).eq('id', id);
        } catch(e) {
            console.error("Error deleting evaluation:", e);
        }
    }
  };

  const handleRestoreEvaluation = async (id: string) => {
      // Optimistic restore
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
      if (!window.confirm("Permanently delete this evaluation? This action cannot be undone.")) {
          return;
      }

      // Optimistic permanent delete
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
      // Optimistic update
      setHistory(prev => prev.map(item => item.id === updated.id ? updated : item));
      setSelectedEvaluation(updated); // Update the view

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
    // Redirect to marketing site if on app domain
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
      // Reset filter when navigating via sidebar to keep it clean, 
      // unless we are specifically going to history, where we default to 'all'
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

  // --- Handlers for Landing Page Actions ---
  const handleLandingLoginClick = () => {
      if (isProductionLanding) {
          window.location.href = 'https://app.revuqai.com';
      } else {
          setAuthView('login');
      }
  };

  const handleLandingSignupClick = () => {
      if (isProductionLanding) {
          // Redirect with hash to trigger signup view on the app domain
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
        // Protect route - only allow admin users
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

  // 1. Loading State
  // Don't show generic loader if we know we are recovering
  if (isLoadingUser && !isRecoveryMode) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 animate-fade-in">
              <Loader2 className="animate-spin text-[#0500e2]" size={40} />
          </div>
      )
  }

  // 2. Password Recovery Mode (Takes precedence over normal app view if active)
  if (isRecoveryMode) {
      return (
        <div className="animate-fade-in w-full min-h-screen">
          <UpdatePassword onComplete={() => setIsRecoveryMode(false)} />
        </div>
      );
  }

  // 3. Public Pages
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
                onBack={() => setAuthView(isAppDomain ? 'login' : 'landing')}
            />
        </div>
      );
  }

  // 4. Auth Views
  if (authView === 'login') {
      return (
        <div className="animate-fade-in w-full min-h-screen">
            <Login 
                onLogin={() => {}} 
                onSwitchToSignup={() => setAuthView('signup')}
                onPricing={() => setAuthView('pricing')}
                onBackToHome={() => setAuthView('landing')} // Will effectively reload or show login again if on app domain, which is fine
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
                onBackToHome={() => setAuthView('landing')}
            />
        </div>
      );
  }

  // 5. Main App
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex font-sans text-slate-900 dark:text-slate-100 print:block print:bg-white print:min-h-0 print:h-auto transition-colors duration-300">
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

      <main className="flex-1 w-full lg:ml-64 transition-all duration-300 print:ml-0 print:w-full print:block">
        <div className="h-full p-4 pt-24 lg:p-8 lg:pt-8 overflow-y-auto print:h-auto print:overflow-visible print:p-0 content-wrapper">
          <div className="max-w-6xl mx-auto print:max-w-none">
            {/* Wrap the content key to trigger page transitions */}
            <div key={currentView} className="animate-fade-in-up">
                <header className="mb-6 lg:mb-8 no-print">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#000000] dark:text-white tracking-tight capitalize">
                    {currentView === 'analyze' ? 'Analyze Interaction' : 
                    currentView === 'evaluation' ? 'Evaluation Details' : 
                    currentView === 'training' ? 'AI Training Center' :
                    currentView === 'usage' ? 'Usage & Limits' :
                    currentView === 'roster' ? 'Team Performance Roster' :
                    currentView === 'settings' ? 'System Settings' : 
                    currentView === 'admin' ? 'Admin Console' :
                    currentView === 'pricing' ? 'Subscription Plans' : currentView}
                    </h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-2">
                    {currentView === 'dashboard' && `Welcome back, ${(user?.name || 'User').split(' ')[0]}. Here is your team's quality overview.`}
                    {currentView === 'analyze' && 'Upload transcripts or paste text to generate instant QA insights.'}
                    {currentView === 'training' && 'Practice tough conversations with AI roleplay scenarios.'}
                    {currentView === 'history' && 'Review past evaluations and track improvement over time.'}
                    {currentView === 'usage' && 'Monitor your credit consumption and manage plan limits.'}
                    {currentView === 'roster' && 'Deep dive into individual agent metrics and trends.'}
                    {currentView === 'settings' && 'Manage your profile and customize quality standards.'}
                    {currentView === 'evaluation' && 'Detailed breakdown of the selected conversation analysis.'}
                    {currentView === 'admin' && 'Manage user accounts, monitor usage, and adjust credit limits.'}
                    {currentView === 'pricing' && 'Upgrade your plan to unlock more credits and features.'}
                    </p>
                </header>
                
                {renderAppView()}
            </div>
          </div>
        </div>
      </main>

      {/* Global Chat Bot Widget - Pass User for Usage Tracking */}
      <ChatBot user={user} />
    </div>
  );
}

export default App;
