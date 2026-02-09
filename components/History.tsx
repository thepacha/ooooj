
import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { Search, ChevronRight, Filter, X, Trash2, RefreshCcw, AlertTriangle } from 'lucide-react';

interface HistoryProps {
  history: AnalysisResult[];
  onSelectEvaluation: (result: AnalysisResult) => void;
  onDeleteEvaluation?: (id: string) => void;
  onRestoreEvaluation?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  filter?: 'all' | 'high' | 'low' | 'trash';
}

export const History: React.FC<HistoryProps> = ({ 
    history, 
    onSelectEvaluation, 
    onDeleteEvaluation, 
    onRestoreEvaluation,
    onPermanentDelete,
    filter = 'all' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'low' | 'trash'>(filter);

  // Sync internal state if prop changes
  useEffect(() => {
    setActiveFilter(filter);
  }, [filter]);

  const filteredHistory = history.filter(
    (item) => {
      const matchesSearch = (item.agentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const isTrash = item.isDeleted;

      // Trash View
      if (activeFilter === 'trash') {
          return matchesSearch && isTrash;
      }

      // Normal Views (Exclude Trash)
      if (isTrash) return false;

      let matchesFilter = true;
      if (activeFilter === 'high') {
          matchesFilter = item.overallScore >= 90;
      } else if (activeFilter === 'low') {
          matchesFilter = item.overallScore < 75;
      }

      return matchesSearch && matchesFilter;
    }
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (onDeleteEvaluation) {
          onDeleteEvaluation(id);
      }
  };

  const handleRestore = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (onRestoreEvaluation) {
          onRestoreEvaluation(id);
      }
  };

  const handlePermanent = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (onPermanentDelete) {
          onPermanentDelete(id);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {activeFilter === 'trash' ? 'Deleted Evaluations' : 'Evaluation History'}
            </h2>
            
            {/* Filter Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <button 
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setActiveFilter('high')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeFilter === 'high' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'high' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    High Scores
                </button>
                <button 
                    onClick={() => setActiveFilter('low')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeFilter === 'low' ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 hover:text-red-600'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'low' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                    Critical
                </button>
                <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 my-1"></div>
                <button 
                    onClick={() => setActiveFilter('trash')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeFilter === 'trash' ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <Trash2 size={12} /> Trash
                </button>
            </div>
        </div>

        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search agent or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0500e2] w-full md:w-64 transition-colors"
          />
        </div>
      </div>

      {/* Active Filter Banner (if not 'all') */}
      {activeFilter !== 'all' && (
          <div className={`px-4 py-3 rounded-xl border flex items-center justify-between ${
              activeFilter === 'high' 
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : activeFilter === 'low'
              ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                  {activeFilter === 'trash' ? <Trash2 size={16} /> : <Filter size={16} />}
                  {activeFilter === 'high' 
                    ? 'Showing High Performers (Score ≥ 90%)' 
                    : activeFilter === 'low' 
                        ? 'Showing Critical Reviews (Score < 75%)' 
                        : 'Viewing Deleted Items'}
              </div>
              <button 
                onClick={() => setActiveFilter('all')}
                className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
              >
                  <X size={16} />
              </button>
          </div>
      )}

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
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHistory.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-400 dark:text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                             {activeFilter === 'trash' ? <Trash2 size={24} className="opacity-50 mb-2"/> : <Filter size={24} className="opacity-50 mb-2"/>}
                             <p>{activeFilter === 'trash' ? "Trash is empty." : "No evaluations match the current filters."}</p>
                             {activeFilter !== 'all' && activeFilter !== 'trash' && (
                                 <button onClick={() => setActiveFilter('all')} className="text-[#0500e2] font-bold text-sm hover:underline">Clear Filters</button>
                             )}
                          </div>
                      </td>
                  </tr>
              ) : (
                  filteredHistory.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => activeFilter !== 'trash' && onSelectEvaluation(item)}
                    className={`transition-colors group ${activeFilter === 'trash' ? 'bg-slate-50/50 dark:bg-slate-900/50 opacity-75' : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'}`}
                  >
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString()} <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{item.agentName}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.customerName}</td>
                      <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activeFilter === 'trash' 
                                ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400' 
                                : item.sentiment === 'Positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                  item.sentiment === 'Negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                              {item.sentiment}
                          </span>
                      </td>
                      <td className="p-4">
                          <span className={`font-bold ${
                              activeFilter === 'trash' 
                                ? 'text-slate-500' 
                                : item.overallScore >= 90 ? 'text-green-600 dark:text-green-400' : item.overallScore >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                              {item.overallScore}%
                          </span>
                      </td>
                      <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {activeFilter === 'trash' ? (
                                <>
                                    <button 
                                        onClick={(e) => handleRestore(e, item.id)}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-all"
                                        title="Restore"
                                    >
                                        <RefreshCcw size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handlePermanent(e, item.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    {onDeleteEvaluation && (
                                        <button 
                                            onClick={(e) => handleDelete(e, item.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                            title="Move to Trash"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa]" />
                                </>
                            )}
                          </div>
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
