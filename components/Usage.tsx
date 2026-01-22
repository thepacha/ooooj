import React, { useEffect, useState } from 'react';
import { User, UsageMetrics } from '../types';
import { getUsage, COSTS } from '../lib/usageService';
import { Loader2, Zap, AlertTriangle, Check, FileText, Mic, MessageSquare } from 'lucide-react';

interface UsageProps {
  user: User | null;
}

export const Usage: React.FC<UsageProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUsage(user.id).then(data => {
        setMetrics(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading || !metrics) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0500e2]" size={32} />
      </div>
    );
  }

  const percentage = Math.min(100, Math.round((metrics.credits_used / metrics.monthly_limit) * 100));
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 75 && percentage < 90;

  const color = isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[#0500e2]';
  const strokeColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#0500e2';
  const bgColor = isCritical ? 'bg-red-50 dark:bg-red-900/10' : isWarning ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-blue-50 dark:bg-blue-900/10';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Top Banner - Usage Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
             
             {/* Circular Progress */}
             <div className="relative w-48 h-48 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={strokeColor}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={552.92}
                    strokeDashoffset={552.92 - (552.92 * percentage) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 dark:text-white">
                    <span className={`text-4xl font-bold font-serif ${color}`}>{percentage}%</span>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Used</span>
                </div>
             </div>

             <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${bgColor} ${color}`}>
                        {isCritical ? <AlertTriangle size={12} /> : <Zap size={12} />}
                        {isCritical ? 'Limit Reached' : 'Active Plan'}
                    </div>
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">
                    {metrics.credits_used.toLocaleString()} <span className="text-slate-400">/ {metrics.monthly_limit.toLocaleString()} Credits</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Resets on {new Date(metrics.reset_date).toLocaleDateString()}. usage is calculated based on analysis complexity and audio duration.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                        <FileText size={14} className="text-slate-400"/>
                        <strong>{metrics.analyses_count}</strong> Analyses
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                         <Mic size={14} className="text-slate-400"/>
                        <strong>{metrics.transcriptions_count}</strong> Audio
                    </div>
                     <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                         <MessageSquare size={14} className="text-slate-400"/>
                        <strong>{metrics.chat_messages_count}</strong> Chats
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Plan Upgrade Card */}
        <div className="bg-[#0500e2] text-white p-8 rounded-[2rem] shadow-xl shadow-blue-600/20 relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
                <h3 className="text-2xl font-serif font-bold mb-2">Pro Plan</h3>
                <p className="text-blue-100 text-sm mb-6">Unlock higher limits and advanced team features.</p>
                <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px]">✓</div>
                        50,000 Credits / mo
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px]">✓</div>
                        Priority Processing
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px]">✓</div>
                        Team Management
                    </li>
                </ul>
            </div>
            <button className="relative z-10 w-full py-3 bg-white text-[#0500e2] rounded-xl font-bold hover:bg-blue-50 transition-colors">
                Upgrade - $29/mo
            </button>
            
            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>

      {/* Cost Breakdown Info */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
         <h3 className="font-bold text-slate-900 dark:text-white mb-4">Credit Cost Breakdown</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Transcript Analysis</span>
                    <span className="font-bold text-[#0500e2]">{COSTS.ANALYSIS} Credits</span>
                </div>
                <p className="text-xs text-slate-500">Per interaction analyzed.</p>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Audio Transcription</span>
                    <span className="font-bold text-[#0500e2]">{COSTS.TRANSCRIPTION} Credits</span>
                </div>
                <p className="text-xs text-slate-500">Per file uploaded and transcribed.</p>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">AI Chat Assistant</span>
                    <span className="font-bold text-[#0500e2]">{COSTS.CHAT} Credit</span>
                </div>
                <p className="text-xs text-slate-500">Per message sent to RevuBot.</p>
             </div>
         </div>
      </div>

    </div>
  );
};
