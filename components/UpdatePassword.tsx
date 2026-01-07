import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { RevuLogo } from './RevuLogo';

interface UpdatePasswordProps {
  onComplete: () => void;
}

export const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 animate-fade-in">
        
        <div className="flex justify-center mb-8 text-[#0500e2] dark:text-[#4b53fa]">
             <RevuLogo className="h-10 w-auto" />
        </div>

        {isSuccess ? (
             <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">Password Updated</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                    Your password has been changed successfully. You can now access your dashboard.
                </p>
                <button 
                    onClick={onComplete}
                    className="w-full py-3.5 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all"
                >
                    Continue to Dashboard
                </button>
             </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">Set New Password</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Please enter a new password for your account.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30">
                        <AlertCircle size={20} className="shrink-0" />
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Update Password'}
                </button>
            </form>
        )}
      </div>
    </div>
  );
};