
import React, { useState, useEffect, useRef } from 'react';
import { TrainingScenario } from '../types';
import { 
  Mic, 
  Play, 
  ArrowLeft, 
  Target, 
  MessageSquare, 
  User, 
  Shield, 
  TrendingUp, 
  Wrench, 
  CheckCircle2, 
  Volume2,
  StopCircle
} from 'lucide-react';

interface PreSessionBriefingProps {
  scenario: TrainingScenario;
  mode: 'text' | 'voice';
  onStart: () => void;
  onBack: () => void;
}

export const PreSessionBriefing: React.FC<PreSessionBriefingProps> = ({ scenario, mode, onStart, onBack }) => {
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState<number[]>(new Array(5).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // cleanup mic on unmount
  useEffect(() => {
    return () => stopMicTest();
  }, []);

  const toggleMicTest = async () => {
    if (isMicTesting) {
      stopMicTest();
    } else {
      await startMicTest();
    }
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 32;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setIsMicTesting(true);

      const updateMeter = () => {
        if (!analyser) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Take 5 samples spread across frequencies
        const levels = [
            dataArray[0], 
            dataArray[2], 
            dataArray[4], 
            dataArray[6], 
            dataArray[8]
        ].map(v => v / 255);
        
        setMicLevel(levels);
        rafRef.current = requestAnimationFrame(updateMeter);
      };
      
      updateMeter();
    } catch (e) {
      console.error("Mic access denied", e);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopMicTest = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
    setIsMicTesting(false);
    setMicLevel(new Array(5).fill(0));
  };

  // Content Generation based on Scenario Category
  const getObjectives = () => {
    if (scenario.category === 'Sales') {
        return [
            "Identify the customer's core pain point.",
            "Handle price/feature objections without defensiveness.",
            "Close with a clear next step or agreement."
        ];
    } else if (scenario.category === 'Technical') {
        return [
            "Verify the user's technical environment systematically.",
            "Explain the solution in simple, non-jargon terms.",
            "Confirm the solution works before ending the call."
        ];
    } else {
        return [
            "Acknowledge and validate the customer's frustration immediately.",
            "Demonstrate empathy before offering a solution.",
            "Take ownership of the problem."
        ];
    }
  };

  const getTalkTracks = () => {
    if (scenario.category === 'Sales') {
        return [
            "\"I hear your concern about price. Let's look at the ROI...\"",
            "\"What is the biggest challenge preventing you from deciding today?\""
        ];
    } else if (scenario.category === 'Technical') {
        return [
            "\"I know errors like this are frustrating. Let's trace it step-by-step.\"",
            "\"Can you walk me through exactly what happened right before the crash?\""
        ];
    } else {
        return [
            "\"I completely understand why you are upset. I would be too.\"",
            "\"Let's get this fixed for you right now. Here is what I can do...\""
        ];
    }
  };

  const Icon = scenario.icon === 'TrendingUp' ? TrendingUp : scenario.icon === 'Wrench' ? Wrench : Shield;

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                Back to Scenarios
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full font-medium">
                <span className={`w-2 h-2 rounded-full ${mode === 'voice' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></span>
                {mode === 'voice' ? 'Voice Mode Enabled' : 'Text Mode Enabled'}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Context */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Scenario Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex gap-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                                scenario.category === 'Sales' ? 'bg-green-500' : 
                                scenario.category === 'Technical' ? 'bg-slate-700' : 'bg-red-500'
                            }`}>
                                <Icon size={32} />
                            </div>
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{scenario.category}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600">•</span>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        scenario.difficulty === 'Advanced' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
                                    }`}>{scenario.difficulty}</span>
                                </div>
                                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white leading-tight">
                                    {scenario.title}
                                </h1>
                            </div>
                        </div>
                    </div>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                            {scenario.description}
                        </p>
                    </div>
                </div>

                {/* Customer Profile */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <User size={16} /> Customer Profile
                    </h3>
                    
                    <div className="flex items-center gap-6">
                        {/* Avatar Placeholder */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-white dark:from-indigo-900 dark:to-slate-800 border-4 border-white dark:border-slate-700 shadow-md flex items-center justify-center text-4xl shrink-0">
                            {scenario.title.includes('Angry') ? '😡' : scenario.title.includes('Busy') ? '⏱️' : '👤'}
                        </div>
                        
                        <div className="space-y-1">
                            <div className="text-xl font-bold text-slate-900 dark:text-white">
                                {scenario.title.split(':')[1] || 'The Customer'}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-sm">
                                {scenario.category === 'Sales' ? 'Prospect / Lead' : 'Existing Customer'}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {scenario.difficulty === 'Beginner' ? 'Patient' : scenario.difficulty === 'Intermediate' ? 'Impatient' : 'Hostile'}
                                </span>
                                <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {scenario.category} Focus
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Column: Prep & Action */}
            <div className="space-y-6">
                
                {/* Objectives */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#0500e2] mb-4 flex items-center gap-2">
                        <Target size={16} /> Session Objectives
                    </h3>
                    <ul className="space-y-3">
                        {getObjectives().map((obj, i) => (
                            <li key={i} className="flex gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                <CheckCircle2 size={18} className="text-slate-300 shrink-0 mt-0.5" />
                                {obj}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Talk Tracks */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <MessageSquare size={16} /> Suggested Openers
                    </h3>
                    <div className="space-y-3">
                        {getTalkTracks().map((track, i) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-sm italic text-slate-600 dark:text-slate-300">
                                {track}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mic Check & Start */}
                <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-6 text-white shadow-xl">
                    
                    {mode === 'voice' && (
                        <div className="mb-6 pb-6 border-b border-slate-800">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                                    <Volume2 size={14} /> Mic Check
                                </span>
                                <button 
                                    onClick={toggleMicTest}
                                    className="text-xs font-bold text-blue-300 hover:text-white transition-colors"
                                >
                                    {isMicTesting ? 'Stop Test' : 'Test Audio'}
                                </button>
                            </div>
                            
                            <div className="flex items-end justify-between h-12 gap-1 px-2">
                                {micLevel.map((level, i) => (
                                    <div 
                                        key={i} 
                                        className="w-full bg-blue-500 rounded-t-sm transition-all duration-75 ease-out"
                                        style={{ 
                                            height: `${Math.max(10, level * 100)}%`,
                                            opacity: isMicTesting ? 1 : 0.3 
                                        }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={onStart}
                        className="w-full py-4 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50 hover:shadow-blue-900/70 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                    >
                        {mode === 'voice' ? <Mic size={20} /> : <MessageSquare size={20} />}
                        Start Simulation
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-3">
                        {mode === 'voice' ? 'Headphones recommended for best experience.' : 'Text interactions consume standard credits.'}
                    </p>
                </div>

            </div>
        </div>
    </div>
  );
};
