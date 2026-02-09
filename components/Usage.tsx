
import React, { useEffect, useState } from 'react';
import { User, UsageMetrics, UsageHistory } from '../types';
import { getUsage, getUsageHistory, purchaseCredits, COSTS } from '../lib/usageService';
import { Loader2, Zap, AlertTriangle, FileText, Mic, MessageSquare, CreditCard, Plus, History, Calendar, Lock } from 'lucide-react';

interface UsageProps {
  user: User | null;
}

export const Usage: React.FC<UsageProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (user) {
        setLoading(true);
        try {
            const [currentUsage, historyData] = await Promise.all([
                getUsage(user.id),
                getUsageHistory(user.id)
            ]);
            setMetrics(currentUsage);
            setHistory(historyData || []);
        } catch (e) {
            console.error("Failed to load usage data", e);
        } finally {
            setLoading(false);
        }
    }
  };

  const handlePurchase = async (amount: number) => {
      if (!user) return;
      if (metrics?.suspended) {
          alert("Your account is suspended. Please contact support.");
          return;
      }
      setPurchasing(true);
      try {
          await purchaseCredits(user.id, amount);
          await loadData(); // Refresh UI
          // Optional: You could show a toast here
      } catch (e) {
          alert("Failed to purchase credits. Please try again.");
      } finally {
          setPurchasing(false);
      }
  };

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

  const currentAudioCredits = (metrics?.transcriptions_count || 0) * COSTS.TRANSCRIPTION;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Suspended Banner */}
      {metrics.suspended && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 flex items-start gap-4 animate-pulse">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                  <Lock size={24} />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1">Account Suspended</h3>
                  <p className="text-red-600 dark:text-red-300 text-sm">
                      Your access to credit consumption has been temporarily suspended by an administrator. 
                      You can still view your history, but cannot run new analyses. Please contact support for assistance.
                  </p>
              </div>
          </div>
      )}

      {/* Top Banner - Usage Gauge */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${metrics.suspended ? 'opacity-75 grayscale-[0.5]' : ''}`}>
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
                    Resets on {new Date(metrics.reset_date).toLocaleDateString()}. Usage is calculated based on analysis complexity and audio duration.
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

        {/* Top Up Card */}
        <div className="bg-[#0500e2] text-white p-8 rounded-[2rem] shadow-xl shadow-blue-600/20 relative overflow-hidden flex flex-col">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                        <CreditCard size={20} />
                    </div>
                    <h3 className="text-xl font-serif font-bold">Top Up Credits</h3>
                </div>
                <p className="text-blue-100 text-sm mb-6">Running low? Add more credits instantly to continue analyzing.</p>
                
                <div className="space-y-3">
                    <button 
                        onClick={() => handlePurchase(1000)}
                        disabled={purchasing || metrics.suspended}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="font-bold flex items-center gap-2"><Plus size={14} className="text-blue-200" /> 1,000 Credits</span>
                        <span className="font-mono bg-white/20 px-2 py-1 rounded text-xs group-hover:bg-white group-hover:text-[#0500e2] transition-colors">$5</span>
                    </button>
                    <button 
                        onClick={() => handlePurchase(5000)}
                        disabled={purchasing || metrics.suspended}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="font-bold flex items-center gap-2"><Plus size={14} className="text-blue-200" /> 5,000 Credits</span>
                        <span className="font-mono bg-white/20 px-2 py-1 rounded text-xs group-hover:bg-white group-hover:text-[#0500e2] transition-colors">$20</span>
                    </button>
                    <button 
                        onClick={() => handlePurchase(10000)}
                        disabled={purchasing || metrics.suspended}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="font-bold flex items-center gap-2"><Plus size={14} className="text-blue-200" /> 10,000 Credits</span>
                        <span className="font-mono bg-white/20 px-2 py-1 rounded text-xs group-hover:bg-white group-hover:text-[#0500e2] transition-colors">$35</span>
                    </button>
                </div>
            </div>
            
            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            
            {purchasing && (
                <div className="absolute inset-0 bg-[#0500e2]/80 backdrop-blur-sm z-20 flex items-center justify-center flex-col gap-2 animate-fade-in">
                    <Loader2 className="animate-spin text-white" size={32} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Processing...</span>
                </div>
            )}
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

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                  <History size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Billing History</h3>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <tr>
                          <th className="p-5">Period Ending</th>
                          <th className="p-5">Total Credits</th>
                          <th className="p-5">Audio Credits</th>
                          <th className="p-5">Analyses</th>
                          <th className="p-5">Transcripts</th>
                          <th className="p-5">Chat Messages</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Live Current Period Row */}
                      <tr className="bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="p-5">
                              <div className="flex items-center gap-3">
                                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                  </span>
                                  <div>
                                      <div className="font-bold text-[#0500e2] dark:text-[#4b53fa]">Current Period</div>
                                      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">Ends {new Date(metrics.reset_date).toLocaleDateString()}</div>
                                  </div>
                              </div>
                          </td>
                          <td className="p-5 font-mono font-bold text-slate-900 dark:text-white">
                              {metrics.credits_used.toLocaleString()}
                          </td>
                          <td className="p-5 font-mono text-slate-600 dark:text-slate-400">
                              {currentAudioCredits.toLocaleString()}
                          </td>
                          <td className="p-5 text-slate-600 dark:text-slate-400">
                              {metrics.analyses_count}
                          </td>
                          <td className="p-5 text-slate-600 dark:text-slate-400">
                              {metrics.transcriptions_count}
                          </td>
                          <td className="p-5 text-slate-600 dark:text-slate-400">
                              {metrics.chat_messages_count}
                          </td>
                      </tr>

                      {/* Past Periods */}
                      {(history || []).length === 0 ? (
                          <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                                  No past billing history available.
                              </td>
                          </tr>
                      ) : (
                          (history || []).map((row) => (
                              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="p-5 text-slate-900 dark:text-white font-medium">
                                      {new Date(row.period_end).toLocaleDateString()}
                                  </td>
                                  <td className="p-5 font-mono text-slate-700 dark:text-slate-300">
                                      {row.credits_used.toLocaleString()}
                                  </td>
                                  <td className="p-5 font-mono text-slate-600 dark:text-slate-400">
                                      {(row.transcriptions_count * COSTS.TRANSCRIPTION).toLocaleString()}
                                  </td>
                                  <td className="p-5 text-slate-600 dark:text-slate-400">
                                      {row.analyses_count}
                                  </td>
                                  <td className="p-5 text-slate-600 dark:text-slate-400">
                                      {row.transcriptions_count}
                                  </td>
                                  <td className="p-5 text-slate-600 dark:text-slate-400">
                                      {row.chat_messages_count}
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  );
};
