
import React, { useState, useMemo } from 'react';
import { AnalysisResult, ViewState } from '../types';
import { Search, ArrowUpDown, Award, TrendingUp, Users, BarChart2, Calendar, X, ChevronDown, ChevronRight } from 'lucide-react';
import { AgentProfile } from './AgentProfile';
import { useLanguage } from '../contexts/LanguageContext';

interface RosterProps {
  history: AnalysisResult[];
  setView: (view: ViewState) => void;
  onSelectEvaluation: (result: AnalysisResult) => void;
}

interface AgentStats {
  name: string;
  evaluations: number;
  avgScore: number;
  sentiments: {
    Positive: number;
    Neutral: number;
    Negative: number;
  };
  lastActive: string;
  highestScore: number;
  lowestScore: number;
}

export const Roster: React.FC<RosterProps> = ({ history, setView, onSelectEvaluation }) => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof AgentStats | 'score'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('');
  
  // State for Agent Drill-down
  const [viewingAgent, setViewingAgent] = useState<string | null>(null);

  // Extract unique agent names for the filter dropdown
  const allAgentNames = useMemo(() => {
    return Array.from(new Set(history.map(h => h.agentName))).sort();
  }, [history]);

  // Aggregation Logic
  const agents = useMemo(() => {
    const map: Record<string, AgentStats> = {};

    history.forEach((h) => {
      // Date Filter
      const itemDate = new Date(h.timestamp);
      
      if (startDate) {
        // Create local date object for start of selected day
        const start = new Date(startDate + 'T00:00:00');
        if (itemDate < start) return;
      }
      
      if (endDate) {
        // Create local date object for end of selected day
        const end = new Date(endDate + 'T23:59:59.999');
        if (itemDate > end) return;
      }

      if (!map[h.agentName]) {
        map[h.agentName] = {
          name: h.agentName,
          evaluations: 0,
          avgScore: 0, // This will be total score first, then divided
          sentiments: { Positive: 0, Neutral: 0, Negative: 0 },
          lastActive: h.timestamp,
          highestScore: 0,
          lowestScore: 100,
        };
      }

      const agent = map[h.agentName];
      agent.evaluations += 1;
      agent.avgScore += h.overallScore;
      agent.sentiments[h.sentiment] += 1;
      agent.highestScore = Math.max(agent.highestScore, h.overallScore);
      agent.lowestScore = Math.min(agent.lowestScore, h.overallScore);
      
      if (new Date(h.timestamp) > new Date(agent.lastActive)) {
        agent.lastActive = h.timestamp;
      }
    });

    // Finalize averages
    return Object.values(map).map(agent => ({
      ...agent,
      avgScore: Math.round(agent.avgScore / agent.evaluations)
    }));
  }, [history, startDate, endDate]);

  // Filtering & Sorting
  const filteredAgents = agents
    .filter(a => {
        const matchesSearch = (a.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDropdown = selectedAgentFilter ? a.name === selectedAgentFilter : true;
        return matchesSearch && matchesDropdown;
    })
    .sort((a, b) => {
      let valA: any = a[sortField === 'score' ? 'avgScore' : sortField];
      let valB: any = b[sortField === 'score' ? 'avgScore' : sortField];

      if (sortField === 'score') {
         valA = a.avgScore;
         valB = b.avgScore;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: keyof AgentStats | 'score') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 75) return 'text-[#0500e2] dark:text-[#4b53fa]';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-[#0500e2]';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Team Stats
  const teamAvg = agents.length > 0 
    ? Math.round(agents.reduce((acc, curr) => acc + curr.avgScore, 0) / agents.length)
    : 0;
  
  const topAgent = agents.length > 0 
    ? [...agents].sort((a, b) => b.avgScore - a.avgScore)[0] 
    : null;


  // --- Render Agent Profile View ---
  if (viewingAgent) {
    return (
        <AgentProfile 
            agentName={viewingAgent}
            history={history}
            onBack={() => setViewingAgent(null)}
            onSelectEvaluation={onSelectEvaluation}
        />
    );
  }

  // --- Render Roster Table View ---
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Roster Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#0500e2] dark:text-[#4b53fa]">
                <Users size={32} />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('roster.active_agents')}</p>
                <h3 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mt-1">{agents.length}</h3>
             </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BarChart2 size={32} />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('roster.team_avg')}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className={`text-4xl font-serif font-bold ${getScoreColor(teamAvg)}`}>{teamAvg}%</h3>
                </div>
             </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                <Award size={32} />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('roster.top_performer')}</p>
                <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mt-1 truncate max-w-[180px]">
                    {topAgent ? topAgent.name : '-'}
                </h3>
                {topAgent && <p className="text-sm text-emerald-600 font-bold">{topAgent.avgScore}% Avg</p>}
             </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('roster.title')}</h2>
                {(startDate || endDate) && (
                    <p className="text-xs text-slate-400 mt-1">
                        {t('roster.filter.dates')} <span className="font-medium text-slate-600 dark:text-slate-300">{startDate || 'Start'}</span> {t('roster.filter.to')} <span className="font-medium text-slate-600 dark:text-slate-300">{endDate || 'Now'}</span>
                    </p>
                )}
             </div>
             
             <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                {/* Date Filters */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none w-full sm:w-auto" 
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none w-full sm:w-auto" 
                    />
                    {(startDate || endDate) && (
                        <button onClick={clearDates} className="ml-2 text-slate-400 hover:text-red-500">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Agent Filter */}
                <div className="relative w-full sm:w-auto">
                    <select
                        value={selectedAgentFilter}
                        onChange={(e) => setSelectedAgentFilter(e.target.value)}
                        className="w-full sm:w-48 appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-[#0500e2] outline-none cursor-pointer"
                    >
                        <option value="">{t('roster.filter.all')}</option>
                        {allAgentNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('roster.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0500e2] outline-none"
                    />
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                        <th 
                            className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#0500e2] transition-colors"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center gap-2">{t('roster.table.agent')} <ArrowUpDown size={14} /></div>
                        </th>
                        <th 
                            className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#0500e2] transition-colors text-center"
                            onClick={() => handleSort('evaluations')}
                        >
                             <div className="flex items-center gap-2 justify-center">{t('roster.table.evals')} <ArrowUpDown size={14} /></div>
                        </th>
                        <th 
                            className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#0500e2] transition-colors"
                            onClick={() => handleSort('score')}
                        >
                             <div className="flex items-center gap-2">{t('roster.table.avg_score')} <ArrowUpDown size={14} /></div>
                        </th>
                        <th className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t('roster.table.sentiment')}
                        </th>
                        <th className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                            {t('roster.table.last_active')}
                        </th>
                        <th className="p-5"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAgents.length === 0 ? (
                         <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-slate-500">
                                {history.length === 0 
                                    ? "No evaluations recorded yet." 
                                    : "No agents found matching current filters."}
                            </td>
                         </tr>
                    ) : (
                        filteredAgents.map((agent, idx) => {
                            const totalSentiment = agent.sentiments.Positive + agent.sentiments.Neutral + agent.sentiments.Negative;
                            const posPct = (agent.sentiments.Positive / totalSentiment) * 100;
                            const neuPct = (agent.sentiments.Neutral / totalSentiment) * 100;
                            const negPct = (agent.sentiments.Negative / totalSentiment) * 100;

                            return (
                                <tr 
                                    key={idx} 
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    onClick={() => setViewingAgent(agent.name)}
                                >
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm border border-slate-300 dark:border-slate-600">
                                                {(agent.name || 'Unknown').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-[#0500e2] transition-colors">{agent.name}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500">{t('roster.rank')} #{idx + 1}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                                            {agent.evaluations}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="w-full max-w-[140px]">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className={`text-lg font-bold ${getScoreColor(agent.avgScore)}`}>{agent.avgScore}%</span>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                     <TrendingUp size={10} /> 
                                                     <span className="text-emerald-500">{agent.highestScore}</span> / <span className="text-red-500">{agent.lowestScore}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getScoreBg(agent.avgScore)}`} style={{ width: `${agent.avgScore}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex h-3 w-full max-w-[200px] rounded-full overflow-hidden">
                                            {posPct > 0 && <div className="h-full bg-emerald-500" style={{ width: `${posPct}%` }} title={`Positive: ${Math.round(posPct)}%`}></div>}
                                            {neuPct > 0 && <div className="h-full bg-slate-400" style={{ width: `${neuPct}%` }} title={`Neutral: ${Math.round(neuPct)}%`}></div>}
                                            {negPct > 0 && <div className="h-full bg-red-500" style={{ width: `${negPct}%` }} title={`Negative: ${Math.round(negPct)}%`}></div>}
                                        </div>
                                        <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                                             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {Math.round(posPct)}%</span>
                                             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> {Math.round(neuPct)}%</span>
                                             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {Math.round(negPct)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {new Date(agent.lastActive).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500">
                                            {new Date(agent.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <ChevronRight size={18} className={`text-slate-300 group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa] ${isRTL ? 'rotate-180' : ''}`} />
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
