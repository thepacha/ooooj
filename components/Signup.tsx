import React, { useState } from 'react';
import { RevuLogo } from './RevuLogo';
import { ArrowRight, Loader2, User as UserIcon, Mail, Lock, Building2 } from 'lucide-react';
import { User } from '../types';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';
import { supabase } from '../lib/supabase';
import { DEFAULT_CRITERIA } from '../types';

interface SignupProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
  onBackToHome: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin, onBackToHome }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name, // Store in metadata as backup
                    company: company
                }
            }
        });

        if (authError) throw authError;

        // CRITICAL FIX: Only attempt DB writes if we have a session (Email verification disabled or auto-login)
        // If email verification is enabled, authData.session will be null, and writes would fail RLS.
        if (authData.session && authData.user) {
            // Create Profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                name: name,
                email: email,
                company: company || 'My Company'
            });

            if (profileError) {
                console.error("Error creating profile:", profileError);
                // Don't block signup success
            }
            
            // Insert Default Criteria
            const criteriaRecords = DEFAULT_CRITERIA.map(c => ({
                id: crypto.randomUUID(),
                user_id: authData.user!.id,
                name: c.name,
                description: c.description,
                weight: c.weight
            }));
            
            const { error: criteriaError } = await supabase.from('criteria').insert(criteriaRecords);
            if (criteriaError) {
                 console.error("Error creating default criteria:", criteriaError);
            }
        } else if (authData.user && !authData.session) {
            // Email confirmation flow
            setSuccessMessage("Account created! Please check your email to confirm your registration.");
            setIsLoading(false);
            return; 
        }

        // App.tsx will pick up the session change via onAuthStateChange if logged in
    } catch (err: any) {
        setError(err.message || 'Failed to sign up.');
        setIsLoading(false);
    }
  };

  if (successMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 font-sans p-6">
            <div className="max-w-md w-full text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-4">Check your inbox</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">{successMessage}</p>
                <button 
                    onClick={onSwitchToLogin}
                    className="px-8 py-3 bg-[#0500e2] text-white rounded-xl font-bold hover:bg-[#0400c0] transition-colors"
                >
                    Return to Login
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 relative z-10">
        <div className="mb-10">
            <button onClick={onBackToHome} className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] mb-8 hover:opacity-80 transition-opacity">
                <RevuLogo className="h-8 w-auto" />
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white pt-1">QA</span>
            </button>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3">Create your account</h1>
            <p className="text-slate-500 dark:text-slate-400">Start automating your quality assurance today.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                    <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                    />
                </div>
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
                        placeholder="john@company.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                    />
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                <div className="relative">
                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Inc."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2 mt-4"
            >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Get Started <ArrowRight size={18} /></>}
            </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 max-w-sm">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-bold text-[#0500e2] hover:underline">Log in</button>
        </p>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-slate-900">
         <BackgroundGradientAnimation containerClassName="h-full w-full opacity-60">
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-md shadow-2xl">
                    <div className="w-12 h-12 bg-[#0500e2] rounded-2xl flex items-center justify-center mb-6 text-white text-2xl font-bold mx-auto shadow-lg shadow-blue-500/50">
                        🚀
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-3">Join the future of QA.</h3>
                    <ul className="text-blue-100 text-left space-y-3 mb-6">
                        <li className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</span>
                            100% Automated Scoring
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</span>
                            Instant Coaching Tips
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</span>
                            Team Performance Dashboards
                        </li>
                    </ul>
                </div>
             </div>
         </BackgroundGradientAnimation>
      </div>
    </div>
  );
};