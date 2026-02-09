
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Sparkles, FileText, Download, Printer, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Check, Shield, Copy, Trash2, Edit2, Save, X } from 'lucide-react';

interface EvaluationViewProps {
  result: AnalysisResult;
  onBack: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedResult: AnalysisResult) => void;
  backLabel?: string;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ result, onBack, onDelete, onUpdate, backLabel = "Back" }) => {
  // Auto-expand criteria with low scores (< 75) to highlight issues immediately
  const [expandedCriteria, setExpandedCriteria] = useState<number[]>(() => 
    (result.criteriaResults || [])
      .map((c, i) => c.score < 75 ? i : -1)
      .filter(i => i !== -1)
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AnalysisResult>(result);

  const toggleCriterion = (index: number) => {
    setExpandedCriteria(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const handleDownloadTxt = () => {
    const content = `
RevuQA AI - Quality Assurance Report
====================================
Date: ${new Date(result.timestamp).toLocaleString()}
Agent: ${result.agentName}
Customer: ${result.customerName}
Overall Score: ${result.overallScore}/100
Sentiment: ${result.sentiment}

Executive Summary
-----------------
${result.summary}

Detailed Criteria Breakdown
---------------------------
${(result.criteriaResults || []).map(c => `
[${c.name}] - Score: ${c.score}/100
Reasoning: ${c.reasoning}
${c.suggestion ? `Suggestion: ${c.suggestion}` : ''}
`).join('\n')}

====================================
Raw Transcript
------------------------------------
${result.rawTranscript}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QA-Report-${result.agentName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTranscript = async () => {
    try {
        await navigator.clipboard.writeText(result.rawTranscript);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error("Failed to copy transcript", err);
    }
  };

  const getBadgeClass = (score: number) => {
     if (score >= 90) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
     if (score >= 75) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
     return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  };

  const handleSave = () => {
      if (onUpdate) {
          onUpdate(formData);
      }
      setIsEditing(false);
  };

  const handleCancel = () => {
      setFormData(result);
      setIsEditing(false);
  };

  const updateCriterion = (index: number, field: string, value: any) => {
      const newCriteria = [...formData.criteriaResults];
      newCriteria[index] = { ...newCriteria[index], [field]: value };
      setFormData({ ...formData, criteriaResults: newCriteria });
  };

  const bestCoachingTip = (result.criteriaResults || []).find(c => c.score < 90)?.suggestion || "Keep up the excellent performance!";

  return (
    <div className="space-y-8 md:space-y-12 pb-20 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <button 
                onClick={onBack}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#0500e2] hover:text-white dark:hover:bg-[#4b53fa] dark:hover:text-white transition-all font-bold text-sm"
            >
                ← {backLabel}
            </button>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    {onUpdate && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-300 text-sm font-bold shadow-sm transition-all hover:text-[#0500e2] dark:hover:text-[#4b53fa] hover:border-[#0500e2] dark:hover:border-[#4b53fa]"
                        >
                            <Edit2 size={16} /> Edit
                        </button>
                    )}
                    
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 text-sm font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full text-sm font-bold shadow-md transition-all hover:bg-green-700"
                            >
                                <Save size={16} /> Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                            onClick={handleDownloadTxt}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-300 text-sm font-bold shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                            <Download size={16} /> Export
                            </button>
                            <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105"
                            >
                            <Printer size={16} /> Print
                            </button>
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-full text-sm font-bold shadow-sm transition-all hover:bg-red-100 dark:hover:bg-red-900/40"
                                    title="Delete Evaluation"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </>
                    )}
            </div>
        </div>

        <div className="relative py-8 md:py-12 flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/30 rounded-[2rem] md:rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 overflow-visible">
            {/* Background Blurs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem] md:rounded-[3rem]">
                <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-[#0500e2]/5 dark:bg-[#4b53fa]/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative w-full max-w-xl px-4 md:px-6">
                {/* Floating Score Badge */}
                <div className="absolute -top-4 right-2 md:-top-6 md:-right-8 z-20 bg-white dark:bg-slate-800 p-2 md:p-3 pr-4 md:pr-5 rounded-xl md:rounded-2xl shadow-xl flex items-center gap-2 md:gap-4 border border-slate-50 dark:border-slate-700 max-w-[160px] md:max-w-none">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                        <Check size={16} strokeWidth={3} />
                    </div>
                    <div className="text-[10px] md:text-xs font-bold leading-tight text-slate-900 dark:text-white">
                        Score <span className="text-green-600 dark:text-green-400">
                            {isEditing ? formData.overallScore : result.overallScore}/100
                        </span> <br/>
                        <span className="text-slate-400 dark:text-slate-500 font-normal">Quality Grade</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 md:p-14 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none relative z-10 overflow-hidden">
                    <div className="absolute top-6 right-6 md:top-10 md:right-10">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-xl shadow-green-500/30">
                            <Check size={18} strokeWidth={3} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5 mb-8 md:mb-12">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm text-[#0500e2] dark:text-[#4b53fa] border border-slate-100 dark:border-slate-700 shrink-0">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] uppercase mb-0.5 md:mb-1">Evaluation</p>
                            <h3 className="font-serif font-bold text-lg md:text-2xl text-slate-900 dark:text-white leading-none">Agent Performance</h3>
                        </div>
                    </div>

                    <div className="space-y-8 md:space-y-10">
                        <div>
                            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 md:mb-3">Agent Name</label>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={formData.agentName}
                                    onChange={(e) => setFormData({...formData, agentName: e.target.value})}
                                    className="w-full text-2xl md:text-4xl font-serif font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 focus:border-[#0500e2] outline-none px-2 py-1 rounded-t-lg"
                                />
                            ) : (
                                <div className="text-2xl md:text-5xl font-serif font-medium text-slate-900 dark:text-white tracking-tight break-words">{result.agentName}</div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 md:gap-8 pt-6 md:pt-10 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">Score</label>
                                {isEditing ? (
                                    <input 
                                        type="number"
                                        min="0" max="100"
                                        value={formData.overallScore}
                                        onChange={(e) => setFormData({...formData, overallScore: parseInt(e.target.value) || 0})}
                                        className={`w-full text-lg md:text-2xl font-bold bg-slate-50 dark:bg-slate-800 border rounded px-2 py-1 ${formData.overallScore >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}
                                    />
                                ) : (
                                    <div className={`text-base md:text-3xl font-bold ${result.overallScore >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{result.overallScore}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">Sentiment</label>
                                {isEditing ? (
                                    <select 
                                        value={formData.sentiment}
                                        onChange={(e) => setFormData({...formData, sentiment: e.target.value as any})}
                                        className="w-full text-sm md:text-lg font-bold bg-slate-50 dark:bg-slate-800 border rounded px-2 py-2 text-slate-900 dark:text-white"
                                    >
                                        <option value="Positive">Positive</option>
                                        <option value="Neutral">Neutral</option>
                                        <option value="Negative">Negative</option>
                                    </select>
                                ) : (
                                    <div className="text-base md:text-3xl font-bold text-slate-900 dark:text-white truncate">{result.sentiment}</div>
                                )}
                            </div>
                            <div className="text-right">
                                <label className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">Date</label>
                                <div className="text-base md:text-3xl font-bold text-slate-900 dark:text-white">
                                    {new Date(result.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute -bottom-4 left-2 md:-bottom-8 md:-left-8 z-20 bg-white dark:bg-slate-800 p-3 md:p-4 pr-5 md:pr-6 rounded-xl md:rounded-2xl shadow-2xl flex items-center gap-3 md:gap-4 border border-slate-50 dark:border-slate-700 max-w-[240px] md:max-w-[320px] transition-transform hover:scale-105">
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#0500e2] text-white flex items-center justify-center font-bold text-[10px] md:text-xs shrink-0 shadow-xl">
                        AI
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-white mb-0.5 md:mb-1">Coaching Tip</p>
                        <p className="text-[9px] md:text-[11px] text-slate-500 dark:text-slate-400 leading-tight italic truncate">"{bestCoachingTip}"</p>
                    </div>
                    <ArrowRight size={12} className="text-slate-400 ml-auto shrink-0" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8">
            {/* Executive Review */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                <div className="w-40 h-40 md:w-56 md:h-56 shrink-0 relative">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="20"/>
                        <circle 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            fill="none" 
                            stroke="#0500e2" 
                            strokeWidth="20"
                            strokeDasharray={`${(isEditing ? formData.overallScore : result.overallScore) * 5.03} 503`}
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                            className="dark:stroke-[#4b53fa]"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">{isEditing ? formData.overallScore : result.overallScore}</span>
                        <span className="text-[10px] md:text-sm text-slate-400 dark:text-slate-500 font-bold tracking-widest">FINAL %</span>
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left w-full">
                    <h4 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white mb-3 md:mb-4">Executive Review</h4>
                    {isEditing ? (
                        <textarea 
                            value={formData.summary}
                            onChange={(e) => setFormData({...formData, summary: e.target.value})}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed min-h-[100px] focus:ring-2 focus:ring-[#0500e2] outline-none text-slate-600 dark:text-slate-300"
                        />
                    ) : (
                        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed italic">
                            "{result.summary}"
                        </p>
                    )}
                    <div className="flex justify-center md:justify-start gap-3 mt-6 md:mt-8">
                        <div className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Customer</span>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                                    className="text-xs md:text-base font-bold text-slate-800 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-[#0500e2] outline-none w-32"
                                />
                            ) : (
                                <span className="text-xs md:text-base font-bold text-slate-800 dark:text-white">{result.customerName}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scorecard Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 md:p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white">Scorecard Breakdown</h3>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {(isEditing ? formData.criteriaResults : result.criteriaResults || []).map((criterion, idx) => {
                        const isExpanded = expandedCriteria.includes(idx);
                        return (
                            <div key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all bg-white dark:bg-slate-900">
                                <button onClick={() => toggleCriterion(idx)} className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none">
                                    <div className="flex items-center gap-4 md:gap-8 w-full">
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${criterion.score >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-base md:text-xl text-slate-900 dark:text-white">{criterion.name}</h4>
                                            <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">Weight Impact: {idx === 0 ? 'High' : 'Standard'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 md:gap-8">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <span className="text-xs text-slate-400 font-bold uppercase">Score</span>
                                                <input 
                                                    type="number"
                                                    min="0" max="100"
                                                    value={criterion.score}
                                                    onChange={(e) => updateCriterion(idx, 'score', parseInt(e.target.value) || 0)}
                                                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-center"
                                                />
                                            </div>
                                        ) : (
                                            <div className={`px-3 md:px-6 py-1 md:py-2 rounded-full border text-sm md:text-lg font-bold ${getBadgeClass(criterion.score)}`}>
                                                {criterion.score}%
                                            </div>
                                        )}
                                        {isExpanded ? <ChevronUp size={20} className="text-slate-300 dark:text-slate-500" /> : <ChevronDown size={20} className="text-slate-300 dark:text-slate-500" />}
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-6 md:px-10 pb-6 md:pb-10 flex flex-col md:flex-row gap-6 md:gap-8">
                                        <div className="flex-1 space-y-3 md:space-y-4">
                                            <h5 className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">AI Reasoning</h5>
                                            {isEditing ? (
                                                <textarea 
                                                    value={criterion.reasoning}
                                                    onChange={(e) => updateCriterion(idx, 'reasoning', e.target.value)}
                                                    className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed min-h-[80px]"
                                                />
                                            ) : (
                                                <div className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {criterion.reasoning}
                                                </div>
                                            )}
                                        </div>
                                        {(criterion.suggestion || isEditing) && (
                                            <div className="flex-1 space-y-3 md:space-y-4">
                                                <h5 className="text-[9px] md:text-[10px] font-bold text-[#0500e2] dark:text-[#4b53fa] uppercase tracking-widest flex items-center gap-2">
                                                    <Sparkles size={12} /> Improvement Strategy
                                                </h5>
                                                {isEditing ? (
                                                    <textarea 
                                                        value={criterion.suggestion}
                                                        onChange={(e) => updateCriterion(idx, 'suggestion', e.target.value)}
                                                        className="w-full p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed min-h-[80px]"
                                                        placeholder="Add a suggestion..."
                                                    />
                                                ) : (
                                                    <div className="p-4 md:p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl md:rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-sm md:text-base text-[#0500e2] dark:text-indigo-300 font-medium leading-relaxed">
                                                        {criterion.suggestion}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Transcript Archive */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-6 md:mt-8">
                <div className="p-4 md:p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <FileText size={16} className="text-slate-400 dark:text-slate-500"/>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 text-[10px] md:text-sm uppercase tracking-widest">Transcript Archive</h3>
                    </div>
                    <button 
                        onClick={handleCopyTranscript}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0500e2] dark:hover:text-[#4b53fa] hover:border-[#0500e2] dark:hover:border-[#4b53fa] transition-all"
                    >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        {isCopied ? 'Copied' : 'Copy Text'}
                    </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs md:text-sm text-slate-500 dark:text-slate-400 font-mono p-6 md:p-10 max-h-[400px] md:max-h-[500px] overflow-y-auto leading-relaxed md:leading-loose bg-white dark:bg-slate-900">
                    {result.rawTranscript}
                </pre>
            </div>
        </div>
    </div>
  );
};
