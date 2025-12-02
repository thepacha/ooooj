import React, { useState, useRef } from 'react';
import { Upload, Play, Loader2, Sparkles, AlertCircle, FileText, Download, Printer, ChevronDown, ChevronUp, CheckCircle, XCircle, Mic, FileAudio, UploadCloud, Square } from 'lucide-react';
import { analyzeTranscript, generateMockTranscript, transcribeMedia } from '../services/geminiService';
import { AnalysisResult, Criteria } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnalyzerProps {
  criteria: Criteria[];
  onAnalysisComplete: (result: AnalysisResult) => void;
}

type InputMode = 'text' | 'upload' | 'mic';

export const Analyzer: React.FC<AnalyzerProps> = ({ criteria, onAnalysisComplete }) => {
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<number[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleAnalyze = async (overrideTranscript?: string) => {
    const textToProcess = overrideTranscript || transcript;
    if (!textToProcess.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeTranscript(textToProcess, criteria);
      const fullResult: AnalysisResult = {
        ...analysis,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        rawTranscript: textToProcess
      };
      
      setResult(fullResult);
      
      // Auto-expand criteria with low scores (< 75) to highlight issues immediately
      const issuesIndices = fullResult.criteriaResults
        .map((c, i) => c.score < 75 ? i : -1)
        .filter(i => i !== -1);
      setExpandedCriteria(issuesIndices);

      onAnalysisComplete(fullResult);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze transcript.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setTranscript(event.target.result);
        setInputMode('text'); // Switch to text view to see the loaded text
      }
    };
    reader.readAsText(file);
  };

  const loadDemoData = async () => {
    setIsAnalyzing(true);
    try {
        const demoText = await generateMockTranscript();
        setTranscript(demoText);
        setInputMode('text');
    } catch(e) {
        setTranscript("Error generating demo. Please try again or type manually.");
    } finally {
        setIsAnalyzing(false);
    }
  }

  // --- Media Transcription Logic ---

  const processAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError(null);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            // Remove data url prefix (e.g. "data:audio/wav;base64,")
            const content = base64data.split(',')[1];
            
            const transcribedText = await transcribeMedia(content, mimeType);
            setTranscript(transcribedText);
            setIsTranscribing(false);
            
            // Auto-Analyze after transcription
            handleAnalyze(transcribedText);
        };
    } catch (err: any) {
        setError("Transcription failed: " + err.message);
        setIsTranscribing(false);
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processAudioBlob(file, file.type);
  };

  // --- Recording Logic ---

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            processAudioBlob(audioBlob, 'audio/webm');
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setError(null);
    } catch (err: any) {
        setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  // --- Rendering Helpers ---

  const handleDownloadTxt = () => {
    if (!result) return;
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
${result.criteriaResults.map(c => `
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

  const toggleCriterion = (index: number) => {
    setExpandedCriteria(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const getScoreColorHex = (score: number) => {
    if (score >= 90) return '#22c55e'; // green-500
    if (score >= 75) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const getScoreTextClass = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBadgeClass = (score: number) => {
     if (score >= 90) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
     if (score >= 75) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
     return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {!result ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="text-[#0500e2] dark:text-[#4b53fa]" size={20} />
              New Evaluation
            </h2>
             <button
                onClick={loadDemoData}
                disabled={isAnalyzing || isTranscribing}
                className="text-sm text-[#0500e2] dark:text-[#4b53fa] hover:text-[#4b53fa] dark:hover:text-[#636bfa] font-medium disabled:opacity-50"
              >
                Auto-fill Demo Transcript
              </button>
          </div>
          
          <div className="p-4 md:p-6 space-y-6">
            
            {/* Input Mode Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full md:w-fit">
                <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        inputMode === 'text' 
                        ? 'bg-white dark:bg-slate-700 text-[#0500e2] dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <FileText size={16} /> Text Input
                </button>
                <button
                    onClick={() => setInputMode('upload')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        inputMode === 'upload' 
                        ? 'bg-white dark:bg-slate-700 text-[#0500e2] dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <FileAudio size={16} /> Audio File
                </button>
                <button
                    onClick={() => setInputMode('mic')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        inputMode === 'mic' 
                        ? 'bg-white dark:bg-slate-700 text-[#0500e2] dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <Mic size={16} /> Live Record
                </button>
            </div>

            {/* Content Area Based on Mode */}
            <div className="min-h-[250px] flex flex-col">
                {inputMode === 'text' && (
                    <div className="space-y-2 flex-grow">
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Paste conversation transcript here or type manually..."
                            className="w-full h-64 p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all resize-none text-sm font-mono leading-relaxed"
                            disabled={isAnalyzing || isTranscribing}
                        />
                         <div className="flex justify-start">
                             <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-colors">
                                <Upload size={14} />
                                <span>Import text file (.txt)</span>
                                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                )}

                {inputMode === 'upload' && (
                    <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-10 text-center cursor-pointer relative group">
                        <input 
                            type="file" 
                            accept="audio/*,video/*" 
                            onChange={handleAudioFileUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={isTranscribing} 
                        />
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                             <UploadCloud size={32} className="text-[#0500e2] dark:text-[#4b53fa]" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Upload Audio or Video</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
                            Drag & drop files here or click to browse. Supports MP3, WAV, M4A, MP4.
                        </p>
                        {isTranscribing && (
                            <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-20 rounded-xl">
                                <Loader2 size={40} className="text-[#0500e2] animate-spin mb-4" />
                                <p className="font-medium text-slate-800 dark:text-white">Transcribing media...</p>
                                <p className="text-sm text-slate-500">This may take a moment.</p>
                            </div>
                        )}
                    </div>
                )}

                {inputMode === 'mic' && (
                    <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-10 relative">
                        {isRecording ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="text-red-500 font-bold text-xl animate-pulse flex items-center gap-2">
                                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                    Recording in progress...
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all animate-pulse-red"
                                >
                                    <Square size={32} fill="currentColor" />
                                </button>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Click stop to finish and analyze.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <button
                                    onClick={startRecording}
                                    disabled={isTranscribing}
                                    className="w-24 h-24 rounded-full bg-[#0500e2] hover:bg-[#0400c0] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Mic size={32} />
                                </button>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 text-center">Start Recording</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">Speak clearly into your microphone.</p>
                                </div>
                            </div>
                        )}
                        
                        {isTranscribing && (
                             <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-20 rounded-xl">
                                <Loader2 size={40} className="text-[#0500e2] animate-spin mb-4" />
                                <p className="font-medium text-slate-800 dark:text-white">Transcribing audio...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || isTranscribing || !transcript.trim()}
                className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-white font-medium transition-all shadow-md w-full md:w-auto ${
                  isAnalyzing || isTranscribing || (!transcript.trim() && inputMode === 'text')
                    ? 'bg-[#4b53fa] cursor-not-allowed opacity-70'
                    : 'bg-[#0500e2] hover:bg-[#0400c0] hover:shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing...
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
                    Run Analysis
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3 text-sm">
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
                <button 
                    onClick={() => { setResult(null); setTranscript(''); setInputMode('text'); }}
                    className="text-slate-500 dark:text-slate-400 hover:text-[#0500e2] dark:hover:text-[#4b53fa] flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    ← Start New Analysis
                </button>
                <div className="flex gap-2 w-full sm:w-auto">
                     <button
                        onClick={handleDownloadTxt}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
                     >
                        <Download size={16} />
                        Export TXT
                     </button>
                     <button
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                     >
                        <Printer size={16} />
                        Print / PDF
                     </button>
                </div>
            </div>

            {/* Print Header - Visible only when printing */}
            <div className="hidden print:block mb-8 border-b border-black pb-4">
                <h1 className="text-3xl font-bold text-black mb-2">RevuQA AI Analysis Report</h1>
                <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[280px] break-inside-avoid transition-colors">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0500e2] to-[#4b53fa] print:hidden"></div>
                    
                    <div className="text-center z-10 w-full">
                        <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wide mb-6">Overall Quality Score</h3>
                        
                        <div className="relative w-48 h-48 mx-auto">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[{ value: result.overallScore }, { value: 100 - result.overallScore }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                        paddingAngle={0}
                                    >
                                        <Cell fill={getScoreColorHex(result.overallScore)} />
                                        <Cell fill="#f1f5f9" className="dark:fill-slate-800" />
                                    </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-bold tracking-tight ${getScoreTextClass(result.overallScore)}`}>
                                    {result.overallScore}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-1">/ 100</span>
                            </div>
                        </div>
                        
                        <div className="mt-2 flex justify-center">
                             <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                                result.sentiment === 'Positive' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                result.sentiment === 'Negative' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                             }`}>
                                {result.sentiment === 'Positive' ? <CheckCircle size={14} /> : result.sentiment === 'Negative' ? <XCircle size={14} /> : <AlertCircle size={14} />}
                                {result.sentiment} Sentiment
                             </div>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2 break-inside-avoid flex flex-col transition-colors">
                     <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-slate-800 rounded-lg text-[#0500e2] dark:text-[#4b53fa]">
                            <FileText size={20} />
                        </div>
                        <h3 className="text-[#000000] dark:text-white font-bold text-lg">Executive Summary</h3>
                     </div>
                     <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 flex-grow">
                        {result.summary}
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-auto">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 print:border-gray-300">
                            <span className="block text-slate-400 dark:text-slate-500 text-xs uppercase mb-1 font-semibold tracking-wider">Agent Name</span>
                            <span className="font-semibold text-slate-900 dark:text-white text-lg">{result.agentName}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 print:border-gray-300">
                             <span className="block text-slate-400 dark:text-slate-500 text-xs uppercase mb-1 font-semibold tracking-wider">Customer Name</span>
                             <span className="font-semibold text-slate-900 dark:text-white text-lg">{result.customerName}</span>
                        </div>
                     </div>
                </div>
            </div>

            {/* Criteria Breakdown - Collapsible */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 print:bg-gray-50 print:border-gray-300 flex justify-between items-center break-inside-avoid">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Detailed Criteria Breakdown</h3>
                    <div className="text-xs text-slate-500 font-medium bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                        {result.criteriaResults.length} metrics evaluated
                    </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.criteriaResults.map((criterion, idx) => {
                        const isExpanded = expandedCriteria.includes(idx);
                        return (
                            <div key={idx} className="bg-white dark:bg-slate-900 transition-all duration-200 break-inside-avoid">
                                <button 
                                    onClick={() => toggleCriterion(idx)}
                                    className={`w-full flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group focus:outline-none ${isExpanded ? 'bg-slate-50/80 dark:bg-slate-800/50' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-1.5 h-10 rounded-full ${
                                            criterion.score >= 90 ? 'bg-green-500' : criterion.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{criterion.name}</h4>
                                            {!isExpanded && (
                                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 truncate max-w-xs md:max-w-md print:hidden">
                                                    Click to view detailed reasoning...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className={`px-3 py-1 rounded-lg border text-sm font-bold min-w-[60px] text-center ${getBadgeClass(criterion.score)}`}>
                                            {criterion.score}
                                        </div>
                                        <div className="print:hidden">
                                          {isExpanded ? 
                                              <ChevronUp className="text-slate-400 group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa]" size={20} /> : 
                                              <ChevronDown className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" size={20} />
                                          }
                                        </div>
                                    </div>
                                </button>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} print:max-h-none print:opacity-100 print:transition-none`}
                                >
                                    <div className="pl-9 pr-5 pb-6 pt-1 text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800 ml-1.5 border-l-0">
                                        <div className="grid gap-4">
                                            <div>
                                                <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Reasoning</h5>
                                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    {criterion.reasoning}
                                                </p>
                                            </div>
                                            {criterion.suggestion && (
                                                <div>
                                                    <h5 className="text-xs font-bold text-[#0500e2] dark:text-[#4b53fa] uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Sparkles size={12} /> Coaching Tip
                                                    </h5>
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded border border-indigo-100 dark:border-indigo-900/50 text-[#0500e2] dark:text-indigo-300 text-sm font-medium">
                                                        {criterion.suggestion}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {/* Raw Transcript - Added at bottom for reference */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden break-inside-avoid mt-8 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                    <FileText size={16} className="text-slate-400"/>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Transcript Reference</h3>
                </div>
                <div className="p-0">
                    <pre className="whitespace-pre-wrap text-xs md:text-sm text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-6 max-h-[400px] overflow-y-auto print:max-h-none print:overflow-visible">
                        {result.rawTranscript}
                    </pre>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};