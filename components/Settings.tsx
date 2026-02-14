
import React, { useState } from 'react';
import { Criteria, User } from '../types';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { generateId } from '../lib/utils';

interface SettingsProps {
  criteria: Criteria[];
  setCriteria: (c: Criteria[]) => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
}

export const Settings: React.FC<SettingsProps> = ({ criteria, setCriteria }) => {
  // Criteria State
  const [localCriteria, setLocalCriteria] = useState<Criteria[]>(criteria);
  const [isCriteriaSaved, setIsCriteriaSaved] = useState(false);

  // --- Criteria Handlers ---
  const handleWeightChange = (id: string, newWeight: number) => {
    setLocalCriteria(prev => prev.map(c => c.id === id ? { ...c, weight: newWeight } : c));
    setIsCriteriaSaved(false);
  };

  const handleDelete = (id: string) => {
    setLocalCriteria(prev => prev.filter(c => c.id !== id));
    setIsCriteriaSaved(false);
  };

  const handleSaveCriteria = () => {
    setCriteria(localCriteria);
    setIsCriteriaSaved(true);
    setTimeout(() => setIsCriteriaSaved(false), 2000);
  };

  const handleAdd = () => {
      const newId = generateId();
      setLocalCriteria([...localCriteria, { id: newId, name: 'New Criterion', description: 'Description here...', weight: 5 }]);
      setIsCriteriaSaved(false);
  }

  const handleTextChange = (id: string, field: 'name' | 'description', value: string) => {
      setLocalCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: value} : c));
      setIsCriteriaSaved(false);
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Criteria Settings Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <FileText className="text-[#0500e2]" size={20} /> QA Scorecard Configuration
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Define the criteria used by the AI to evaluate conversations.</p>
            </div>
            <button
            onClick={handleSaveCriteria}
            className="flex items-center gap-2 bg-[#0500e2] hover:bg-[#0400c0] text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
            >
            {isCriteriaSaved ? 'Saved!' : 'Save Criteria'}
            {!isCriteriaSaved && <Save size={18} />}
            </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Active Criteria</h3>
                <button onClick={handleAdd} className="text-sm flex items-center gap-1 text-[#0500e2] dark:text-[#4b53fa] font-medium hover:text-[#4b53fa]">
                    <Plus size={16} /> Add Criteria
                </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {localCriteria.map((c) => (
                <div key={c.id} className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start bg-white dark:bg-slate-900">
                <div className="flex-1 space-y-3 w-full">
                    <input 
                        type="text" 
                        value={c.name} 
                        onChange={(e) => handleTextChange(c.id, 'name', e.target.value)}
                        className="block w-full text-lg font-semibold text-slate-800 dark:text-white bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 transition-colors"
                        placeholder="Criterion Name"
                    />
                    <textarea 
                        value={c.description}
                        onChange={(e) => handleTextChange(c.id, 'description', e.target.value)}
                        className="block w-full text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 text-sm border-slate-200 dark:border-slate-700 rounded-md focus:border-[#0500e2] focus:ring-[#0500e2] min-h-[60px]"
                        placeholder="Description of what to look for..."
                    />
                </div>
                
                <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="w-32">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Weight (1-10)</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={c.weight}
                                onChange={(e) => handleWeightChange(c.id, parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0500e2]"
                            />
                            <span className="font-bold text-[#0500e2] dark:text-[#4b53fa] w-6 text-center">{c.weight}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove Criterion"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};