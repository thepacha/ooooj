
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

interface AgentProfileProps {
  agentName: string;
  history: AnalysisResult[];
  onBack: () => void;
  onSelectEvaluation: (result: AnalysisResult) => void;
}

export const AgentProfile: React.FC<AgentProfileProps> = ({ agentName, history, onBack, onSelectEvaluation }) => {
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
                    Agent Profile
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Average Score</p>
            <div className={`text-5xl font-serif font-bold ${getScoreColor(stats.avgScore)}`}>
                {stats.avgScore}<span className="text-2xl">%</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <span className="font-bold text-slate-900 dark:text-white">{stats.count}</span> total evaluations
            </div>
        </div>

        {/* Top Strength */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Award size={20} />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top Skill</p>
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[3.5rem]">
                {stats.strengths[0]?.name || "N/A"}
             </h3>
             <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.strengths[0]?.avg || 0}%` }}></div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.strengths[0]?.avg}%</span>
             </div>
        </div>

        {/* Focus Area */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={20} />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Focus Area</p>
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[3.5rem]">
                {stats.weaknesses[0]?.name || "N/A"}
             </h3>
             <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${stats.weaknesses[0]?.avg || 0}%` }}></div>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{stats.weaknesses[0]?.avg}%</span>
             </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Customer Sentiment</p>
            <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                    <div className="mb-1 mx-auto w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center"><Smile size={18}/></div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stats.sentiments.Positive}</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                    <div className="mb-1 mx-auto w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"><Meh size={18}/></div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stats.sentiments.Neutral}</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                    <div className="mb-1 mx-auto w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center"><Frown size={18}/></div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stats.sentiments.Negative}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trend */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#0500e2]" /> Performance Trend
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScoreAgent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0500e2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0500e2" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ stroke: '#0500e2', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#0500e2" strokeWidth={3} fillOpacity={1} fill="url(#colorScoreAgent)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Skills Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Award size={20} className="text-emerald-500" /> Skill Breakdown
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={stats.criteriaStats} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                             cursor={{fill: 'transparent'}}
                             contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="avg" barSize={20} radius={[0, 4, 4, 0]}>
                            {stats.criteriaStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.avg >= 90 ? '#10b981' : entry.avg >= 75 ? '#0500e2' : '#f59e0b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Recent Evaluations List */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 px-2">Evaluation History</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="p-4 pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Summary</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sentiment</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stats.evaluations.reverse().map((evalItem) => (
                            <tr 
                                key={evalItem.id} 
                                onClick={() => onSelectEvaluation(evalItem)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                            >
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {new Date(evalItem.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 pl-6">{new Date(evalItem.timestamp).toLocaleTimeString()}</div>
                                </td>
                                <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                    {evalItem.customerName}
                                </td>
                                <td className="p-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">{evalItem.summary}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        evalItem.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        evalItem.sentiment === 'Negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {evalItem.sentiment}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`text-sm font-bold ${getScoreColor(evalItem.overallScore)}`}>
                                        {evalItem.overallScore}%
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa]" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
      </div>
    </div>
  );
};
