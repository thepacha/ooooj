import React, { useState, useRef, useEffect } from 'react';
import { TrainingScenario, TrainingResult, User, AnalysisResult, CriteriaResult } from '../types';
import { createTrainingSession, evaluateTrainingSession, connectLiveTraining, generateAIScenario } from '../services/geminiService';
import { Shield, TrendingUp, Wrench, Play, ArrowRight, MessageCircle, RefreshCw, CheckCircle, Loader2, Send, StopCircle, Award, Mic, Phone, PhoneOff, BarChart2, MessageSquare, FileText, Copy, Check, Plus, Sparkles, X, ChevronRight, Calendar, Trash2 } from 'lucide-react';
import { incrementUsage, COSTS, checkLimit } from '../lib/usageService';
import { Blob } from "@google/genai";
import { generateId } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface TrainingProps {
    user: User | null;
    history: AnalysisResult[];
    onAnalysisComplete: (result: AnalysisResult) => void;
}

const STATIC_SCENARIOS: TrainingScenario[] = [
    {
        id: '1',
        title: 'The Angry Refund',
        description: 'A customer is furious that their subscription renewed automatically. De-escalate and explain the policy while retaining them.',
        difficulty: 'Intermediate',
        category: 'Support',
        icon: 'Shield',
        initialMessage: "I can't believe you charged me again! I haven't used this stupid tool in months. I want my money back NOW!",
        systemInstruction: "You are an angry customer named 'Marcus'. You just saw a charge on your card for $99. You haven't logged in for 3 months. You are demanding a refund and threatening to post on social media. You are impatient. If the agent is calm and offers a partial refund or extension, calm down. If they quote policy robotically, get angrier."
    },
    {
        id: '2',
        title: 'The Upsell Opportunity',
        description: 'A customer is on the free plan and hitting limits. Pitch the value of the Pro plan without being pushy.',
        difficulty: 'Beginner',
        category: 'Sales',
        icon: 'TrendingUp',
        initialMessage: "Hi, I keep getting this error message about limits? I'm just trying to export my report.",
        systemInstruction: "You are a user named 'Sarah'. You enjoy the tool but hit the free export limit. You are cost-conscious but open to upgrading if the value is clear. You need the report for a meeting in an hour. Ask about price. If the agent explains the time-saving benefits, agree to upgrade."
    },
    {
        id: '3',
        title: 'Technical Troubleshoot',
        description: 'A user cannot login and is getting frustrated. Walk them through basic troubleshooting steps patiently.',
        difficulty: 'Advanced',
        category: 'Technical',
        icon: 'Wrench',
        initialMessage: "Your app is broken. I click login and nothing happens. I've cleared cache already, don't ask me to do that.",
        systemInstruction: "You are a tech-savvy user named 'Alex'. You are annoyed because you've already tried basic steps (cache, cookies). The real issue is you are using a VPN that blocks the auth script. Do not reveal this immediately. Let the agent ask questions. If they ask about network/VPN, admit it. Be curt but cooperative if the agent respects your technical knowledge."
    }
];

