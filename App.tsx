
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { motion, AnimatePresence } from 'motion/react';
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
import { PartnersPage } from './components/PartnersPage';
import { ViewState, AnalysisResult, Criteria, DEFAULT_CRITERIA, User } from './types';
import { Loader2, Trash2, AlertTriangle, Sparkles, MessageSquare, TrendingUp, Info } from 'lucide-react';
import { RevuLogo } from './components/RevuLogo';
import { supabase } from './lib/supabase';
import { useLanguage, LanguageProvider } from './contexts/LanguageContext';
import mixpanel from './lib/mixpanel';
import { useNotifications } from './hooks/useNotifications';

type AuthState = 'landing' | 'login' | 'signup' | 'app' | 'pricing' | 'terms' | 'privacy' | 'refund' | 'partners';

// URL Routing Configuration
const APP_ROUTES: Record<string, ViewState> = {
  '/dashboard': 'dashboard',
  '/settings': 'settings',
  '/account': 'account',
  '/analyze': 'analyze',
  '/ai-training': 'training',
  '/usageandlimits': 'usage',
  '/history': 'history',
  '/team': 'roster',
  '/admin': 'admin',
  '/notifications': 'notifications'
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
  'admin': '/admin',
  'notifications': '/notifications'
};

// Safe History Wrappers
const safePushState = (data: any, unused: string, url: string) => {
    try {
        window.history.pushState(data, unused, url);
    } catch (e) {
        console.warn("Navigation URL update prevented in this environment:", e);
    }
};

const safeReplaceState = (data: any, unused: string, url: string) => {
    try {
        window.history.replaceState(data, unused, url);
    } catch (e) {
        console.warn("History replacement prevented in this environment:", e);
    }
};

