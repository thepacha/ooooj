
import React, { useState, useEffect, useRef } from 'react';
import { TrainingScenario } from '../types';
import { generateSmartOpeners } from '../services/geminiService';
import { 
  Mic, 
  ArrowLeft, 
  Target, 
  MessageSquare, 
  User, 
  Shield, 
  TrendingUp, 
  Wrench, 
  CheckCircle2, 
  Copy,
  Sparkles,
  RefreshCw,
  Loader2,
  Trophy,
  History,
  Zap,
  Heart,
  Lightbulb,
  Quote,
  Info
} from 'lucide-react';

interface PreSessionBriefingProps {
  scenario: TrainingScenario;
  mode: 'text' | 'voice';
  onStart: () => void;
  onBack: () => void;
  bestScore?: number;
  attempts: number;
}

export const PreSessionBriefing: React.FC<PreSessionBriefingProps> = ({ scenario, mode, onStart, onBack, bestScore = 0, attempts }) => {
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState<number[]>(new Array(20).fill(0.1)); // Increased bars for smoother look
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Opener State
  const [openers, setOpeners] = useState<string[]>([]);
  const [isGeneratingOpeners, setIsGeneratingOpeners] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Initialize openers
  useEffect(() => {
      if (scenario.openers && scenario.openers.length > 0) {
          setOpeners(scenario.openers);
      } else {
          setOpeners(getSmartOpeners());
      }
  }, [scenario]);

  // Cleanup mic on unmount
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
      
      analyser.fftSize = 64; 
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setIsMicTesting(true);

      const updateMeter = () => {
        if (!analyser) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Map frequency data to visualizer bars
        const levels = [];
        const step = Math.floor(dataArray.length / 20);
        for(let i=0; i<20; i++) {
            levels.push(dataArray[i * step] / 255);
        }
        
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
    setMicLevel(new Array(20).fill(0.1));
  };

  const handleCopyOpener = (text: string, index: number) => {
    navigator.clipboard.writeText(text.replace(/"/g, ''));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerateOpeners = async () => {
      setIsGeneratingOpeners(true);
      try {
          const newOpeners = await generateSmartOpeners(scenario);
          setOpeners(newOpeners);
      } catch (e) {
          console.error("Failed to generate openers", e);
      } finally {
          setIsGeneratingOpeners(false);
      }
  };

  // Helper to fallback to robust defaults if scenario lacks specific data
  const getObjectives = () => {
    if (scenario.objectives && scenario.objectives.length > 0) {
        return scenario.objectives;
    }

    if (scenario.category === 'Sales') {
        return [
            "Identify the customer's core pain point immediately.",
            "Ask at least two open-ended discovery questions.",
            "Handle price/feature objections without defensiveness.",
            "Link the product value directly to the customer's needs.",
            "Close with a clear next step or agreement."
        ];
    } else if (scenario.category === 'Technical') {
        return [
            "Verify the user's technical environment systematically.",
            "Acknowledge the user's frustration with the error.",
            "Explain the solution in simple, non-jargon terms.",
            "Guide the user through the fix step-by-step.",
            "Confirm the solution works before ending the call."
        ];
    } else {
        return [
            "Acknowledge and validate the customer's frustration immediately.",
            "Demonstrate empathy before offering a solution.",
            "Take ownership of the problem ('I can help with that').",
            "Avoid using negative language or blaming policy.",
            "Ensure the customer feels heard before moving to the fix."
        ];
    }
  };

  // Fallback generic openers if custom ones are missing
  const getSmartOpeners = () => {
    if (scenario.category === 'Sales') {
        return [
            "\"I've reviewed your company's growth, and I believe we can reduce your operational costs by 20%. Do you have 5 minutes to discuss the ROI?\"",
            "\"I understand you're evaluating options. What is the one specific feature that is a 'deal-breaker' for you today?\"",
            "\"Most clients in your industry face [Specific Pain Point]. How are you currently handling that?\"",
            "\"I see you're exploring [Competitor], and while they are great for X, many clients switch to us for Y. Is that a priority for you?\""
        ];
    } else if (scenario.category === 'Technical') {
        return [
            "\"To get you back online as fast as possible, could you please read me the exact error code on your screen?\"",
            "\"I appreciate your patience. I'm going to walk you through a diagnostic check to isolate the connectivity issue.\"",
            "\"I can see that this downtime is impacting your workflow. Let's prioritize getting the main service running first.\"",
            "\"To save us both time, have you already tried clearing your cache or restarting the service?\""
        ];
    } else {
        return [
            "\"I can hear the frustration in your voice, and I want to help. Let's take a step back so I can fully understand exactly what went wrong.\"",
            "\"You have every right to be upset about this delay. I am taking personal ownership of this ticket right now.\"",
            "\"My goal is to fix this for you in this call. To start, can you confirm the transaction ID?\"",
            "\"I want to make sure I have the full picture. Could you walk me through the timeline of events?\""
        ];
    }
  };

  const getTalkTracks = () => {
    if (scenario.talkTracks && scenario.talkTracks.length > 0) {
        return scenario.talkTracks;
    }

    if (scenario.category === 'Sales') {
        return [
            "\"What is the cost of inaction if you delay this decision?\"",
            "\"We can scale this with your team immediately.\"",
            "\"I can offer a 30-day trial to mitigate the risk.\"",
            "\"Let's focus on the value this brings to your workflow.\"",
            "\"I understand budget is a concern, let's look at the ROI.\"",
            "\"If I can solve [Pain Point], would you be ready to move forward?\""
        ];
    } else if (scenario.category === 'Technical') {
        return [
            "\"What changed in your environment before this started?\"",
            "\"Let's isolate the variable to find the root cause.\"",
            "\"Can you send me a screenshot of the error log?\"",
            "\"I'm going to consult our documentation to be precise.\"",
            "\"Let's try clearing the cache and retrying.\"",
            "\"I will stay on the line until we verify the fix.\""
        ];
    } else {
        return [
            "\"I completely understand why that would be frustrating.\"",
            "\"Thank you for your patience while I look into this.\"",
            "\"Let's get this sorted out for you right now.\"",
            "\"I apologize for the inconvenience this has caused.\"",
            "\"I am making this my top priority.\"",
            "\"Is there anything else I can do to help today?\""
        ];
    }
  };

  const Icon = scenario.icon === 'TrendingUp' ? TrendingUp : scenario.icon === 'Wrench' ? Wrench : Shield;

  // Gamification Logic
  const levelMap: Record<string, number> = { 'Beginner': 1, 'Intermediate': 3, 'Advanced': 5 };
  const baseLevel = levelMap[scenario.difficulty] || 1;
  const xpReward = baseLevel * 150;

  const objectives = getObjectives();
  const talkTracks = getTalkTracks();

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4 md:px-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold group text-sm"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                Back to Scenarios
            </button>
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Simulation Briefing
               </span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN: Main Context (Spans 2 cols) */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Hero Scenario Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex items-start gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                            scenario.category === 'Sales' ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 
                            scenario.category === 'Technical' ? 'bg-gradient-to-br from-slate-600 to-slate-800' : 
                            'bg-gradient-to-br from-red-500 to-pink-700'
                        }`}>
                            <Icon size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white leading-tight mb-2">
                                {scenario.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{scenario.category}</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-slate-500">{scenario.difficulty} Difficulty</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-slate-500">~5 mins</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                            {scenario.description}
                        </p>
                    </div>
                </div>

                {/* 2. Persona Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden group">
                    {/* Decorative Background Blob */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5 -translate-y-1/2 translate-x-1/2 ${
                        scenario.difficulty === 'Advanced' ? 'bg-red-500' : 
                        scenario.difficulty === 'Intermediate' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar Section */}
                        <div className="relative">
                            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-xl transform rotate-3 group-hover:rotate-0 transition-transform duration-300 ${
                                scenario.difficulty === 'Advanced' ? 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-slate-800 border-red-100 dark:border-red-900/50' : 
                                scenario.difficulty === 'Intermediate' ? 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-slate-800 border-amber-100 dark:border-amber-900/50' : 
                                'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-slate-800 border-emerald-100 dark:border-emerald-900/50'
                            } border`}>
                                👤
                            </div>
                            <div className={`absolute -bottom-3 -right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg ${
                                scenario.difficulty === 'Advanced' ? 'bg-red-500' : 
                                scenario.difficulty === 'Intermediate' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}>
                                {scenario.difficulty}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-center md:justify-start gap-2">
                                <User size={14} /> Customer Profile
                            </h3>
                            <div className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-3">
                                {scenario.title.split(':')[1]?.trim() || scenario.title}
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 max-w-xl">
                                This customer is <span className="font-bold text-slate-900 dark:text-slate-200">{scenario.difficulty === 'Beginner' ? 'patient' : scenario.difficulty === 'Intermediate' ? 'impatient' : 'hostile'}</span>. 
                                Their goal is to resolve a <span className="font-bold text-slate-900 dark:text-slate-200">{scenario.category}</span> issue.
                                {scenario.difficulty === 'Advanced' && <span className="text-red-500 block mt-1 font-medium"><Zap size={12} className="inline mr-1"/> Warning: May use deception or complex jargon.</span>}
                            </p>

                            {/* Quick Stats Grid */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                    <Target size={14} className="text-[#0500e2]"/> Goal: Resolve Issue
                                </div>
                                <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                    <Heart size={14} className={scenario.difficulty === 'Advanced' ? 'text-red-500' : 'text-emerald-500'}/> Mood: {scenario.difficulty === 'Advanced' ? 'Hostile' : scenario.difficulty === 'Intermediate' ? 'Impatient' : 'Calm'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Action Panel */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* 1. Stats Card */}
                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    
                    <h3 className="text-lg font-serif font-bold mb-6 relative z-10 flex items-center gap-2">
                        <Trophy size={18} className="text-yellow-400" /> Training Stats
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/10 dark:bg-slate-100 rounded-2xl p-4 backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">XP Reward</p>
                            <p className="text-2xl font-bold text-emerald-400 dark:text-emerald-600">+{xpReward}</p>
                        </div>
                        <div className="bg-white/10 dark:bg-slate-100 rounded-2xl p-4 backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Best Score</p>
                            <p className={`text-2xl font-bold ${bestScore >= 90 ? 'text-yellow-400' : 'text-white dark:text-slate-900'}`}>
                                {bestScore > 0 ? `${bestScore}%` : '-'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 text-xs opacity-60 font-medium">
                        <History size={12} />
                        <span>{attempts} previous attempt{attempts !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* 2. Start Action Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-lg ring-4 ring-slate-100 dark:ring-slate-800">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to start?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            You are entering a <strong>{mode === 'voice' ? 'Live Voice' : 'Text Chat'}</strong> simulation.
                        </p>
                    </div>

                    {/* Mic Check */}
                    {mode === 'voice' && (
                        <div className="mb-6 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Mic size={12} /> Mic Check
                                </span>
                                <button 
                                    onClick={toggleMicTest}
                                    className="text-xs font-bold text-[#0500e2] hover:underline"
                                >
                                    {isMicTesting ? 'Stop' : 'Test'}
                                </button>
                            </div>
                            <div className="flex items-end justify-between h-6 gap-0.5">
                                {micLevel.map((level, i) => (
                                    <div 
                                        key={i} 
                                        className="w-full bg-[#0500e2] rounded-full transition-all duration-75 ease-out"
                                        style={{ 
                                            height: `${Math.max(10, level * 100)}%`,
                                            opacity: isMicTesting ? 1 : 0.2 
                                        }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={onStart}
                        className="w-full py-5 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group overflow-hidden relative"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {mode === 'voice' ? 'Start Call' : 'Start Chat'} <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>
                    
                    <p className="text-[10px] text-center text-slate-400 mt-4">
                        Session recorded for QA grading.
                    </p>
                </div>

            </div>

            {/* FULL WIDTH BOTTOM: Session Strategy */}
            <div className="lg:col-span-3">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Header with Microcopy */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg shrink-0">
                            <Zap size={20} className="text-amber-500 fill-amber-500" /> Session Strategy
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Info size={13} className="text-[#0500e2]" />
                            These strategies are tailored to the customer persona to maximize your resolution success rate.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                        {/* Left: Objectives & Talk Tracks */}
                        <div className="p-6 md:p-8 flex flex-col">
                             <div className="mb-8">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                    <Target size={14} /> Mission Objectives
                                </h4>
                                <div className="space-y-4">
                                    {objectives.map((obj, i) => (
                                        <div key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#0500e2] dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                {i+1}
                                            </div>
                                            <span className="leading-relaxed font-medium">{obj}</span>
                                        </div>
                                    ))}
                                </div>
                             </div>

                             <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                             <div className="mt-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                    <Quote size={14} /> Suggested Talk Tracks
                                </h3>
                                <div className="space-y-3">
                                    {talkTracks.map((track, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleCopyOpener(track, 100 + i)}
                                            className="w-full text-left flex gap-3 items-start group hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                                        >
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0500e2] shrink-0 group-hover:scale-150 transition-transform"></div>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium group-hover:text-[#0500e2] transition-colors leading-relaxed">
                                                    "{track}"
                                                </p>
                                            </div>
                                            {copiedIndex === 100 + i && <CheckCircle2 size={14} className="text-green-500 mt-1 shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>

                        {/* Right: Openers */}
                        <div className="p-6 md:p-8 bg-slate-50/30 dark:bg-slate-900/30 h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <MessageSquare size={14} /> Smart Openers
                                </h4>
                                <button 
                                    onClick={handleRegenerateOpeners}
                                    disabled={isGeneratingOpeners}
                                    className="text-xs text-slate-400 hover:text-[#0500e2] flex items-center gap-1 transition-colors"
                                >
                                    {isGeneratingOpeners ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>} Regenerate
                                </button>
                            </div>
                            <div className="space-y-3">
                                {openers.map((track, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleCopyOpener(track, i)}
                                        className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0500e2] dark:hover:border-[#0500e2] transition-all group relative overflow-hidden flex items-start gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <Lightbulb size={16} className="text-slate-400 mt-0.5 shrink-0 group-hover:text-yellow-500 transition-colors" />
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                {track}
                                            </p>
                                        </div>
                                        <div className="text-slate-300 group-hover:text-[#0500e2] transition-colors shrink-0 self-center pl-2">
                                            {copiedIndex === i ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-4 text-center">
                                <Sparkles size={10} className="inline mr-1" /> Click any opener to copy
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
