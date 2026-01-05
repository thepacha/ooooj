import React, { useState, useRef } from 'react';
import { Upload, Play, Loader2, AlertCircle, FileText, Mic, FileAudio, UploadCloud, Square } from 'lucide-react';
import { analyzeTranscript, generateMockTranscript, transcribeMedia } from '../services/geminiService';
import { AnalysisResult, Criteria } from '../types';
import { EvaluationView } from './EvaluationView';

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

  const handleReset = () => {
    setResult(null); 
    setTranscript(''); 
    setInputMode('text');
  };

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
        <EvaluationView 
            result={result} 
            onBack={handleReset}
            backLabel="New Session"
        />
      )}
    </div>
  );
};