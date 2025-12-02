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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Evaluation History</h2>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search agent or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0500e2] w-full sm:w-64 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Date</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Agent</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Customer</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Sentiment</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Score</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHistory.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          No evaluations found.
                      </td>
                  </tr>
              ) : (
                  filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString()} <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{item.agentName}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.customerName}</td>
                      <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.sentiment === 'Positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                              item.sentiment === 'Negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                              {item.sentiment}
                          </span>
                      </td>
                      <td className="p-4">
                          <span className={`font-bold ${
                              item.overallScore >= 90 ? 'text-green-600 dark:text-green-400' : item.overallScore >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                              {item.overallScore}%
                          </span>
                      </td>
                      <td className="p-4 text-right">
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa] inline-block" />
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