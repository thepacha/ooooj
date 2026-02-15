
import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisResult, ViewState, User, UserRole } from '../types';
import { Search, ArrowUpDown, Award, TrendingUp, Users, BarChart2, Calendar, X, ChevronDown, ChevronRight, Shield, Edit2, Check } from 'lucide-react';
import { AgentProfile } from './AgentProfile';
import { supabase } from '../lib/supabase';
import { hasPermission, canManageRole, ROLES } from '../lib/permissions';

interface RosterProps {
  history: AnalysisResult[];
  setView: (view: ViewState) => void;
  onSelectEvaluation: (result: AnalysisResult) => void;
}

interface AgentStats {
  id: string; // User ID from profile
  name: string;
  role: UserRole;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof AgentStats | 'score'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('');
  const [profiles, setProfiles] = useState<Record<string, {id: string, role: UserRole}>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Role Editing State
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<UserRole>('agent');

  // State for Agent Drill-down
  const [viewingAgent, setViewingAgent] = useState<string | null>(null);

  // Load current user and profile data
  useEffect(() => {
      const loadData = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
              setCurrentUser(profile as User);
          }

          // Fetch all profiles in company (RLS will filter this automatically for Managers)
          const { data: allProfiles } = await supabase.from('profiles').select('id, name, role');
          if (allProfiles) {
              const map: Record<string, {id: string, role: UserRole}> = {};
              allProfiles.forEach(p => {
                  map[p.name] = { id: p.id, role: p.role as UserRole };
              });
              setProfiles(map);
          }
      };
      loadData();
  }, []);

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
        const start = new Date(startDate + 'T00:00:00');
        if (itemDate < start) return;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59.999');
        if (itemDate > end) return;
      }

      if (!map[h.agentName]) {
        // Try to find profile data
        const profile = profiles[h.agentName];
        
        map[h.agentName] = {
          id: profile?.id || 'unknown',
          name: h.agentName,
          role: profile?.role || 'agent',
          evaluations: 0,
          avgScore: 0,
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

    return Object.values(map).map(agent => ({
      ...agent,
      avgScore: Math.round(agent.avgScore / agent.evaluations)
    }));
  }, [history, startDate, endDate, profiles]);

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

  const handleUpdateRole = async (agentId: string) => {
      if (!currentUser || !agentId) return;
      
      try {
          const { error } = await supabase.from('profiles').update({ role: tempRole }).eq('id', agentId);
          if (error) throw error;
          
          // Update local state
          setProfiles(prev => {
              const updated = { ...prev };
              // Find the key for this ID
              const key = Object.keys(updated).find(k => updated[k].id === agentId);
              if (key) updated[key].role = tempRole;
              return updated;
          });
          setEditingRole(null);
      } catch (e) {
          console.error("Failed to update role", e);
          alert("Failed to update role. You may not have permission.");
      }
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Roster Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#0500e2] dark:text-[#4b53fa]">
                <Users size={32} />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Agents</p>
                <h3 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mt-1">{agents.length}</h3>
             </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BarChart2 size={32} />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team Average</p>
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
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top Performer</p>
                <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mt-1 truncate max-w-[180px]">
                    {topAgent ? topAgent.name : '-'}
                </h3>
                {topAgent && <p className="text-sm text-emerald-600 font-bold">{topAgent.avgScore}% Avg</p>}
             </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controls (Search, Filter) */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Team Roster</h2>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search team..."
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
                        <th className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Agent</th>
                        <th className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center" onClick={() => handleSort('evaluations')}>Evaluations <ArrowUpDown size={12} className="inline"/></th>
                        <th className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider" onClick={() => handleSort('score')}>Avg. Score <ArrowUpDown size={12} className="inline"/></th>
                        <th className="p-5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sentiment</th>
                        <th className="p-5"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAgents.length === 0 ? (
                         <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-slate-500">No agents found.</td>
                         </tr>
                    ) : (
                        filteredAgents.map((agent, idx) => {
                            const totalSentiment = agent.sentiments.Positive + agent.sentiments.Neutral + agent.sentiments.Negative;
                            const posPct = totalSentiment ? (agent.sentiments.Positive / totalSentiment) * 100 : 0;
                            const neuPct = totalSentiment ? (agent.sentiments.Neutral / totalSentiment) * 100 : 0;
                            const negPct = totalSentiment ? (agent.sentiments.Negative / totalSentiment) * 100 : 0;
                            const isEditing = editingRole === agent.id;
                            const canEdit = currentUser && canManageRole(currentUser, agent.role) && agent.id !== 'unknown';

                            return (
                                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-5 cursor-pointer" onClick={() => setViewingAgent(agent.name)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                                                {(agent.name || 'Unknown').substring(0,2).toUpperCase()}
                                            </div>
                                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-[#0500e2] transition-colors">{agent.name}</div>
                                        </div>
                                    </td>
                                    
                                    {/* Role Management Cell */}
                                    <td className="p-5">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <select 
                                                    value={tempRole}
                                                    onChange={(e) => setTempRole(e.target.value as UserRole)}
                                                    className="p-1 rounded border text-xs"
                                                >
                                                    <option value={ROLES.AGENT}>Agent</option>
                                                    <option value={ROLES.ANALYST}>Analyst</option>
                                                    <option value={ROLES.MANAGER}>Manager</option>
                                                </select>
                                                <button onClick={() => handleUpdateRole(agent.id)} className="p-1 bg-green-500 text-white rounded"><Check size={12}/></button>
                                                <button onClick={() => setEditingRole(null)} className="p-1 bg-slate-300 rounded"><X size={12}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group/role">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                                    agent.role === ROLES.MANAGER ? 'bg-purple-100 text-purple-700' :
                                                    agent.role === ROLES.ANALYST ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {agent.role}
                                                </span>
                                                {canEdit && (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingRole(agent.id);
                                                            setTempRole(agent.role);
                                                        }}
                                                        className="opacity-0 group-hover/role:opacity-100 transition-opacity text-slate-400 hover:text-[#0500e2]"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-5 text-center"><div className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold">{agent.evaluations}</div></td>
                                    
                                    <td className="p-5">
                                        <div className="w-full max-w-[140px]">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className={`text-lg font-bold ${getScoreColor(agent.avgScore)}`}>{agent.avgScore}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getScoreBg(agent.avgScore)}`} style={{ width: `${agent.avgScore}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="p-5">
                                        <div className="flex h-3 w-full max-w-[100px] rounded-full overflow-hidden">
                                            {posPct > 0 && <div className="h-full bg-emerald-500" style={{ width: `${posPct}%` }} />}
                                            {neuPct > 0 && <div className="h-full bg-slate-400" style={{ width: `${neuPct}%` }} />}
                                            {negPct > 0 && <div className="h-full bg-red-500" style={{ width: `${negPct}%` }} />}
                                        </div>
                                    </td>
                                    
                                    <td className="p-5">
                                        <ChevronRight size={18} className="text-slate-300" onClick={() => setViewingAgent(agent.name)} />
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
