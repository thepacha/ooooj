
import React, { useState } from 'react';
import { ArrowRight, Loader2, Mail, Lock, KeyRound, CheckCircle, AlertTriangle, Chrome, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';
import { supabase } from '../lib/supabase';
import { PublicNavigation } from './PublicNavigation';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToSignup: () => void;
  onBackToHome: () => void;
  onPricing: () => void;
}

type LoginView = 'login' | 'forgot-password';

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup, onBackToHome, onPricing }) => {
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t, isRTL } = useLanguage();
  
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

  const handleSocialLogin = () => {
      alert("Social login integration coming soon!");
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans selection:bg-[#0500e2] selection:text-white">
      {/* Header */}
      <PublicNavigation 
        onLanding={onBackToHome}
        onLogin={() => {}} // Already on login
        onSignup={onSwitchToSignup}
        onPricing={onPricing}
        activePage="login"
      />

      {/* Left Side - Form Container */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center p-8 md:p-12 lg:p-16 relative z-10 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 pt-32 lg:pt-32">
        
        <div className="max-w-md mx-auto w-full">
            <div className="mb-10">
                <div className="overflow-hidden">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3">
                        {view === 'login' ? t('auth.welcome_back') : t('auth.reset_password')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        {view === 'login' ? t('auth.login_subtitle') : t('auth.reset_subtitle')}
                    </p>
                </div>
            </div>

            {/* LOGIN FORM */}
            {view === 'login' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Social Login Block */}
                    <button 
                        onClick={handleSocialLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all mb-6 group"
                    >
                        <Chrome size={20} className="text-slate-900 dark:text-white" />
                        <span>{t('auth.continue_google')}</span>
                    </button>

                    <div className="relative flex items-center gap-4 mb-6">
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('auth.or_sign_in_email')}</span>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.email_label')}</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.email_placeholder')}
                                    className="w-full ps-11 pe-4 py-3.5 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.password_label')}</label>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setView('forgot-password');
                                    }}
                                    className="text-sm font-semibold text-[#0500e2] dark:text-[#4b53fa] hover:underline"
                                >
                                    {t('auth.forgot_password')}
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('auth.password_placeholder')}
                                    className="w-full ps-11 pe-12 py-3.5 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-[#0500e2] focus:ring-[#0500e2]" />
                            <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">{t('auth.remember_me')}</label>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 hover:shadow-blue-600/30 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? <Loader2 size={22} className="animate-spin" /> : <>{t('auth.sign_in_btn')} <ArrowRight size={20} className={isRTL ? "rotate-180" : ""} /></>}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t('auth.no_account')}{' '}
                        <button onClick={onSwitchToSignup} className="font-bold text-[#0500e2] dark:text-[#4b53fa] hover:underline">{t('auth.signup_link')}</button>
                    </p>
                </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {view === 'forgot-password' && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    {resetStatus === 'success' ? (
                        <div className="text-center py-8 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/30 shadow-sm">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.check_email')}</h3>
                            <div className="text-slate-600 dark:text-slate-300 text-sm mb-8 px-6 space-y-2">
                                <p>{t('auth.sent_instructions')} <br/><span className="font-semibold text-slate-900 dark:text-white">{email}</span>.</p>
                            </div>
                            <div className="flex flex-col gap-3 px-8">
                                <button 
                                    onClick={() => {
                                        setResetStatus('idle');
                                        setView('login');
                                    }}
                                    className="w-full px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    {t('auth.back_login')}
                                </button>
                                <button 
                                    onClick={() => setResetStatus('idle')}
                                    className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {t('auth.diff_email')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleResetSubmit} className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-4 items-start">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-800/30 rounded-full text-[#0500e2] dark:text-[#4b53fa] shrink-0">
                                    <KeyRound size={20} />
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                                    {t('auth.reset_desc')}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.email_label')}</label>
                                <div className="relative group">
                                    <Mail size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('auth.email_placeholder')}
                                        className="w-full ps-11 pe-4 py-3.5 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {resetStatus === 'error' && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3">
                                    <AlertTriangle size={18} />
                                    {resetMessage}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isResetLoading}
                                className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {isResetLoading ? <Loader2 size={22} className="animate-spin" /> : t('auth.send_instructions')}
                            </button>

                            <button 
                                type="button"
                                onClick={() => {
                                    setResetStatus('idle');
                                    setError(null);
                                    setView('login');
                                }}
                                className="w-full py-2 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} className={isRTL ? "rotate-180" : ""} /> {t('auth.back_login')}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block w-[55%] relative overflow-hidden bg-slate-900">
         <BackgroundGradientAnimation containerClassName="h-full w-full opacity-50">
             <div className="absolute inset-0 flex flex-col items-center justify-center p-16 z-10">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] max-w-lg shadow-2xl transition-all hover:scale-[1.01] duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0500e2] to-violet-600 p-0.5 shadow-lg">
                            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                                <span className="text-2xl">✨</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex gap-1 mb-1">
                                {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-4 text-yellow-400 fill-current">★</div>)}
                            </div>
                            <p className="text-white/60 text-sm font-medium">Trusted by 500+ teams</p>
                        </div>
                    </div>
                    
                    <h3 className="text-3xl font-serif font-bold text-white mb-4 leading-tight">
                        {t('auth.social_proof_quote')}
                    </h3>
                    
                    <p className="text-lg text-blue-100 leading-relaxed mb-8 font-light">
                        {t('auth.social_proof_body')}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">SJ</div>
                        <div>
                            <p className="text-white font-bold">Sarah Jenkins</p>
                            <p className="text-blue-200 text-sm">{t('auth.social_proof_role')}</p>
                        </div>
                    </div>
                </div>
             </div>
         </BackgroundGradientAnimation>
      </div>
    </div>
  );
};