// --- Audio Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const Training: React.FC<TrainingProps> = ({ user, history, onAnalysisComplete }) => {
    const [view, setView] = useState<'list' | 'active' | 'result' | 'create'>('list');
    const [activeTab, setActiveTab] = useState<'scenarios' | 'history'>('scenarios');
    const [activeScenario, setActiveScenario] = useState<TrainingScenario | null>(null);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<TrainingResult | null>(null);
    const [mode, setMode] = useState<'text' | 'voice'>('text');
    const [isCopied, setIsCopied] = useState(false);
    const [customScenarios, setCustomScenarios] = useState<TrainingScenario[]>([]);
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

    // Creation State
    const [creationType, setCreationType] = useState<'manual' | 'ai'>('ai');
    const [aiParams, setAiParams] = useState({ topic: '', difficulty: 'Intermediate', category: 'Support' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [manualParams, setManualParams] = useState<Partial<TrainingScenario>>({ difficulty: 'Intermediate', category: 'Support' });
    
    // Chat Refs
    const chatSession = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice Refs
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const nextStartTime = useRef<number>(0);
    const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    // Live Transcription State Buffers
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    // Fetch custom scenarios from Supabase
    useEffect(() => {
        if (!user) return;

        const fetchScenarios = async () => {
            setIsLoadingScenarios(true);
            try {
                const { data, error } = await supabase
                    .from('scenarios')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const mapped: TrainingScenario[] = data.map(s => ({
                        id: s.id,
                        title: s.title,
                        description: s.description || '',
                        difficulty: s.difficulty as any,
                        category: s.category as any,
                        icon: s.icon as any,
                        initialMessage: s.initial_message,
                        systemInstruction: s.system_instruction
                    }));
                    setCustomScenarios(mapped);
                }
            } catch (e) {
                console.error("Error loading scenarios:", e);
            } finally {
                setIsLoadingScenarios(false);
            }
        };

        fetchScenarios();
    }, [user]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, view]);

    // Cleanup on unmount or view change
    useEffect(() => {
        return () => {
            stopVoiceSession();
        }
    }, []);

    const allScenarios = [...customScenarios, ...STATIC_SCENARIOS]; // Put custom first
    const trainingHistory = history.filter(h => h.customerName.startsWith('Roleplay:') || h.summary.startsWith('Training Session'));

    const startSession = async (scenario: TrainingScenario, sessionMode: 'text' | 'voice') => {
        if (user) {
             const canProceed = await checkLimit(user.id, COSTS.CHAT * 5); // Est cost
             if (!canProceed) {
                 alert("Insufficient credits for training session.");
                 return;
             }
        }

        setActiveScenario(scenario);
        setMode(sessionMode);
        setMessages([{ role: 'model', text: scenario.initialMessage }]); // Visual seed
        setResult(null);
        setView('active');

        if (sessionMode === 'text') {
            try {
                chatSession.current = createTrainingSession(scenario);
            } catch (e) {
                console.error(e);
                alert("Failed to start session. Check API Key.");
                return;
            }
        } else {
            // Voice mode starts immediately
            startVoiceConnection(scenario);
        }
    };

    const startVoiceConnection = async (scenario: TrainingScenario) => {
        setIsVoiceActive(true);
        // Reset buffers
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';
        nextStartTime.current = 0;

        try {
            // Init Audio Contexts
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1, 
                    sampleRate: 16000,
                    echoCancellation: true, 
                    noiseSuppression: true 
                } 
            });

            const sessionPromise = connectLiveTraining(scenario, {
                onOpen: () => {
                    console.log("Voice Session Open");
                    // Stream Mic
                    if (!inputAudioContext.current) return;
                    
                    const source = inputAudioContext.current.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.current.destination);
                },
                onMessage: async (message) => {
                    // Handle Transcription
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                    } else if (message.serverContent?.inputTranscription) {
                        currentInputTranscription.current += message.serverContent.inputTranscription.text;
                    }

                    if (message.serverContent?.turnComplete) {
                        const userText = currentInputTranscription.current;
                        const modelText = currentOutputTranscription.current;
                        
                        if (userText) setMessages(prev => [...prev, {role: 'user', text: userText}]);
                        if (modelText) setMessages(prev => [...prev, {role: 'model', text: modelText}]);

                        currentInputTranscription.current = '';
                        currentOutputTranscription.current = '';
                    }

                    // Handle Audio Playback
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContext.current) {
                        const ctx = outputAudioContext.current;
                        nextStartTime.current = Math.max(nextStartTime.current, ctx.currentTime);
                        
                        try {
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                ctx,
                                24000,
                                1
                            );
                            
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            
                            source.addEventListener('ended', () => {
                                sources.current.delete(source);
                            });
                            
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            sources.current.add(source);
                        } catch (e) {
                            console.error("Audio decode error", e);
                        }
                    }
                },
                onError: (e) => {
                    console.error("Voice Error", e);
                    setMessages(prev => [...prev, {role: 'model', text: "[Voice Error] Connection interrupted."}]);
                    setIsVoiceActive(false);
                },
                onClose: () => {
                    console.log("Voice Session Closed");
                    setIsVoiceActive(false);
                }
            });
            
            chatSession.current = sessionPromise; // Store promise to close later if needed

        } catch (e) {
            console.error("Voice setup failed", e);
            alert("Could not start voice session. Check microphone permissions.");
            setIsVoiceActive(false);
        }
    };

    const stopVoiceSession = () => {
        setIsVoiceActive(false);
        if (inputAudioContext.current) inputAudioContext.current.close();
        if (outputAudioContext.current) outputAudioContext.current.close();
        // We can't explicitly "close" the session promise object easily without the session object itself stored differently, 
        // but closing audio contexts stops the flow.
        // If we stored the session object:
        if (chatSession.current && typeof chatSession.current.then === 'function') {
             chatSession.current.then((session: any) => session.close());
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !chatSession.current || mode === 'voice') return;
        
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsProcessing(true);

        try {
            const response = await chatSession.current.sendMessage({ message: userMsg });
            setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'model', text: "[Connection Error] Please try again." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const endSession = async () => {
        if (!activeScenario) return;
        
        if (mode === 'voice') {
            stopVoiceSession();
        }
        
        setIsProcessing(true);
        // Compile transcript
        const transcript = messages.map(m => `${m.role === 'user' ? 'Agent' : 'Customer'}: ${m.text}`).join('\n');
        
        try {
            const evalResult = await evaluateTrainingSession(transcript, activeScenario);
            setResult(evalResult);
            
            // --- Save to History ---
            // Construct CriteriaResults from training feedback to fit the data model
            const simulatedCriteria: CriteriaResult[] = [
                ...evalResult.strengths.map(s => ({
                    name: 'Strength',
                    score: 95,
                    reasoning: s,
                    suggestion: ''
                })),
                ...evalResult.improvements.map(i => ({
                    name: 'Improvement Area',
                    score: 65,
                    reasoning: i,
                    suggestion: 'Review training material.'
                }))
            ];

            const trainingAnalysis: AnalysisResult = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                agentName: user?.name || 'Trainee',
                customerName: `Roleplay: ${activeScenario.title}`,
                summary: `Training Session (${activeScenario.difficulty}): ${evalResult.feedback}`,
                overallScore: evalResult.score,
                sentiment: evalResult.sentiment || 'Neutral',
                criteriaResults: simulatedCriteria,
                rawTranscript: transcript
            };

            onAnalysisComplete(trainingAnalysis);
            
            if (user) {
                await incrementUsage(user.id, COSTS.ANALYSIS, 'analysis'); // Count as analysis
            }
            setView('result');
        } catch (e) {
            console.error(e);
            alert("Failed to evaluate session.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateScenario = async () => {
        if (!aiParams.topic) return;
        setIsGenerating(true);
        try {
            const generated = await generateAIScenario(aiParams.topic, aiParams.category as any, aiParams.difficulty);
            const newScenario: TrainingScenario = {
                ...generated,
                id: generateId(),
                icon: 'Shield', // Default icon for generated ones
            };

            // Save to DB if user is logged in
            if (user) {
                const { error } = await supabase.from('scenarios').insert({
                    id: newScenario.id,
                    user_id: user.id,
                    title: newScenario.title,
                    description: newScenario.description,
                    difficulty: newScenario.difficulty,
                    category: newScenario.category,
                    icon: newScenario.icon,
                    initial_message: newScenario.initialMessage,
                    system_instruction: newScenario.systemInstruction
                });
                if (error) console.error("Error saving scenario", error);
            }

            setCustomScenarios(prev => [newScenario, ...prev]); // Add to top
            setView('list');
        } catch (e) {
            console.error(e);
            alert("Failed to generate scenario. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateManual = async () => {
        if (!manualParams.title || !manualParams.initialMessage || !manualParams.systemInstruction) {
            alert("Please fill in all required fields.");
            return;
        }
        const newScenario: TrainingScenario = {
            id: generateId(),
            title: manualParams.title!,
            description: manualParams.description || '',
            difficulty: (manualParams.difficulty as any) || 'Intermediate',
            category: (manualParams.category as any) || 'Support',
            icon: 'Shield',
            initialMessage: manualParams.initialMessage!,
            systemInstruction: manualParams.systemInstruction!
        };

        // Save to DB if user is logged in
        if (user) {
            const { error } = await supabase.from('scenarios').insert({
                id: newScenario.id,
                user_id: user.id,
                title: newScenario.title,
                description: newScenario.description,
                difficulty: newScenario.difficulty,
                category: newScenario.category,
                icon: newScenario.icon,
                initial_message: newScenario.initialMessage,
                system_instruction: newScenario.systemInstruction
            });
            if (error) console.error("Error saving scenario", error);
        }

        setCustomScenarios(prev => [newScenario, ...prev]);
        setView('list');
    }

    const handleDeleteScenario = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (!window.confirm("Delete this scenario?")) return;

        // Optimistic update
        setCustomScenarios(prev => prev.filter(s => s.id !== id));

        const { error } = await supabase.from('scenarios').delete().eq('id', id);
        if (error) {
            console.error("Error deleting scenario", error);
            // Could revert state here if strict consistency needed
        }
    };

    const handleCopyTranscript = async () => {
        const transcript = messages.map(m => `${m.role === 'user' ? 'Agent' : 'Customer'}: ${m.text}`).join('\n');
        try {
            await navigator.clipboard.writeText(transcript);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy transcript", err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // --- VIEW: Scenario List & History ---
    if (view === 'list') {
        return (
            <div className="space-y-8 animate-fade-in pb-12">
                 <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-lg">
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl font-serif font-bold mb-4">AI Training Companion</h2>
                        <p className="text-indigo-100 text-lg mb-8">
                            Practice real-world support and sales scenarios with our AI personas. 
                            Get instant feedback on your tone, empathy, and problem-solving skills.
                        </p>
                        <button 
                            onClick={() => setView('create')}
                            className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                        >
                            <Plus size={18} /> Create New Scenario
                        </button>
                    </div>
                    {/* Decor */}
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                        <Shield size={400} />
                    </div>
                 </div>

                 {/* Navigation Tabs */}
                 <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setActiveTab('scenarios')}
                        className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'scenarios' ? 'text-[#0500e2] border-[#0500e2]' : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
                    >
                        Active Scenarios
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'text-[#0500e2] border-[#0500e2]' : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
                    >
                        Training History
                    </button>
                 </div>

                 {activeTab === 'scenarios' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Loading State */}
                        {isLoadingScenarios && (
                            <div className="col-span-full py-12 flex justify-center text-slate-400">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        )}

                        {!isLoadingScenarios && allScenarios.map((scenario) => {
                            const Icon = scenario.icon === 'TrendingUp' ? TrendingUp : scenario.icon === 'Wrench' ? Wrench : Shield;
                            const isCustom = customScenarios.some(s => s.id === scenario.id);

                            return (
                                <div key={scenario.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative">
                                    {/* Delete Button for Custom Scenarios */}
                                    {isCustom && (
                                        <button 
                                            onClick={(e) => handleDeleteScenario(scenario.id, e)}
                                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Scenario"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                            scenario.category === 'Sales' ? 'bg-green-500 shadow-green-500/20' : 
                                            scenario.category === 'Technical' ? 'bg-slate-700 shadow-slate-700/20' : 
                                            'bg-red-500 shadow-red-500/20'
                                        }`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                                                scenario.category === 'Sales' ? 'bg-green-50 text-green-600 border-green-100' :
                                                scenario.category === 'Technical' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                                                'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {scenario.category}
                                            </span>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                                                scenario.difficulty === 'Beginner' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                scenario.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-purple-50 text-purple-600 border-purple-100'
                                            }`}>
                                                {scenario.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#0500e2] transition-colors line-clamp-1">{scenario.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
                                        {scenario.description}
                                    </p>
                                    
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => startSession(scenario, 'text')}
                                            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                        >
                                            <MessageSquare size={16} /> Text Chat
                                        </button>
                                        <button 
                                            onClick={() => startSession(scenario, 'voice')}
                                            className="w-full py-3 rounded-xl bg-[#0500e2] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0400c0] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                                        >
                                            <Phone size={16} /> Voice Call
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                     </div>
                 ) : (
                     <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        {trainingHistory.length === 0 ? (
                            <div className="p-12 text-center">
                                <Shield size={48} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Training History</h3>
                                <p className="text-slate-500 dark:text-slate-400">Complete a scenario to see your results here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="p-4 pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Scenario</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Feedback</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {trainingHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {new Date(item.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">
                                                    {item.customerName.replace('Roleplay: ', '')}
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">{item.summary}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                        item.overallScore >= 80 ? 'bg-green-100 text-green-700' :
                                                        item.overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {item.overallScore}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                     </div>
                 )}
            </div>
        );
    }

    // --- VIEW: Create Scenario ---
    if (view === 'create') {
        return (
            <div className="max-w-2xl mx-auto pb-12 animate-fade-in">
                <button onClick={() => setView('list')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold">
                    <ArrowRight size={20} className="rotate-180" /> Back to List
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">Create New Scenario</h2>
                        <p className="text-slate-500 dark:text-slate-400">Design a custom training roleplay manually or let AI generate one for you.</p>
                    </div>
                    
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 flex">
                        <button 
                            onClick={() => setCreationType('ai')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${creationType === 'ai' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#0500e2] dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            <Sparkles size={16} /> AI Generator
                        </button>
                        <button 
                            onClick={() => setCreationType('manual')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${creationType === 'manual' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#0500e2] dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            <Wrench size={16} /> Manual Builder
                        </button>
                    </div>

                    <div className="p-8 md:p-10">
                        {creationType === 'ai' ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">What skills do you want to practice?</label>
                                    <textarea 
                                        value={aiParams.topic}
                                        onChange={(e) => setAiParams({...aiParams, topic: e.target.value})}
                                        placeholder="e.g. A customer wants to cancel their account because it's too expensive, but I want to retain them."
                                        className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                        <select 
                                            value={aiParams.difficulty}
                                            onChange={(e) => setAiParams({...aiParams, difficulty: e.target.value})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                        <select 
                                            value={aiParams.category}
                                            onChange={(e) => setAiParams({...aiParams, category: e.target.value})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none"
                                        >
                                            <option value="Sales">Sales</option>
                                            <option value="Support">Support</option>
                                            <option value="Technical">Technical</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleGenerateScenario}
                                    disabled={!aiParams.topic || isGenerating}
                                    className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-[#0400c0] disabled:opacity-70 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                    {isGenerating ? 'Generating Scenario...' : 'Generate Scenario'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Scenario Title</label>
                                    <input 
                                        type="text"
                                        value={manualParams.title || ''}
                                        onChange={(e) => setManualParams({...manualParams, title: e.target.value})}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none"
                                        placeholder="e.g. Handling a Pricing Objection"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                        <select 
                                            value={manualParams.category}
                                            onChange={(e) => setManualParams({...manualParams, category: e.target.value as any})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none"
                                        >
                                            <option value="Sales">Sales</option>
                                            <option value="Support">Support</option>
                                            <option value="Technical">Technical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                        <select 
                                            value={manualParams.difficulty}
                                            onChange={(e) => setManualParams({...manualParams, difficulty: e.target.value as any})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                    <textarea 
                                        value={manualParams.description || ''}
                                        onChange={(e) => setManualParams({...manualParams, description: e.target.value})}
                                        className="w-full h-20 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none resize-none"
                                        placeholder="Brief context for the agent..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Initial Customer Message</label>
                                    <input 
                                        type="text"
                                        value={manualParams.initialMessage || ''}
                                        onChange={(e) => setManualParams({...manualParams, initialMessage: e.target.value})}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none"
                                        placeholder="The first thing the customer says..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">AI System Prompt (Persona)</label>
                                    <textarea 
                                        value={manualParams.systemInstruction || ''}
                                        onChange={(e) => setManualParams({...manualParams, systemInstruction: e.target.value})}
                                        className="w-full h-32 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none resize-none"
                                        placeholder="Instructions for the AI: 'You are an angry customer named John. You want a refund...'"
                                    />
                                </div>
                                <button 
                                    onClick={handleCreateManual}
                                    className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-[#0400c0] transition-all"
                                >
                                    Create Scenario
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: Active Session ---
    if (view === 'active' && activeScenario) {
        return (
            <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-fade-in bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                
                {/* Session Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { stopVoiceSession(); setView('list'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                             <ArrowRight size={20} className="rotate-180" />
                        </button>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {activeScenario.title}
                                {mode === 'voice' && isVoiceActive ? (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                )}
                            </h3>
                            <p className="text-xs text-slate-500">{mode === 'voice' ? 'Voice Call' : 'Text Simulation'} • {activeScenario.difficulty}</p>
                        </div>
                    </div>
                    <button 
                        onClick={endSession}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-red-200"
                    >
                        {mode === 'voice' ? <PhoneOff size={16} /> : <StopCircle size={16} />} 
                        {mode === 'voice' ? 'Hang Up & Grade' : 'End Session'}
                    </button>
                </div>

                {/* Voice Visualizer Overlay */}
                {mode === 'voice' && (
                    <div className="absolute top-20 right-6 z-20 pointer-events-none">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 transition-all ${isVoiceActive ? 'bg-green-500/10 text-green-600' : 'bg-slate-500/10 text-slate-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${isVoiceActive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-wider">{isVoiceActive ? 'On Air' : 'Connecting...'}</span>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                                <div className={`px-6 py-4 rounded-2xl text-base leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-[#0500e2] text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                                <p className={`text-[10px] text-slate-400 mt-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.role === 'user' ? 'You' : 'Customer'}
                                </p>
                            </div>
                        </div>
                    ))}
                    {(isProcessing || (mode === 'voice' && isVoiceActive && messages.length === 0)) && (
                         <div className="flex justify-start">
                             <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                 {mode === 'voice' ? (
                                     <>
                                        <BarChart2 size={16} className="animate-pulse text-green-500" />
                                        <span className="text-sm text-slate-500">Listening...</span>
                                     </>
                                 ) : (
                                     <>
                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                        <span className="text-sm text-slate-500">Customer is typing...</span>
                                     </>
                                 )}
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area (Text Mode Only) */}
                {mode === 'text' ? (
                    <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your response..."
                                className="w-full pl-6 pr-14 py-4 rounded-xl bg-slate-100 dark:bg-slate-950 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#0500e2] transition-all outline-none text-slate-900 dark:text-white"
                                disabled={isProcessing}
                                autoFocus
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isProcessing}
                                className="absolute right-2 p-2.5 bg-[#0500e2] hover:bg-[#0400c0] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Voice Mode Control Bar
                    <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
                                isVoiceActive ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-red-50 text-red-500'
                            }`}>
                                <Mic size={28} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {isVoiceActive ? 'Microphone On' : 'Microphone Off'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- VIEW: Result ---
    if (view === 'result' && result && activeScenario) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in pb-12">
                 <button onClick={() => setView('list')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold">
                    <ArrowRight size={20} className="rotate-180" /> Back to Scenarios
                 </button>

                 <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                     {/* Score Header */}
                     <div className="bg-slate-900 text-white p-10 md:p-14 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/50 to-slate-900 z-0"></div>
                        <div className="relative z-10">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Training Performance</p>
                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-white/10 bg-white/5 mb-6 relative">
                                <span className={`text-5xl font-serif font-bold ${result.score >= 80 ? 'text-green-400' : result.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {result.score}
                                </span>
                                <div className="absolute -bottom-3 bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-700">SCORE</div>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{result.score >= 80 ? 'Excellent Work!' : result.score >= 60 ? 'Good Effort' : 'Needs Improvement'}</h2>
                            <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">{result.feedback}</p>
                        </div>
                     </div>

                     {/* Details */}
                     <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div>
                             <h4 className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400 mb-6 uppercase tracking-wider text-sm">
                                <CheckCircle size={18} /> What went well
                             </h4>
                             <ul className="space-y-4">
                                {result.strengths.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                                        {s}
                                    </li>
                                ))}
                             </ul>
                         </div>
                         <div>
                             <h4 className="flex items-center gap-2 font-bold text-amber-500 mb-6 uppercase tracking-wider text-sm">
                                <Award size={18} /> Coaching Tips
                             </h4>
                             <ul className="space-y-4">
                                {result.improvements.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                                        {s}
                                    </li>
                                ))}
                             </ul>
                         </div>
                     </div>

                     {/* Training Transcript Viewer */}
                     <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <h4 className="flex items-center gap-2 font-bold text-slate-700 dark:text-white uppercase tracking-wider text-sm">
                                <FileText size={16} /> Training Transcript
                            </h4>
                            <button 
                                onClick={handleCopyTranscript}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0500e2] dark:hover:text-[#4b53fa] hover:border-[#0500e2] dark:hover:border-[#4b53fa] transition-all"
                            >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                {isCopied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-6 md:p-10 max-h-[400px] overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                            msg.role === 'user' 
                                            ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700' 
                                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                        }`}>
                                            <span className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                                                {msg.role === 'user' ? 'Agent (You)' : 'Customer'}
                                            </span>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-950 p-6 flex justify-center gap-4 border-t border-slate-100 dark:border-slate-800">
                         <button 
                            onClick={() => startSession(activeScenario, 'text')}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-all"
                         >
                            <MessageSquare size={18} /> Retry Text
                         </button>
                         <button 
                            onClick={() => startSession(activeScenario, 'voice')}
                            className="flex items-center gap-2 px-6 py-3 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                         >
                            <Phone size={18} /> Retry Voice
                         </button>
                     </div>
                 </div>
            </div>
        );
    }

    return null;
};