import React from 'react';
import { AnalysisResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, CheckCircle, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  history: AnalysisResult[];
}

export const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  // Compute metrics
  const totalEvaluations = history.length;
  const averageScore = totalEvaluations > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.overallScore, 0) / totalEvaluations) 
    : 0;
  
  const lowScores = history.filter(h => h.overallScore < 75).length;
  const highScores = history.filter(h => h.overallScore >= 90).length;

  const recentTrendData = history.slice(-10).map((h, i) => ({
    name: `Eval ${i + 1}`,
    score: h.overallScore,
    agent: h.agentName
  }));

  // Group by Agent for a simple leaderboard
  const agentPerformance: Record<string, { total: number, count: number }> = {};
  history.forEach(h => {
    if (!agentPerformance[h.agentName]) agentPerformance[h.agentName] = { total: 0, count: 0 };
    agentPerformance[h.agentName].total += h.overallScore;
    agentPerformance[h.agentName].count += 1;
  });

  const leaderboardData = Object.entries(agentPerformance)
    .map(([name, data]) => ({ name, avg: Math.round(data.total / data.count) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Avg Quality Score</h3>
            <div className="p-2 bg-indigo-50 rounded-lg text-[#0500e2]">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{averageScore}%</p>
          <p className="text-xs text-slate-400 mt-2">Across all evaluations</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Total Evaluations</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalEvaluations}</p>
          <p className="text-xs text-slate-400 mt-2">Lifetime analysis count</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Top Performers</h3>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{highScores}</p>
          <p className="text-xs text-slate-400 mt-2">Evaluations &ge; 90%</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Needs Attention</h3>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{lowScores}</p>
          <p className="text-xs text-slate-400 mt-2">Evaluations &lt; 75%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Quality Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#0500e2', strokeWidth: 2 }}
                />
                <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0500e2" 
                    strokeWidth={3} 
                    dot={{ fill: '#0500e2', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Agents</h3>
          <div className="space-y-4">
            {leaderboardData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-10">No data available</p>
            ) : (
                leaderboardData.map((agent, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-[#4b53fa]'
                            }`}>
                                {idx + 1}
                            </div>
                            <span className="font-medium text-slate-700">{agent.name}</span>
                        </div>
                        <span className="font-bold text-[#0500e2]">{agent.avg}%</span>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};