// Inner App Component to use the Language Context
function AppContent() {
  // Domain Detection
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAppDomain = hostname.startsWith('app.');
  const isProductionLanding = hostname === 'revuqai.com' || hostname === 'www.revuqai.com';

  const [user, setUser] = useState<User | null>(null);
  const { t, isRTL } = useLanguage();
  
  // Initialize State based on URL
  const getInitialState = () => {
      const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';
      
      // Explicit Public/Auth Pages
      if (path === '/termsandconditions') return { auth: 'terms', view: 'dashboard' };
      if (path === '/privacypolicy') return { auth: 'privacy', view: 'dashboard' };
      if (path === '/refund-policy') return { auth: 'refund', view: 'dashboard' };
      if (path === '/partners') return { auth: 'partners', view: 'dashboard' };
      if (path === '/pricing') return { auth: 'pricing', view: 'dashboard' };
      if (path === '/login') return { auth: 'login', view: 'dashboard' };
      if (path === '/signup') return { auth: 'signup', view: 'dashboard' };
      
      // App Pages
      if (APP_ROUTES[path]) {
          return { auth: 'app', view: APP_ROUTES[path] };
      }
      
      // Fallbacks
      if (isAppDomain) {
          if (typeof window !== 'undefined' && window.location.hash === 'signup') {
              return { auth: 'signup', view: 'dashboard' };
          }
          return { auth: 'login', view: 'dashboard' };
      }
      
      return { auth: 'landing', view: 'dashboard' };
  };

  const initialState = getInitialState();
  const [authView, setAuthView] = useState<AuthState>(initialState.auth as AuthState);
  const [currentView, setCurrentView] = useState<ViewState>(initialState.view as ViewState);

  // Unified Navigation Handler
  const handleNavigate = (view: ViewState) => {
      // 1. Update URL if it's a primary view
      const path = VIEW_TO_PATH[view];
      if (path) {
          safePushState({}, '', path);
      }
      // 2. Update State
      setCurrentView(view);
      
      // 3. Reset filters when navigating away from history context (optional but good UX)
      if (view !== 'history' && view !== 'evaluation') {
          setHistoryFilter('all');
      }

      // Mixpanel Page View
      mixpanel.track('Page View', {
          page_title: view,
          page_url: path || view,
          user_id: user?.id
      });
  };

  // Handle Browser Back/Forward Buttons
  useEffect(() => {
      const handlePopState = () => {
          const path = window.location.pathname.replace(/\/$/, '');
          
          // Public Routes
          if (path === '/termsandconditions') { setAuthView('terms'); return; }
          if (path === '/pricing') { setAuthView('pricing'); return; }
          if (path === '/privacypolicy') { setAuthView('privacy'); return; }
          if (path === '/refund-policy') { setAuthView('refund'); return; }
          if (path === '/partners') { setAuthView('partners'); return; }
          if (path === '/login') { setAuthView('login'); return; }
          if (path === '/signup') { setAuthView('signup'); return; }
          
          // App Routes
          if (APP_ROUTES[path]) {
              setAuthView('app');
              setCurrentView(APP_ROUTES[path]);
              mixpanel.track('Page View', {
                  page_title: APP_ROUTES[path],
                  page_url: path,
                  user_id: user?.id
              });
              return;
          }

          // Root or Unknown
          if (path === '' || path === '/') {
              if (user) {
                  setAuthView('app');
                  setCurrentView('dashboard');
                  safeReplaceState({}, '', '/dashboard');
                  mixpanel.track('Page View', {
                      page_title: 'dashboard',
                      page_url: '/dashboard',
                      user_id: user?.id
                  });
              } else {
                  setAuthView('landing');
              }
          }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Auth helper for public pages
  const navigateAuth = (view: AuthState) => {
      let path = '/';
      if (view === 'terms') path = '/termsandconditions';
      else if (view === 'pricing') path = '/pricing';
      else if (view === 'privacy') path = '/privacypolicy';
      else if (view === 'refund') path = '/refund-policy';
      else if (view === 'partners') path = '/partners';
      else if (view === 'login') path = '/login';
      else if (view === 'signup') path = '/signup';
      
      if (typeof window !== 'undefined' && window.location.pathname !== path) {
          safePushState({}, '', path);
      }
      setAuthView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      mixpanel.track('Page View', {
          page_title: view,
          page_url: path,
          user_id: user?.id
      });
  };

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AnalysisResult | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const { notifications, markAsRead, markAllAsRead, addNotification, deleteNotification, deleteAllNotifications } = useNotifications();

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
                // If on public pages, stay there. Otherwise go to login/landing.
                if (authView !== 'pricing' && authView !== 'signup' && authView !== 'terms' && authView !== 'privacy' && authView !== 'refund' && authView !== 'partners') {
                    navigateAuth(isAppDomain ? 'login' : 'landing');
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
                company: session.user.user_metadata?.company || 'My Company',
                website: session.user.user_metadata?.website
            };
            
            if (mounted) {
                setUser(basicUser);
                
                // Mixpanel Identify
                mixpanel.identify(session.user.id);
                mixpanel.people.set({
                    $name: basicUser.name,
                    $email: basicUser.email,
                    company: basicUser.company,
                    website: basicUser.website
                });
                
                // Logic to set view based on URL if already authenticated
                const currentPath = window.location.pathname.replace(/\/$/, '');
                if (APP_ROUTES[currentPath]) {
                    setAuthView('app');
                    setCurrentView(APP_ROUTES[currentPath]);
                } else {
                    // Default to dashboard if we're on a non-app path
                    setAuthView('app');
                    setCurrentView('dashboard');
                    if (currentPath !== '/dashboard') {
                        safeReplaceState({}, '', '/dashboard');
                    }
                }
                
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
                    website: profile.website,
                    role: profile.role,
                    avatar_url: profile.avatar_url
                }) : prev);
                
                // Update Mixpanel with profile data
                mixpanel.people.set({
                    $name: profile.name,
                    company: profile.company,
                    website: profile.website,
                    role: profile.role
                });
            } else if (!profile) {
                const newProfile = {
                    id: session.user.id,
                    name: basicUser.name,
                    email: basicUser.email,
                    company: basicUser.company,
                    website: basicUser.website,
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
            if (authView !== 'pricing' && authView !== 'terms' && authView !== 'privacy' && authView !== 'refund' && authView !== 'partners') {
               navigateAuth(isAppDomain ? 'login' : 'landing');
            }
        }
    }, 5000);

    supabase.auth.getSession().then(({ data, error }) => {
        clearTimeout(safetyTimeout);
        if (error) {
            supabase.auth.signOut().then(() => {
                if(mounted) {
                    setIsLoadingUser(false);
                    navigateAuth(isAppDomain ? 'login' : 'landing');
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
            navigateAuth(isAppDomain ? 'login' : 'landing');
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
                mixpanel.reset(); // Reset Mixpanel on logout
                navigateAuth('landing');
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

    // Add notification
    addNotification({
      type: 'feedback',
      title: 'Analysis Complete',
      message: `Evaluation for ${result.agentName} is ready. Score: ${result.overallScore}%`,
      link: 'evaluation',
      targetId: result.id
    });

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
    
    // We do not call supabase update here because Account component already does it
    // This function is mostly to update local state in App.tsx to reflect changes in Sidebar etc.
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
        handleNavigate('history');
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
    setUser(null);
    setAuthView('landing');
    safePushState({}, '', '/');
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
    
    if (isAppDomain) {
        window.location.href = 'https://revuqai.com';
    }
  };

  const handleSelectEvaluation = (result: AnalysisResult) => {
    setSelectedEvaluation(result);
    // Just change view state, no specific URL for individual evals requested
    setCurrentView('evaluation');
  };
  
  const handleNavWithFilter = (view: ViewState) => {
      setHistoryFilter('all');
      handleNavigate(view);
  };

  const handlePlanSelect = (plan: string) => {
     if (user) {
         mixpanel.track('Purchase', {
             user_id: user.id,
             transaction_id: crypto.randomUUID(), // Mock ID
             revenue: plan === 'pro' ? 59 : plan === 'starter' ? 20 : 199, // Approximate
             currency: 'USD',
             plan_id: plan
         });
         alert(`You selected the ${plan} plan. Payment integration coming soon!`);
     } else {
         mixpanel.track('Initiate Checkout', {
             plan_id: plan
         });
         navigateAuth('signup');
     }
  }

  const handleBackToHome = () => {
      if (isAppDomain) {
          window.location.href = 'https://revuqai.com';
      } else {
          navigateAuth('landing');
      }
  };

  const handleLandingLoginClick = () => {
      if (isProductionLanding) {
          window.location.href = 'https://app.revuqai.com';
      } else {
          navigateAuth('login');
      }
  };

  const handleLandingSignupClick = () => {
      if (isProductionLanding) {
          window.location.href = 'https://app.revuqai.com/signup';
      } else {
          navigateAuth('signup');
      }
  };

  const renderAppView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            history={history.filter(h => !h.isDeleted)} 
            setView={handleNavigate} 
            onFilterSelect={(filter) => {
                setHistoryFilter(filter);
                handleNavigate('history');
            }}
          />
        );
      case 'analyze':
        return <Analyzer criteria={criteria} onAnalysisComplete={handleAnalysisComplete} user={user} addNotification={addNotification} />;
      case 'training':
        return <Training user={user} history={history.filter(h => !h.isDeleted)} onAnalysisComplete={handleAnalysisComplete} addNotification={addNotification} />;
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
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
              <div className="flex gap-4">
                <button
                  onClick={markAllAsRead}
                  disabled={!notifications.some(n => !n.read)}
                  className="text-sm text-[#0500e2] hover:text-[#0400c0] dark:text-[#4b53fa] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  Mark all as read
                </button>
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  disabled={notifications.length === 0}
                  className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  Delete all
                </button>
              </div>
            </div>

            {/* Delete All Confirmation Modal */}
            <AnimatePresence>
              {showDeleteAllModal && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteConfirmText('');
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden relative"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4 text-red-500">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full">
                          <Trash2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Delete All Notifications?</h3>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-6">
                        This action cannot be undone. Please type <span className="font-mono font-bold text-slate-900 dark:text-white">delete</span> to confirm.
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type 'delete' here"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all mb-6"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDeleteAllModal(false);
                            setDeleteConfirmText('');
                          }}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                          onClick={() => {
                            deleteAllNotifications();
                            setShowDeleteAllModal(false);
                            setDeleteConfirmText('');
                          }}
                          className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all ${
                            deleteConfirmText.toLowerCase() === 'delete'
                              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                              : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                          }`}
                        >
                          Delete All
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-[#1a1b26] rounded-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors ${
                        !notification.read
                          ? 'bg-[#0500e2]/5 dark:bg-[#4b53fa]/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {notification.type === 'alert' && <AlertTriangle size={18} className="text-red-500 dark:text-red-400" />}
                          {notification.type === 'feedback' && <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />}
                          {notification.type === 'assignment' && <MessageSquare size={18} className="text-blue-500 dark:text-blue-400" />}
                          {notification.type === 'performance' && <TrendingUp size={18} className="text-green-500 dark:text-green-400" />}
                          {notification.type === 'system' && <Info size={18} className="text-gray-500 dark:text-gray-400" />}
                          {!['alert', 'feedback', 'assignment', 'performance', 'system'].includes(notification.type) && <Info size={18} className="text-gray-500 dark:text-gray-400" />}
                        </div>
                        <div 
                          className={`flex-1 ${notification.link ? 'cursor-pointer group' : ''}`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            if (notification.link === 'evaluation' && notification.targetId) {
                              const targetEval = history.find(h => h.id === notification.targetId);
                              if (targetEval) {
                                handleSelectEvaluation(targetEval);
                              } else {
                                handleNavigate('history');
                              }
                            } else if (notification.link) {
                              handleNavigate(notification.link);
                            }
                          }}
                        >
                          <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} ${notification.link ? 'group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa] transition-colors' : ''}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block">
                            {notification.time}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="w-2 h-2 rounded-full bg-[#0500e2] dark:bg-[#4b53fa] flex-shrink-0 mt-1.5"
                              aria-label="Mark as read"
                            />
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete notification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'roster':
        return <Roster history={history.filter(h => !h.isDeleted)} setView={handleNavigate} onSelectEvaluation={handleSelectEvaluation} />;
      case 'usage':
        return <Usage user={user} />;
      case 'settings':
        return <Settings 
            criteria={criteria} 
            setCriteria={handleSaveCriteria} 
            user={user}
            onUpdateUser={handleUpdateUser}
        />;
      case 'account':
        return <Account 
            user={user}
            onUpdateUser={handleUpdateUser}
            onViewPricing={() => handleNavigate('pricing')}
        />;
      case 'admin':
        if (user?.role !== 'admin') {
            return (
                <Dashboard 
                    history={history.filter(h => !h.isDeleted)} 
                    setView={handleNavigate} 
                    onFilterSelect={(filter) => {
                        setHistoryFilter(filter);
                        handleNavigate('history');
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
            onBack={() => handleNavigate('history')} 
            onDelete={() => handleDeleteEvaluation(selectedEvaluation.id)}
            onUpdate={handleUpdateEvaluation}
            backLabel="Back to History"
          />
        );
      default:
        return <Dashboard history={history.filter(h => !h.isDeleted)} setView={handleNavigate} />;
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

  if (authView === 'terms') {
      return (
          <div className="animate-fade-in w-full min-h-screen">
              <Terms 
                onBack={handleBackToHome}
                onLogin={handleLandingLoginClick} 
                onSignup={handleLandingSignupClick} 
                onPricing={() => navigateAuth('pricing')}
              />
          </div>
      )
  }

  if (authView === 'privacy') {
      return (
          <div className="animate-fade-in w-full min-h-screen">
              <Privacy 
                onBack={handleBackToHome}
                onLogin={handleLandingLoginClick} 
                onSignup={handleLandingSignupClick} 
                onPricing={() => navigateAuth('pricing')}
              />
          </div>
      )
  }

  if (authView === 'refund') {
      return (
          <div className="animate-fade-in w-full min-h-screen">
              <RefundPolicy 
                onBack={handleBackToHome}
                onLogin={handleLandingLoginClick} 
                onSignup={handleLandingSignupClick} 
                onPricing={() => navigateAuth('pricing')}
              />
          </div>
      )
  }

  if (authView === 'partners') {
      return (
          <div className="animate-fade-in w-full min-h-screen">
              <PartnersPage 
                onBack={handleBackToHome}
                onLogin={handleLandingLoginClick} 
                onSignup={handleLandingSignupClick} 
                onPricing={() => navigateAuth('pricing')}
                onTermsClick={() => navigateAuth('terms')}
                onPrivacyClick={() => navigateAuth('privacy')}
                onRefundClick={() => navigateAuth('refund')}
              />
          </div>
      )
  }

  if (authView === 'landing' && !isRecoveryMode) {
      return (
        <AnimatePresence mode="wait">
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full min-h-screen"
          >
              <LandingPage 
                onLoginClick={handleLandingLoginClick} 
                onSignupClick={handleLandingSignupClick} 
                onPricingClick={() => navigateAuth('pricing')}
                onTermsClick={() => navigateAuth('terms')}
                onPrivacyClick={() => navigateAuth('privacy')}
                onRefundClick={() => navigateAuth('refund')}
                onPartnersClick={() => navigateAuth('partners')}
              />
          </motion.div>
        </AnimatePresence>
      );
  }

  if (authView === 'pricing' && !isRecoveryMode) {
      return (
        <AnimatePresence mode="wait">
          <motion.div 
            key="pricing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen"
          >
              <Pricing 
                onPlanSelect={handleLandingSignupClick} 
                onLogin={handleLandingLoginClick}
                onSignup={handleLandingSignupClick}
                isLoggedIn={false} 
                onBack={handleBackToHome}
                onTermsClick={() => navigateAuth('terms')}
                onPrivacyClick={() => navigateAuth('privacy')}
                onRefundClick={() => navigateAuth('refund')}
              />
          </motion.div>
        </AnimatePresence>
      );
  }

  if (authView === 'login' && !isRecoveryMode) {
      return (
        <AnimatePresence mode="wait">
          <motion.div 
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen"
          >
              <Login 
                onLogin={() => {}} 
                onSwitchToSignup={() => navigateAuth('signup')}
                onPricing={() => navigateAuth('pricing')}
                onBackToHome={handleBackToHome}
              />
          </motion.div>
        </AnimatePresence>
      );
  }

  if (authView === 'signup' && !isRecoveryMode) {
      return (
        <AnimatePresence mode="wait">
          <motion.div 
            key="signup"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full min-h-screen"
          >
              <Signup 
                onSignup={() => {}} 
                onSwitchToLogin={() => navigateAuth('login')}
                onPricing={() => navigateAuth('pricing')}
                onBackToHome={handleBackToHome}
              />
          </motion.div>
        </AnimatePresence>
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
      
      {/* Main Content */}
      <main className={`flex-1 w-full lg:ms-64 transition-all duration-300 print:ms-0 print:w-full print:block flex flex-col h-screen relative`}>
        <div className="flex-1 overflow-y-auto print:h-auto print:overflow-visible content-wrapper">
          <TopHeader 
            user={user} 
            onLogout={handleLogout} 
            setView={handleNavWithFilter} 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            notifications={notifications}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
          />
          <div className="p-4 lg:p-8 pt-6 lg:pt-8 max-w-6xl mx-auto print:max-w-none print:p-0">
            <div key={currentView} className="animate-fade-in-up">
                <header className="mb-6 lg:mb-8 no-print">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#000000] dark:text-white tracking-tight capitalize">
                    {currentView === 'analyze' ? t('nav.analyze') : 
                    currentView === 'evaluation' ? 'Evaluation Details' : 
                    currentView === 'training' ? t('nav.training') :
                    currentView === 'usage' ? t('nav.usage') :
                    currentView === 'roster' ? t('nav.roster') :
                    currentView === 'settings' ? t('nav.settings') : 
                    currentView === 'account' ? t('account.title') :
                    currentView === 'admin' ? t('nav.admin') :
                    currentView === 'pricing' ? 'Subscription Plans' : 
                    currentView === 'dashboard' ? t('nav.dashboard') : 
                    currentView === 'history' ? t('nav.history') : currentView}
                    </h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-2">
                    {currentView === 'dashboard' && `${t('dash.welcome')}, ${(user?.name || 'User').split(' ')[0]}. ${t('dash.team_overview')}`}
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