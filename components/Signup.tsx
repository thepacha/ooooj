
import React, { useState } from 'react';
import { ArrowRight, Loader2, User as UserIcon, Mail, Lock, Building2, Chrome, CheckCircle, AlertTriangle, Eye, EyeOff, Check, Globe, Sparkles } from 'lucide-react';
import { User } from '../types';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';
import { supabase } from '../lib/supabase';
import { DEFAULT_CRITERIA } from '../types';
import { PublicNavigation } from './PublicNavigation';
import { useLanguage } from '../contexts/LanguageContext';
import { initiateCheckout } from '../lib/paymentService';

interface SignupProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
  onBackToHome: () => void;
  onPricing: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin, onBackToHome, onPricing }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { t, isRTL } = useLanguage();

  // Password Requirements State
  const requirements = [
      { id: 'length', label: t('auth.pwd_req.length'), met: password.length >= 12 && password.length <= 24 },
      { id: 'number', label: t('auth.pwd_req.number'), met: /\d/.test(password) },
      { id: 'symbol', label: t('auth.pwd_req.symbol'), met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
      { id: 'nospace', label: t('auth.pwd_req.nospace'), met: !/\s/.test(password) }
  ];

  const allMet = requirements.every(r => r.met);

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      // Strip protocol, www, and path to allow domain only
      val = val.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0];
      setWebsite(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate Password
    if (!allMet) {
        setError("Please ensure your password meets all security requirements.");
        return;
    }

    // Validate Company Name
    if (!company.trim()) {
        setError("Company name is required.");
        return;
    }

    // Validate Website
    if (!website.trim()) {
        setError("Company website is required.");
        return;
    }

    // Basic domain validation regex
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(website)) {
        setError("Please enter a valid website domain (e.g. acme.com).");
        return;
    }

    // Strict Email Validation (must have @ and domain extension)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        setError("Please enter a valid email address (e.g., name@company.com).");
        return;
    }

    // Validate Business Email (Public Domains Check)
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'aol.com', 'protonmail.com', 'mail.com', 'yandex.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (emailDomain && publicDomains.includes(emailDomain)) {
        setError("Please use a valid business email address (no public domains like Gmail).");
        return;
    }

    // Validate Website Matches Email Domain
    if (emailDomain && website.toLowerCase() !== emailDomain) {
        setError("Company website domain must match your work email domain.");
        return;
    }

    setIsLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: fullName,
                    company: company,
                    website: website
                }
            }
        });

        if (authError) throw authError;

        if (authData.user) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                name: fullName,
                email: email,
                company: company,
                website: website
            });

            if (profileError) console.error("Error creating profile:", profileError);
            
            const criteriaRecords = DEFAULT_CRITERIA.map(c => ({
                id: crypto.randomUUID(),
                user_id: authData.user!.id,
                name: c.name,
                description: c.description,
                weight: c.weight
            }));
            
            await supabase.from('criteria').insert(criteriaRecords);

            // FORCE PAYMENT FLOW: Redirect to Checkout Immediately
            const tempUser: User = {
                id: authData.user.id,
                name: fullName,
                email: email,
                company: company,
                website: website
            };

            // Using the specific test product ID provided
            const testProductId = 'pdt_0NYTOTkTa1HbwcEJlSGXN';
            
            try {
                // This will redirect the window location
                await initiateCheckout(testProductId, tempUser);
                // We deliberately do NOT set isLoading(false) here to prevent UI flash before redirect
            } catch (payErr: any) {
                console.error("Payment redirect failed:", payErr);
                setError("Account created, but payment initialization failed. Please login to continue.");
                setIsLoading(false);
            }

        } 
    } catch (err: any) {
        setError(err.message || 'Failed to sign up.');
        setIsLoading(false);
    }
  };

  const handleSocialSignup = () => {
      alert("Social signup integration coming soon!");
  }

  if (successMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans p-6">
            <div className="max-w-md w-full text-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <Mail size={32} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-4">{t('auth.check_email')}</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-10 text-lg leading-relaxed">{successMessage}</p>
                <button 
                    onClick={onSwitchToLogin}
                    className="w-full px-8 py-4 bg-[#0500e2] text-white rounded-xl font-bold text-lg hover:bg-[#0400c0] transition-colors shadow-lg shadow-blue-600/20"
                >
                    Return to Login
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans selection:bg-[#0500e2] selection:text-white">
      {/* Header */}
      <PublicNavigation 
        onLanding={onBackToHome}
        onLogin={onSwitchToLogin}
        onSignup={() => {}} // Already on signup
        onPricing={onPricing}
        activePage="signup"
      />

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-20 relative z-10 bg-white dark:bg-slate-950 pt-32 lg:pt-32">
        <div className="max-w-lg mx-auto w-full">
            <div className="mb-10">
                <h1 className="text-4xl lg:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{t('auth.create_account')}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t('auth.start_automating')}</p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Social Signup */}
                <button 
                    onClick={handleSocialSignup}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all mb-8 group bg-white dark:bg-slate-900 shadow-sm hover:shadow-md"
                >
                    <Chrome size={20} className="text-slate-900 dark:text-white" />
                    <span>{t('auth.sign_up_google')}</span>
                </button>

                <div className="relative flex items-center gap-4 mb-8">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t('auth.or_register_email')}</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('auth.first_name')}</label>
                            <div className="relative group">
                                <UserIcon size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                                <input 
                                    type="text" 
                                    required
                                    maxLength={12}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className="w-full ps-11 pe-4 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('auth.last_name')}</label>
                            <div className="relative group">
                                <UserIcon size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                                <input 
                                    type="text" 
                                    required
                                    maxLength={12}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="w-full ps-11 pe-4 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('auth.work_email')}</label>
                        <div className="relative group">
                            <Mail size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('auth.email_placeholder')}
                                className="w-full ps-11 pe-4 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('auth.company_name')}</label>
                            <div className="relative group">
                                <Building2 size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                                <input 
                                    type="text" 
                                    required
                                    maxLength={12}
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="Acme Inc."
                                    className="w-full ps-11 pe-4 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('auth.website')}</label>
                            <div className="relative group">
                                <Globe size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                                <input 
                                    type="text"
                                    required
                                    value={website}
                                    onChange={handleWebsiteChange}
                                    placeholder="acme.com"
                                    className="w-full ps-11 pe-4 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('auth.password_label')}</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0500e2] transition-colors" />
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                maxLength={24}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('auth.create_password_placeholder')}
                                className="w-full ps-11 pe-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 transition-all outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        
                        {/* Password Requirements Checklist - Styled better */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {requirements.map((req) => (
                                <div key={req.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-300 ${
                                    req.met 
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
                                    : 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500 border border-slate-100 dark:border-slate-800'
                                }`}>
                                    {req.met ? <Check size={10} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />}
                                    {req.label}
                                </div>
                            ))}
                        </div>
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
                        className="w-full h-14 bg-[#0500e2] text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 hover:shadow-blue-600/30 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>{t('auth.create_account_btn')} <ArrowRight size={20} className={isRTL ? "rotate-180" : ""} /></>}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('auth.have_account')}{' '}
                        <button onClick={onSwitchToLogin} className="font-bold text-[#0500e2] dark:text-[#4b53fa] hover:underline">{t('auth.login_link')}</button>
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-slate-900 border-l border-slate-800">
         <BackgroundGradientAnimation containerClassName="h-full w-full opacity-40">
             <div className="absolute inset-0 flex flex-col items-center justify-center p-20 z-10">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] max-w-lg shadow-2xl transition-all hover:scale-[1.01] duration-700">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#0500e2] to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                            <Sparkles className="text-white" size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-white">{t('auth.marketing_title')}</h3>
                            <p className="text-blue-200 text-sm">{t('auth.marketing_subtitle')}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {[
                            { title: t('auth.feature.coverage'), desc: t('auth.feature.coverage_desc') },
                            { title: t('auth.feature.coaching'), desc: t('auth.feature.coaching_desc') },
                            { title: t('auth.feature.grading'), desc: t('auth.feature.grading_desc') }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="mt-1 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 border border-green-500/20">
                                    <CheckCircle size={14} strokeWidth={3} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">{item.title}</h4>
                                    <p className="text-slate-300 text-xs mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="mt-12 flex items-center gap-3 opacity-60">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700"></div>
                        ))}
                    </div>
                    <p className="text-sm text-slate-400 font-medium">{t('auth.join_teams')}</p>
                </div>
             </div>
         </BackgroundGradientAnimation>
      </div>
    </div>
  );
};
