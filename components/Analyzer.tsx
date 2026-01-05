import React, { useState, useRef } from 'react';
import { Upload, Play, Loader2, Sparkles, AlertCircle, FileText, Download, Printer, ChevronDown, ChevronUp, CheckCircle, XCircle, Mic, FileAudio, UploadCloud, Square, Shield, ArrowRight, Check } from 'lucide-react';
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

  const getBadgeClass = (score: number) => {
     if (score >= 90) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
     if (score >= 75) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
     return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  };

  const bestCoachingTip = result?.criteriaResults.find(c => c.score < 90)?.suggestion || "Keep up the excellent performance!";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {!result ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  New Evaluation
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">Provide interaction transcript below.</p>
            </div>
             <button
                onClick={loadDemoData}
                disabled={isAnalyzing || isTranscribing}
                className="w-full md:w-auto mt-3 md:mt-0 text-sm px-5 py-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-[#0500e2] dark:text-[#4b53fa] hover:bg-slate-50 dark:hover:bg-slate-700 font-medium disabled:opacity-50 transition-colors shadow-sm"
              >
                Auto-fill Demo
              </button>
          </div>
          
          <div className="p-6 md:p-8 space-y-6 md:space-y-8">
            
            {/* Input Mode Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-fit mx-auto">
                <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 text-sm font-semibold rounded-xl transition-all ${
                        inputMode === 'text' 
                        ? 'bg-white dark:bg-slate-700 text-[#0500e2] dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <FileText size={16} /> Text
                </button>
                <button
                    onClick={() => setInputMode('upload')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 text-sm font-semibold rounded-xl transition-all ${
                        inputMode === 'upload' 
                        ? 'bg-white dark:bg-slate-700 text-[#0500e2] dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <FileAudio size={16} /> Upload
                </button>
                <button
                    onClick={() => setInputMode('mic')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 text-sm font-semibold rounded-xl transition-all ${
                        inputMode === 'mic' 
                        ? 'bg-white dark:bg-slate-700 text-[#0500e2] dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <Mic size={16} /> Record
                </button>
            </div>

            {/* Content Area Based on Mode */}
            <div className="min-h-[250px] md:min-h-[300px] flex flex-col">
                {inputMode === 'text' && (
                    <div className="space-y-4 flex-grow">
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Paste your customer interaction here..."
                            className="w-full h-64 md:h-72 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0500e2] focus:border-[#0500e2] transition-all resize-none text-sm md:text-base leading-relaxed"
                            disabled={isAnalyzing || isTranscribing}
                        />
                         <div className="flex justify-start">
                             <label className="flex items-center gap-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-colors">
                                <Upload size={14} />
                                <span>Import .txt file</span>
                                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                )}

                {inputMode === 'upload' && (
                    <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all p-6 md:p-12 text-center cursor-pointer relative group">
                        <input 
                            type="file" 
                            accept="audio/*,video/*" 
                            onChange={handleAudioFileUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={isTranscribing} 
                        />
                        <div className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2rem] shadow-md mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500">
                             <UploadCloud size={32} className="text-[#0500e2] dark:text-[#4b53fa]" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-1 md:mb-2">Drop media files</h3>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4 md:mb-6">
                            Support for MP3, WAV, MP4 up to 50MB.
                        </p>
                        {isTranscribing && (
                            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center z-20 rounded-3xl">
                                <Loader2 size={40} className="text-[#0500e2] animate-spin mb-4" />
                                <p className="font-bold text-lg md:text-xl text-slate-900 dark:text-white">Transcribing...</p>
                            </div>
                        )}
                    </div>
                )}

                {inputMode === 'mic' && (
                    <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 relative">
                        {isRecording ? (
                            <div className="flex flex-col items-center gap-6 md:gap-8">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                                    <span className="text-red-500 font-bold text-xl md:text-2xl">Recording...</span>
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-all"
                                >
                                    <Square size={36} fill="currentColor" />
                                </button>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">Capture live feedback</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 md:gap-8">
                                <button
                                    onClick={startRecording}
                                    disabled={isTranscribing}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#0500e2] hover:bg-[#0400c0] text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    <Mic size={36} />
                                </button>
                                <div className="text-center">
                                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Ready to listen</h3>
                                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2">Speak clearly into your mic.</p>
                                </div>
                            </div>
                        )}
                        
                        {isTranscribing && (
                             <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center z-20 rounded-3xl">
                                <Loader2 size={40} className="text-[#0500e2] animate-spin mb-4" />
                                <p className="font-bold text-lg md:text-xl text-slate-900 dark:text-white">Processing...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || isTranscribing || !transcript.trim()}
                className="flex items-center justify-center gap-2 px-8 md:px-12 py-4 md:py-5 rounded-2xl bg-[#0500e2] text-white text-base md:text-lg font-bold shadow-xl hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 w-full md:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing...
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
                    Start Evaluation
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="p-4 md:p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3 md:gap-4 text-sm md:text-base font-medium">
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-12 pb-20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                    onClick={() => { setResult(null); setTranscript(''); setInputMode('text'); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#0500e2] hover:text-white dark:hover:bg-[#4b53fa] dark:hover:text-white transition-all font-bold text-sm"
                >
                    ← New Session
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                     <button
                        onClick={handleDownloadTxt}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-200 text-sm font-bold shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                     >
                        <Download size={16} /> Export
                     </button>
                     <button
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105"
                     >
                        <Printer size={16} /> Print
                     </button>
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
                            Score <span className="text-green-600 dark:text-green-400">{result.overallScore}/100</span> <br/>
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
                                <div className="text-2xl md:text-5xl font-serif font-medium text-slate-900 dark:text-white tracking-tight break-words">{result.agentName}</div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 md:gap-8 pt-6 md:pt-10 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">Score</label>
                                    <div className={`text-base md:text-3xl font-bold ${result.overallScore >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{result.overallScore}</div>
                                </div>
                                <div>
                                    <label className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">Sentiment</label>
                                    <div className="text-base md:text-3xl font-bold text-slate-900 dark:text-white truncate">{result.sentiment}</div>
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
                                strokeDasharray={`${result.overallScore * 5.03} 503`}
                                strokeLinecap="round"
                                transform="rotate(-90 100 100)"
                                className="dark:stroke-[#4b53fa]"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">{result.overallScore}</span>
                            <span className="text-[10px] md:text-sm text-slate-400 dark:text-slate-500 font-bold tracking-widest">FINAL %</span>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white mb-3 md:mb-4">Executive Review</h4>
                        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed italic">
                            "{result.summary}"
                        </p>
                        <div className="flex justify-center md:justify-start gap-3 mt-6 md:mt-8">
                            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Customer</span>
                                <span className="text-xs md:text-base font-bold text-slate-800 dark:text-white">{result.customerName}</span>
                            </div>
                            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Complexity</span>
                                <span className="text-xs md:text-base font-bold text-slate-800 dark:text-white">High</span>
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
                        {result.criteriaResults.map((criterion, idx) => {
                            const isExpanded = expandedCriteria.includes(idx);
                            return (
                                <div key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all bg-white dark:bg-slate-900">
                                    <button onClick={() => toggleCriterion(idx)} className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none">
                                        <div className="flex items-center gap-4 md:gap-8">
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${criterion.score >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <h4 className="font-bold text-base md:text-xl text-slate-900 dark:text-white">{criterion.name}</h4>
                                                <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">Weight Impact: {idx === 0 ? 'High' : 'Standard'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-8">
                                            <div className={`px-3 md:px-6 py-1 md:py-2 rounded-full border text-sm md:text-lg font-bold ${getBadgeClass(criterion.score)}`}>
                                                {criterion.score}%
                                            </div>
                                            {isExpanded ? <ChevronUp size={20} className="text-slate-300 dark:text-slate-500" /> : <ChevronDown size={20} className="text-slate-300 dark:text-slate-500" />}
                                        </div>
                                    </button>
                                    {isExpanded && (
                                        <div className="px-6 md:px-10 pb-6 md:pb-10 flex flex-col md:flex-row gap-6 md:gap-8">
                                            <div className="flex-1 space-y-3 md:space-y-4">
                                                <h5 className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">AI Reasoning</h5>
                                                <div className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {criterion.reasoning}
                                                </div>
                                            </div>
                                            {criterion.suggestion && (
                                                <div className="flex-1 space-y-3 md:space-y-4">
                                                    <h5 className="text-[9px] md:text-[10px] font-bold text-[#0500e2] dark:text-[#4b53fa] uppercase tracking-widest flex items-center gap-2">
                                                        <Sparkles size={12} /> Improvement Strategy
                                                    </h5>
                                                    <div className="p-4 md:p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl md:rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-sm md:text-base text-[#0500e2] dark:text-indigo-300 font-medium leading-relaxed">
                                                        {criterion.suggestion}
                                                    </div>
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
                    <div className="p-4 md:p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 md:gap-3">
                        <FileText size={16} className="text-slate-400 dark:text-slate-500"/>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 text-[10px] md:text-sm uppercase tracking-widest">Transcript Archive</h3>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs md:text-sm text-slate-500 dark:text-slate-400 font-mono p-6 md:p-10 max-h-[400px] md:max-h-[500px] overflow-y-auto leading-relaxed md:leading-loose bg-white dark:bg-slate-900">
                        {result.rawTranscript}
                    </pre>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};