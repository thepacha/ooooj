import React, { useState } from 'react';
import { RevuLogo } from './RevuLogo';
import { ArrowRight, ArrowLeft, Loader2, Mail, Lock, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToSignup: () => void;
  onBackToHome: () => void;
}

type LoginView = 'login' | 'forgot-password';

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup, onBackToHome }) => {
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Login State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset Password State
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        
        // App.tsx auth state listener will handle redirection
    } catch (err: any) {
        setError(err.message || 'Failed to sign in.');
        setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetStatus('idle');
      setIsResetLoading(true);
      
      try {
          // Use origin to prevent issues with query params in the redirect URL
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin,
          });
          
          if (error) throw error;
          
          setResetStatus('success');
      } catch (err: any) {
          setResetStatus('error');
          setResetMessage(err.message || 'Failed to send reset email.');
      } finally {
          setIsResetLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
      {/* Left Side - Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 relative z-10 transition-all duration-500">
        
        {/* Header / Logo */}
        <div className="mb-12">
            <button onClick={onBackToHome} className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] mb-8 hover:opacity-80 transition-opacity">
                <RevuLogo className="h-8 w-auto" />
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white pt-1">QA</span>
            </button>
            
            <div className="overflow-hidden">
                <h1 className={`text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3 transition-transform duration-500 ${view === 'forgot-password' ? 'translate-y-0' : 'translate-y-0'}`}>
                    {view === 'login' ? 'Welcome back' : 'Reset Password'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    {view === 'login' ? 'Please enter your details to sign in.' : 'Enter your email to receive reset instructions.'}
                </p>
            </div>
        </div>

        {/* LOGIN FORM */}
        {view === 'login' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <form onSubmit={handleLoginSubmit} className="space-y-5 max-w-sm">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jane@company.com"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                            <button 
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setView('forgot-password');
                                }}
                                className="text-sm font-semibold text-[#0500e2] dark:text-[#4b53fa] hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3.5 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500 max-w-sm">
                    Don't have an account?{' '}
                    <button onClick={onSwitchToSignup} className="font-bold text-[#0500e2] hover:underline">Sign up for free</button>
                </p>
            </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {view === 'forgot-password' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-sm">
                {resetStatus === 'success' ? (
                    <div className="text-center py-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/30">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h3>
                        <div className="text-slate-600 dark:text-slate-300 text-sm mb-6 px-4 space-y-2">
                            <p>We've sent password reset instructions to <span className="font-semibold text-slate-800 dark:text-white">{email}</span>.</p>
                            <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg text-left mt-4 border border-yellow-100 dark:border-yellow-800/30">
                                <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                    <strong>Not seeing it?</strong> Check your spam folder or ensure the email matches your account.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 px-6">
                             <button 
                                onClick={() => {
                                    setResetStatus('idle');
                                    setView('login');
                                }}
                                className="w-full px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Return to Log in
                            </button>
                            <button 
                                onClick={() => setResetStatus('idle')}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-2"
                            >
                                Try different email
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleResetSubmit} className="space-y-5">
                         <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3 items-start mb-6">
                            <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-full text-[#0500e2] dark:text-[#4b53fa] shrink-0">
                                <KeyRound size={16} />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                Enter the email address associated with your account and we'll send you a link to reset your password.
                            </p>
                         </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="jane@company.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                                />
                            </div>
                        </div>

                        {resetStatus === 'error' && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                {resetMessage}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isResetLoading}
                            className="w-full py-3.5 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2 mt-4"
                        >
                            {isResetLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send Instructions'}
                        </button>

                        <button 
                            type="button"
                            onClick={() => {
                                setResetStatus('idle');
                                setError(null);
                                setView('login');
                            }}
                            className="w-full py-3 text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back to Log In
                        </button>
                    </form>
                )}
            </div>
        )}
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-slate-900">
         <BackgroundGradientAnimation containerClassName="h-full w-full opacity-60">
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-md shadow-2xl transition-all hover:scale-[1.02]">
                    <div className="text-4xl mb-4">✨</div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-3">"RevuQA cut our grading time by 90%."</h3>
                    <p className="text-blue-100 italic mb-6 text-lg">
                        "The AI insights are scary accurate. My team actually looks forward to their QA scores now because the feedback is so actionable."
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white/20"></div>
                        <div className="text-left">
                            <p className="text-white font-bold text-sm">Sarah Jenkins</p>
                            <p className="text-blue-200 text-xs">VP of Support @ TechFlow</p>
                        </div>
                    </div>
                </div>
             </div>
         </BackgroundGradientAnimation>
      </div>
    </div>
  );
};