
import React, { useMemo } from 'react';
import { AnalysisResult } from '../types';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertCircle, 
  Smile, 
  Meh, 
  Frown, 
  Calendar,
  ChevronRight,
  Target
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

interface AgentProfileProps {
  agentName: string;
  history: AnalysisResult[];
  onBack: () => void;
  onSelectEvaluation: (result: AnalysisResult) => void;
}

export const AgentProfile: React.FC<AgentProfileProps> = ({ agentName, history, onBack, onSelectEvaluation }) => {
  const { t, isRTL } = useLanguage();
  // --- Analytics Logic ---
  const stats = useMemo(() => {
    const agentHistory = history.filter(h => h.agentName === agentName).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (agentHistory.length === 0) return null;

    const totalScore = agentHistory.reduce((acc, curr) => acc + curr.overallScore, 0);
    const avgScore = Math.round(totalScore / agentHistory.length);
    
    // Sentiment Counts
    const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
    agentHistory.forEach(h => sentiments[h.sentiment]++);

    // Criteria Strengths & Weaknesses
    const criteriaMap: Record<string, { total: number, count: number }> = {};
    agentHistory.forEach(h => {
        h.criteriaResults.forEach(c => {
            if (!criteriaMap[c.name]) criteriaMap[c.name] = { total: 0, count: 0 };
            criteriaMap[c.name].total += c.score;
            criteriaMap[c.name].count += 1;
        });
    });

    const criteriaStats = Object.entries(criteriaMap).map(([name, data]) => ({
        name,
        avg: Math.round(data.total / data.count)
    })).sort((a, b) => b.avg - a.avg); // Sort high to low

    const strengths = criteriaStats.slice(0, 3);
    const weaknesses = criteriaStats.slice().reverse().slice(0, 3); // Lowest 3

    // Trend Data (Last 10 or all)
    const trendData = agentHistory.map(h => ({
        date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.overallScore,
        id: h.id
    }));

    return {
        evaluations: agentHistory,
        count: agentHistory.length,
        avgScore,
        sentiments,
        strengths,
        weaknesses,
        trendData,
        criteriaStats
    };
  }, [agentName, history]);

  if (!stats) return <div>No data found for this agent.</div>;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 75) return 'text-[#0500e2] dark:text-[#4b53fa]';
    return 'text-amber-500';
  };

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
                {agentName}
                <span className="px-3 py-1 text-xs font-sans font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full tracking-wide uppercase">
                    {t('profile.title')}
                </span>
            </h2>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Avg Score */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target size={100} className="text-[#0500e2]" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('profile.avg_score')}</p>
            <div className={`text-5xl font-serif font-bold ${getScoreColor(stats.avgScore)}`}>
                {stats.avgScore}<span className="text-2xl">%</span>
            </div>
        </div>

        {/* Total Evaluations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award size={100} className="text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('profile.total_evaluations')}</p>
            <div className="text-5xl font-serif font-bold text-slate-900 dark:text-white">
                {stats.count}
            </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex flex-col items-center gap-2">
                <Smile size={32} className="text-emerald-500" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.sentiments.Positive || 0}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Positive</span>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center gap-2">
                <Meh size={32} className="text-amber-500" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.sentiments.Neutral || 0}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Neutral</span>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
             <div className="flex flex-col items-center gap-2">
                <Frown size={32} className="text-red-500" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.sentiments.Negative || 0}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Negative</span>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#0500e2]" />
                {t('profile.performance_trend')}
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trendData}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0500e2" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#0500e2" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            domain={[0, 100]}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#0500e2" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('profile.insights')}</h3>
            
            <div className="space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <TrendingUp size={14} /> Top Strengths
                    </h4>
                    <div className="space-y-3">
                        {stats.strengths.map((s, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{s.name}</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{s.avg}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                <div>
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertCircle size={14} /> Areas for Improvement
                    </h4>
                    <div className="space-y-3">
                        {stats.weaknesses.map((s, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{s.name}</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{s.avg}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Recent Evaluations List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('profile.recent_evaluations')}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.evaluations.slice().reverse().slice(0, 5).map((evaluation) => (
                <div 
                    key={evaluation.id} 
                    onClick={() => onSelectEvaluation(evaluation)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            evaluation.overallScore >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            evaluation.overallScore >= 75 ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                            {evaluation.overallScore}
                        </div>
                        <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                                {new Date(evaluation.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                                {evaluation.customerName || 'Unknown Customer'} • {evaluation.duration || '00:00'}
                            </div>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};