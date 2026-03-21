
import React, { useState } from 'react';
import { AnalysisResult, ViewState } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Activity, 
  Award, 
  BarChart2, 
  ArrowUpRight,
  Filter,
  Calendar,
  Bell
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  history: AnalysisResult[];
  setView: (view: ViewState) => void;
  onFilterSelect?: (filter: 'all' | 'high' | 'low') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, setView, onFilterSelect }) => {
  const { t, isRTL } = useLanguage();
  const [timeRange, setTimeRange] = useState<'1w' | '1m' | '6m' | '1y'>('1m');

  // --- Data Processing ---
  const totalEvaluations = history.length;
  const averageScore = totalEvaluations > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.overallScore, 0) / totalEvaluations) 
    : 0;
  
  const lowScores = history.filter(h => h.overallScore < 75).length;
  const highScores = history.filter(h => h.overallScore >= 90).length;

  // Prepare data for charts
  // We'll use the history to generate "sparkline" data
  const reversedHistory = [...history].reverse();
  
  const trendData = reversedHistory.slice(-30).map((h, i) => ({
    name: i,
    score: h.overallScore,
    date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    // Mocking some secondary data for visual variety in sparklines if needed
    vol: Math.floor(Math.random() * 100) + 50 
  }));

  // Mock delta calculations (in a real app, compare vs previous period)
  const scoreDelta = "+2.4%";
  const evalDelta = "+12%";
  const highDelta = "+5%";
  const lowDelta = "-2%";

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 75) return 'text-[#0500e2] dark:text-[#4b53fa]';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const handleCardClick = (filter: 'all' | 'high' | 'low') => {
      if (onFilterSelect) {
          onFilterSelect(filter);
      }
  };

  // Custom Tooltip for the main chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{payload[0].payload.date}</p>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-[#0500e2]"></div>
            <span className="text-slate-500 dark:text-slate-400">Score:</span>
            <span className="font-bold text-[#0500e2]">{payload[0].value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* Notifications Quick Access */}
      <div className="flex justify-between items-center bg-indigo-50/40 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-[#0500e2] dark:text-[#4b53fa] shadow-sm">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Stay updated with your latest performance</p>
          </div>
        </div>
        <button 
          onClick={() => setView('notifications')}
          className="px-4 py-2 bg-[#0500e2] hover:bg-[#0400c0] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#0500e2]/20 transition-all active:scale-95"
        >
          Show all
        </button>
      </div>
      
      {/* 1. Top Wide Card - Balance Style */}
      <div 
        onClick={() => handleCardClick('all')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all hover:shadow-md group relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 relative z-10">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t('dash.avg_quality')}</h2>
                </div>
                <div>
                    <div className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                        {averageScore}%
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                        You've increased your quality by <span className="text-emerald-500 font-bold">{scoreDelta}</span> this month
                    </p>
                </div>
            </div>
            
            {/* Sparkline Area Chart */}
            <div className="h-[120px] w-full md:w-1/2 lg:w-2/3" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0500e2" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0500e2" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#0500e2" 
                            strokeWidth={3} 
                            fill="url(#colorAvg)" 
                            fillOpacity={1}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* 2. Three Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Total Evaluations */}
          <div 
            onClick={() => handleCardClick('all')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">{t('dash.total_evals')}</h3>
              <div className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{totalEvaluations}</div>
              <div className="flex items-center gap-2 text-xs font-medium mb-4">
                  <span className="text-emerald-500">{evalDelta}</span>
                  <span className="text-slate-400">vs last month</span>
              </div>
              <div className="h-16 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                          <Line type="monotone" dataKey="vol" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* High Performers */}
          <div 
            onClick={() => handleCardClick('high')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">{t('dash.high_performers')}</h3>
              <div className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{highScores}</div>
              <div className="flex items-center gap-2 text-xs font-medium mb-4">
                  <span className="text-emerald-500">{highDelta}</span>
                  <span className="text-slate-400">vs last month</span>
              </div>
              <div className="h-16 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                          <Line type="monotone" dataKey="score" stroke="#0500e2" strokeWidth={2} dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Critical Review */}
          <div 
            onClick={() => handleCardClick('low')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">{t('dash.critical_review')}</h3>
              <div className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{lowScores}</div>
              <div className="flex items-center gap-2 text-xs font-medium mb-4">
                  <span className="text-red-500">{lowDelta}</span>
                  <span className="text-slate-400">vs last month</span>
              </div>
              <div className="h-16 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                          <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* 3. Main Chart Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dash.quality_trend')}</h3>
              
              <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                      {['1w', '1m', '6m', '1y'].map((range) => (
                          <button
                              key={range}
                              onClick={() => setTimeRange(range as any)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                  timeRange === range 
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                              }`}
                          >
                              {range.toUpperCase()}
                          </button>
                      ))}
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <Filter size={14} /> Filter
                  </button>
              </div>
          </div>

          <div className="h-[350px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0500e2" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#0500e2" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                          dy={10}
                          interval="preserveStartEnd"
                      />
                      <YAxis 
                          domain={[0, 100]} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0500e2', strokeWidth: 1, strokeDasharray: '5 5' }} />
                      <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#0500e2" 
                          strokeWidth={3}
                          fill="url(#colorMain)" 
                          activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#0500e2' }}
                      />
                  </AreaChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* 4. Leaderboard (Restyled) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dash.top_agents')}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dash.based_on_avg')}</p>
              </div>
              <button 
                  onClick={() => setView('roster')}
                  className="text-sm font-bold text-[#0500e2] hover:underline flex items-center gap-1"
              >
                  {t('dash.view_roster')} <ArrowUpRight size={16} className={isRTL ? "transform scale-x-[-1]" : ""} />
              </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {leaderboardData.length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                      <Users size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                      <p className="text-sm">{t('dash.no_data')}</p>
                  </div>
              ) : (
                  leaderboardData.map((agent, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col items-center text-center hover:border-[#0500e2]/30 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm mb-3 ${
                              idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                              {idx + 1}
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate w-full">{agent.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{agent.count} evals</p>
                          <div className={`text-lg font-bold ${getScoreColor(agent.avg)}`}>{agent.avg}%</div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};
