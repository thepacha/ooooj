
import React from 'react';
import { AnalysisResult, ViewState } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Award, 
  BarChart2, 
  ArrowUpRight 
} from 'lucide-react';

interface DashboardProps {
  history: AnalysisResult[];
  setView: (view: ViewState) => void;
  onFilterSelect?: (filter: 'all' | 'high' | 'low') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, setView, onFilterSelect }) => {
  // --- Logic (Untouched) ---
  const totalEvaluations = history.length;
  const averageScore = totalEvaluations > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.overallScore, 0) / totalEvaluations) 
    : 0;
  
  const lowScores = history.filter(h => h.overallScore < 75).length;
  const highScores = history.filter(h => h.overallScore >= 90).length;

  // Reverse history for chart so it flows left to right chronologically
  const recentTrendData = [...history].reverse().slice(-10).map((h, i) => ({
    name: `Eval ${i + 1}`,
    score: h.overallScore,
    agent: h.agentName,
    date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  const agentPerformance: Record<string, { total: number, count: number }> = {};
  history.forEach(h => {
    if (!agentPerformance[h.agentName]) agentPerformance[h.agentName] = { total: 0, count: 0 };
    agentPerformance[h.agentName].total += h.overallScore;
    agentPerformance[h.agentName].count += 1;
  });

  const leaderboardData = Object.entries(agentPerformance)
    .map(([name, data]) => ({ name, avg: Math.round(data.total / data.count), count: data.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // --- Helper Functions (Requested) ---
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 75) return 'text-[#0500e2] dark:text-[#4b53fa]';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/20';
    if (score >= 75) return 'from-blue-500/20 to-blue-500/5 border-blue-200/50 dark:border-blue-500/20';
    if (score >= 60) return 'from-amber-500/20 to-amber-500/5 border-amber-200/50 dark:border-amber-500/20';
    return 'from-red-500/20 to-red-500/5 border-red-200/50 dark:border-red-500/20';
  };

  const handleCardClick = (filter: 'all' | 'high' | 'low') => {
      if (onFilterSelect) {
          onFilterSelect(filter);
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Main Score Card */}
        <div 
            onClick={() => handleCardClick('all')}
            className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br ${getScoreGradient(averageScore)} border bg-white dark:bg-slate-900 shadow-sm group hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95`}
        >
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Activity size={24} className={getScoreColor(averageScore)} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 ${getScoreColor(averageScore)}`}>
                <TrendingUp size={12} /> Live
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Quality Score</p>
              <h3 className={`text-4xl font-serif font-bold mt-1 ${getScoreColor(averageScore)}`}>
                {averageScore}<span className="text-xl align-top">%</span>
              </h3>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-current opacity-5 rounded-full blur-2xl group-hover:scale-110 transition-transform text-slate-900 dark:text-white pointer-events-none"></div>
        </div>

        {/* Total Evaluations */}
        <div 
            onClick={() => handleCardClick('all')}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-95 group"
        >
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-[#0500e2] dark:text-[#4b53fa] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                <BarChart2 size={24} />
              </div>
           </div>
           <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Evaluated</p>
              <h3 className="text-4xl font-serif font-bold mt-1 text-slate-900 dark:text-white">{totalEvaluations}</h3>
           </div>
        </div>

        {/* Top Performers */}
        <div 
            onClick={() => handleCardClick('high')}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-95 group"
        >
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                <Award size={24} />
              </div>
           </div>
           <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Performers</p>
              <h3 className="text-4xl font-serif font-bold mt-1 text-slate-900 dark:text-white">{highScores}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Score &ge; 90%</p>
           </div>
        </div>

        {/* Needs Attention */}
        <div 
            onClick={() => handleCardClick('low')}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-95 group"
        >
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
                <AlertTriangle size={24} />
              </div>
           </div>
           <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Review</p>
              <h3 className="text-4xl font-serif font-bold mt-1 text-slate-900 dark:text-white">{lowScores}</h3>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">Score &lt; 75%</p>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Quality Trend</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400">Last 10 evaluations overview</p>
            </div>
            <div className="flex gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-[#0500e2]"></div> Avg Score
                </span>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0500e2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0500e2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                />
                <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'var(--tooltip-bg)', 
                        borderRadius: '12px', 
                        border: '1px solid var(--tooltip-border)', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        color: 'var(--tooltip-text)'
                    }}
                    cursor={{ stroke: '#0500e2', strokeWidth: 1, strokeDasharray: '5 5' }}
                    labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}
                    itemStyle={{ color: 'var(--tooltip-text)' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0500e2" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#0500e2' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Top Agents</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Based on avg. performance</p>
            </div>
            <Users size={20} className="text-slate-400" />
          </div>

          <div className="flex-1 space-y-6">
            {leaderboardData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Users size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                    <p className="text-sm">No data available yet</p>
                </div>
            ) : (
                leaderboardData.map((agent, idx) => (
                    <div key={idx} className="group">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                                    idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{agent.name}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{agent.count} evaluations</p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${getScoreColor(agent.avg)}`}>{agent.avg}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                    agent.avg >= 90 ? 'bg-emerald-500' : agent.avg >= 75 ? 'bg-[#0500e2]' : 'bg-amber-500'
                                }`}
                                style={{ width: `${agent.avg}%` }}
                            ></div>
                        </div>
                    </div>
                ))
            )}
          </div>
          
          <button 
            onClick={() => setView('roster')}
            className="mt-8 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            View Full Roster <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
