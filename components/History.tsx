import React from 'react';
import { AnalysisResult } from '../types';
import { Search, ChevronRight } from 'lucide-react';

interface HistoryProps {
  history: AnalysisResult[];
}

export const History: React.FC<HistoryProps> = ({ history }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredHistory = history.filter(
    (item) =>
      item.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Evaluation History</h2>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search agent or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0500e2] w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600">Date</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Agent</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Customer</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Sentiment</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Score</th>
                <th className="p-4 font-semibold text-sm text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                          No evaluations found.
                      </td>
                  </tr>
              ) : (
                  filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="p-4 text-sm text-slate-600">
                      {new Date(item.timestamp).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{item.agentName}</td>
                      <td className="p-4 text-sm text-slate-600">{item.customerName}</td>
                      <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                              item.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                          }`}>
                              {item.sentiment}
                          </span>
                      </td>
                      <td className="p-4">
                          <span className={`font-bold ${
                              item.overallScore >= 90 ? 'text-green-600' : item.overallScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                              {item.overallScore}%
                          </span>
                      </td>
                      <td className="p-4 text-right">
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-[#0500e2] inline-block" />
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