
import React, { useState } from 'react';
import { RevuLogo } from './RevuLogo';
import { ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { User } from '../types';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToSignup: () => void;
  onBackToHome: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Mock validation
      if (email && password) {
        if (password.length < 6) {
             setError("Password must be at least 6 characters.");
             setIsLoading(false);
             return;
        }

        // Create mock user
        const mockUser: User = {
          id: 'u_' + Math.random().toString(36).substr(2, 9),
          name: email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '), // Generate name from email
          email: email,
          company: 'Acme Corp'
        };
        
        onLogin(mockUser);
      } else {
        setError('Please fill in all fields.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 relative z-10">
        <div className="mb-12">
            <button onClick={onBackToHome} className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] mb-8 hover:opacity-80 transition-opacity">
                <RevuLogo className="h-8 w-auto" />
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white pt-1">QA</span>
            </button>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400">Please enter your details to sign in.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
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
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 max-w-sm">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} className="font-bold text-[#0500e2] hover:underline">Sign up for free</button>
        </p>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-slate-900">
         <BackgroundGradientAnimation containerClassName="h-full w-full opacity-60">
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-md shadow-2xl">
                    <div className="text-4xl mb-4">✨</div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-3">"RevuQA cut our grading time by 90%."</h3>
                    <p className="text-blue-100 italic mb-6 text-lg">
                        "The AI insights are scary accurate. My team actually looks forward to their QA scores now because the feedback is so actionable."
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
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
