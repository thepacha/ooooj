
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