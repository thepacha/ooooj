import React, { useState, useRef } from 'react';
import { Upload, Mic, FileText, Loader2, AlertCircle, Square, Sparkles, Check, X, ArrowRight, Zap } from 'lucide-react';
import { analyzeTranscript, generateMockTranscript, transcribeMedia } from '../services/geminiService';
import { AnalysisResult, Criteria } from '../types';
import { EvaluationView } from './EvaluationView';
import { generateId } from '../lib/utils';

interface AnalyzerProps {
  criteria: Criteria[];
  onAnalysisComplete: (result: AnalysisResult) => void;
}

type InputMode = 'text' | 'upload' | 'mic';
type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'finalizing';

const MAX_SIZE_MB = 1000; // Increased limit to 1GB for upload strategy

export const Analyzer: React.FC<AnalyzerProps> = ({ criteria, onAnalysisComplete }) => {
  const [transcript, setTranscript] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [dragActive, setDragActive] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Audio Context Refs for Visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // --- Helpers ---

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalyze = async (overrideTranscript?: string) => {
    const textToProcess = overrideTranscript || transcript;
    if (!textToProcess.trim()) return;

    setProcessingStatus('analyzing');
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeTranscript(textToProcess, criteria);
      
      setProcessingStatus('finalizing');
      
      // Artificial delay for "Finalizing" to let the user see the step change
      await new Promise(r => setTimeout(r, 800));

      const fullResult: AnalysisResult = {
        ...analysis,
        id: generateId(),
        timestamp: new Date().toISOString(),
        rawTranscript: textToProcess
      };
      
      setResult(fullResult);
      onAnalysisComplete(fullResult);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze transcript.');
      setProcessingStatus('idle');
    }
  };

  const loadDemoData = async () => {
    setProcessingStatus('analyzing'); // Show loading state briefly
    try {
        const demoText = await generateMockTranscript();
        setTranscript(demoText);
        setInputMode('text');
    } catch(e) {
        setTranscript("Error generating demo. Please try again or type manually.");
    } finally {
        setProcessingStatus('idle');
    }
  }

  // --- File Upload Logic ---

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    // Check type or extension
    const isAudioVideo = file.type.startsWith('audio/') || file.type.startsWith('video/');
    const isSupportedExtension = ['m4a', 'mp3', 'wav', 'ogg', 'aac', 'mp4', 'webm', 'mov'].includes(ext || '');

    if (isAudioVideo || isSupportedExtension) {
        handleAudioFileUpload(file);
    } else if (file.type === 'text/plain' || ext === 'txt') {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                setTranscript(e.target.result);
                setInputMode('text');
            }
        };
        reader.readAsText(file);
    } else {
        setError("Unsupported file type. Please upload audio, video, or text files.");
    }
  };

  const handleAudioFileUpload = async (file: File) => {
      // 1. Check Max Size (1GB)
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(`File is too large. Please upload files smaller than ${MAX_SIZE_MB}MB.`);
          return;
      }

      setProcessingStatus('transcribing');
      setError(null);

      try {
          // 2. Pass the RAW file directly to our new service (Upload First Strategy)
          const transcribedText = await transcribeMedia(file);
          
          setTranscript(transcribedText);
          handleAnalyze(transcribedText);
          
      } catch (err: any) {
          console.error(err);
          setError("Transcription failed: " + (err.message || "Unknown error"));
          setProcessingStatus('idle');
      }
  };

  // --- Recording Logic with Visualizer ---

  const updateVisualizer = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Pick 32 distinct points for bars
    const step = Math.floor(dataArray.length / 32);
    const simplifiedData = [];
    for (let i = 0; i < 32; i++) {
        // Normalize 0-255 to 0-1 range for styling
        const value = dataArray[i * step];
        simplifiedData.push(Math.max(0.1, value / 255));
    }
    setVisualizerData(simplifiedData);
    
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1, 
                sampleRate: 16000, 
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            } 
        });

        // 1. Setup Media Recorder
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        }

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            audioBitsPerSecond: 32000
        });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            // Convert Blob to File for the new Upload Strategy
            const audioFile = new File([audioBlob], "recording.webm", { type: mimeType });
            
            handleAudioFileUpload(audioFile);
            
            // Cleanup Audio Context
            if (sourceRef.current) sourceRef.current.disconnect();
            if (audioContextRef.current) audioContextRef.current.close();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            
            stream.getTracks().forEach(track => track.stop());
            setVisualizerData(new Array(32).fill(0)); // Reset visualizer
        };

        // 2. Setup Audio Visualizer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);
        
        updateVisualizer(); // Start loop

        // 3. Start Recording
        mediaRecorder.start(1000);
        setIsRecording(true);
        setRecordingDuration(0);
        setError(null);
        
        timerRef.current = window.setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);

    } catch (err: any) {
        console.error(err);
        setError("Microphone access denied or not available. Please check permissions.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const handleReset = () => {
    setResult(null); 
    setTranscript(''); 
    setInputMode('text');
    setProcessingStatus('idle');
  };

  // --- Views ---

  if (processingStatus !== 'idle' && !result) {
      return (
        <div className="min-h-[600px] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 space-y-8 animate-fade-in">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-[#0500e2]/10 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-[#0500e2] animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-[#0500e2] border-t-transparent animate-spin" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">
                    Processing Interaction
                </h2>
                
                <div className="space-y-3">
                    <ProcessingStep 
                        label="Uploading & Processing Audio"
                        active={processingStatus === 'transcribing'}
                        complete={processingStatus === 'analyzing' || processingStatus === 'finalizing'}
                        icon={Zap}
                    />
                    <ProcessingStep 
                        label="Transcribing & Diarization"
                        active={processingStatus === 'transcribing'}
                        complete={processingStatus === 'analyzing' || processingStatus === 'finalizing'}
                    />
                    <ProcessingStep 
                        label="Analyzing conversation"
                        active={processingStatus === 'analyzing'}
                        complete={processingStatus === 'finalizing'}
                    />
                    <ProcessingStep 
                        label="Generating insights"
                        active={processingStatus === 'finalizing'}
                        complete={false}
                    />
                </div>
                
                {processingStatus === 'transcribing' && (
                    <p className="text-xs text-center text-slate-400">Large files may take a minute to process on Google's servers.</p>
                )}
            </div>
        </div>
      );
  }

  if (result) {
      return (
        <EvaluationView 
            result={result} 
            onBack={handleReset}
            backLabel="Start New Evaluation"
        />
      );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
        {/* Header */}
        <div className="mb-8 text-center px-4">
             <div className="flex items-center justify-center gap-2 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Ready</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3">
                Intelligence Engine
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Select your input method to begin automated analysis.
            </p>
        </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Mode Selector */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex gap-1.5 sm:gap-2 bg-slate-200/50 dark:bg-slate-950 p-1.5 rounded-xl sm:rounded-2xl max-w-md mx-auto">
                {[
                    { id: 'text', icon: FileText, label: 'Transcript' },
                    { id: 'upload', icon: Upload, label: 'Upload File' },
                    { id: 'mic', icon: Mic, label: 'Live Audio' },
                ].map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setInputMode(mode.id as InputMode)}
                        className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            inputMode === mode.id
                            ? 'bg-white dark:bg-slate-800 text-[#0500e2] dark:text-white shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <mode.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="whitespace-nowrap">{mode.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="p-4 sm:p-8 md:p-10 min-h-[450px]">
            
            {/* TEXT MODE */}
            {inputMode === 'text' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative group">
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Paste conversation transcript here..."
                            className="w-full h-[400px] p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#0500e2] focus:ring-4 focus:ring-[#0500e2]/10 outline-none transition-all resize-none text-base leading-relaxed"
                        />
                        
                        {/* Empty State Action */}
                        {!transcript && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center px-4">
                                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                    <p className="text-sm sm:text-base text-slate-400 dark:text-slate-500 font-medium mb-3">No transcript yet</p>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); loadDemoData(); }}
                                        className="text-sm sm:text-base text-[#0500e2] font-bold hover:underline pointer-events-auto transition-all"
                                    >
                                        Load demo conversation
                                    </button>
                                </div>
                             </div>
                        )}
                        
                        {/* Clear Button */}
                        {transcript && (
                            <button 
                                onClick={() => setTranscript('')}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg hover:bg-red-50 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex justify-end">
                         <button
                            onClick={() => handleAnalyze()}
                            disabled={!transcript.trim()}
                            className="w-full sm:w-auto px-8 py-4 bg-[#0500e2] hover:bg-[#0400c0] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-base font-bold rounded-xl sm:rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 disabled:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            Analyze Conversation <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* UPLOAD MODE */}
            {inputMode === 'upload' && (
                <div className="h-[400px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative h-full border-3 border-dashed rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all duration-300 group ${
                            dragActive 
                            ? 'border-[#0500e2] bg-blue-50 dark:bg-[#0500e2]/10 scale-[1.02]' 
                            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                    >
                         <input 
                            type="file" 
                            accept="audio/*,video/*,text/plain,.m4a,.mp3,.wav,.mp4,.mov,.txt"
                            onChange={(e) => { if(e.target.files?.[0]) handleFileSelection(e.target.files[0]) }} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 text-slate-400 group-hover:text-[#0500e2] group-hover:scale-110 transition-all duration-300">
                            <Upload size={32} className="sm:w-10 sm:h-10" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            {dragActive ? "Drop files here" : "Drop file or tap to upload"}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm px-4">
                            Support for MP3, WAV, M4A, MP4, and TXT files.<br className="hidden sm:block"/> Max file size 1GB.
                        </p>
                    </div>
                </div>
            )}

            {/* MIC MODE */}
            {inputMode === 'mic' && (
                <div className="h-[400px] flex flex-col items-center justify-center py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     
                     {/* Audio Visualizer */}
                    <div className="flex justify-center items-end h-24 sm:h-32 gap-0.5 sm:gap-1 px-4 mb-8 sm:mb-10 w-full max-w-lg">
                        {visualizerData.map((height, i) => (
                            <div 
                                key={i} 
                                className={`w-1.5 sm:w-2 rounded-full transition-all duration-100 ease-linear ${isRecording ? 'bg-[#0500e2]' : 'bg-slate-200 dark:bg-slate-700'}`}
                                style={{ 
                                    height: `${height * 100}%`,
                                    minHeight: '4px'
                                }}
                            ></div>
                        ))}
                    </div>

                    <div className="text-4xl sm:text-6xl font-mono font-bold text-slate-900 dark:text-white mb-10 tabular-nums tracking-tight">
                        {formatDuration(recordingDuration)}
                    </div>

                    <div className="flex justify-center">
                        {isRecording ? (
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={stopRecording}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-500/30 transition-all hover:scale-105 active:scale-95 group relative"
                                >
                                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                                    <Square size={24} className="sm:w-8 sm:h-8" fill="currentColor" />
                                </button>
                                <p className="text-xs sm:text-sm font-bold text-red-500 uppercase tracking-widest animate-pulse">Recording Active</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={startRecording}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0500e2] hover:bg-[#0400c0] text-white flex items-center justify-center shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 group"
                                >
                                    <Mic size={28} className="sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                                </button>
                                <p className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tap to Record</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 mx-auto max-w-xl p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span className="font-medium text-sm">{error}</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ProcessingStep = ({ label, active, complete, icon: Icon }: { label: string; active: boolean; complete: boolean, icon?: React.ElementType }) => (
  <div className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all ${
    active ? 'bg-blue-50 dark:bg-blue-500/10' : complete ? 'bg-green-50 dark:bg-green-500/10' : 'bg-slate-50 dark:bg-slate-900'
  }`}>
    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
      active ? 'bg-[#0500e2] text-white' : complete ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
    }`}>
      {active ? (
        Icon ? <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" /> : <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
      ) : complete ? (
        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      ) : (
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
      )}
    </div>
    <span className={`text-sm sm:text-base font-medium ${active || complete ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>{label}</span>
  </div>
);
