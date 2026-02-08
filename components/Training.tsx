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
    const trainingHistory = history.filter(h => h.customerName?.startsWith('Roleplay:') || h.summary?.startsWith('Training Session'));

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

    // Calculate word count
    const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length;
    const isOverLimit = wordCount > 24;

    const sendMessage = async () => {
        if (!input.trim() || !chatSession.current || mode === 'voice' || isOverLimit) return;
        
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
                if (error) {
                    console.error("Error saving scenario", error);
                    if (error.code === '42P01') {
                        alert("Database table 'scenarios' not found. Please run the SQL migration script in Supabase.");
                    } else {
                        alert(`Failed to save scenario: ${error.message}`);
                    }
                }
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
            if (error) {
                console.error("Error saving scenario", error);
                if (error.code === '42P01') {
                    alert("Database table 'scenarios' not found. Please run the SQL migration script in Supabase.");
                } else {
                    alert(`Failed to save scenario: ${error.message}`);
                }
            }
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
            alert(`Failed to delete: ${error.message}`);
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
                                                    {item.customerName?.replace('Roleplay: ', '')}
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
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
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
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        >
                                            <option value="Support">Customer Support</option>
                                            <option value="Sales">Sales / Upsell</option>
                                            <option value="Technical">Technical Support</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerateScenario}
                                    disabled={isGenerating || !aiParams.topic}
                                    className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                    {isGenerating ? 'Generating Scenario...' : 'Generate with AI'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Scenario Title</label>
                                    <input 
                                        type="text"
                                        value={manualParams.title || ''}
                                        onChange={(e) => setManualParams({...manualParams, title: e.target.value})}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        placeholder="e.g. The Difficult Transfer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                    <textarea 
                                        value={manualParams.description || ''}
                                        onChange={(e) => setManualParams({...manualParams, description: e.target.value})}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        placeholder="Brief context for the agent..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                        <select 
                                            value={manualParams.difficulty}
                                            onChange={(e) => setManualParams({...manualParams, difficulty: e.target.value as any})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                        <select 
                                            value={manualParams.category}
                                            onChange={(e) => setManualParams({...manualParams, category: e.target.value as any})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        >
                                            <option value="Support">Customer Support</option>
                                            <option value="Sales">Sales</option>
                                            <option value="Technical">Technical</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Initial Customer Message</label>
                                    <input 
                                        type="text"
                                        value={manualParams.initialMessage || ''}
                                        onChange={(e) => setManualParams({...manualParams, initialMessage: e.target.value})}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        placeholder="The first thing the customer says..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">AI Persona (System Prompt)</label>
                                    <textarea 
                                        value={manualParams.systemInstruction || ''}
                                        onChange={(e) => setManualParams({...manualParams, systemInstruction: e.target.value})}
                                        className="w-full h-32 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        placeholder="Instructions for the AI: 'You are an angry customer who...'"
                                    />
                                </div>
                                <button 
                                    onClick={handleCreateManual}
                                    className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] transition-all"
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
            <div className="h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Session Header */}
                <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                            activeScenario.category === 'Sales' ? 'bg-green-500' : 
                            activeScenario.category === 'Technical' ? 'bg-slate-700' : 'bg-red-500'
                        }`}>
                            {activeScenario.icon === 'TrendingUp' ? <TrendingUp size={20} /> : activeScenario.icon === 'Wrench' ? <Wrench size={20} /> : <Shield size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{activeScenario.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className={`px-1.5 rounded-md border ${mode === 'voice' ? 'border-red-200 bg-red-50 text-red-600 animate-pulse' : 'border-slate-200 bg-slate-100'}`}>
                                    {mode === 'voice' ? '● Live Voice' : 'Text Chat'}
                                </span>
                                <span>• {activeScenario.difficulty}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={endSession}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        End Session
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm md:text-base shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-[#0500e2] text-white rounded-br-sm' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-3">
                                <Loader2 size={18} className="animate-spin text-[#0500e2]" />
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Customer is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    {mode === 'text' ? (
                        <div className="relative flex gap-3">
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isOverLimit ? "Message too long!" : "Type your response..."}
                                    className={`w-full pl-5 pr-12 py-4 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none focus:ring-2 focus:ring-[#0500e2] transition-all shadow-sm ${
                                        isOverLimit ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                />
                                <div className={`absolute -bottom-6 right-1 text-[10px] font-bold transition-colors ${isOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
                                    {wordCount}/24 words
                                </div>
                            </div>
                            <button 
                                onClick={sendMessage}
                                disabled={!input.trim() || isProcessing || isOverLimit}
                                className="p-4 bg-[#0500e2] text-white rounded-xl hover:bg-[#0400c0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 h-[58px] w-[58px] flex items-center justify-center"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-4">
                            <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                Live Voice Active
                            </div>
                            <button 
                                onClick={stopVoiceSession}
                                className="px-8 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2 transition-all"
                            >
                                <PhoneOff size={18} /> Stop Speaking
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW: Results ---
    if (view === 'result' && result) {
        return (
            <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                    <div className="bg-slate-900 text-white p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                                Session Complete
                            </div>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">{result.score}%</h2>
                            <p className="text-blue-200 text-lg max-w-xl mx-auto">{result.feedback}</p>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/50 via-slate-900 to-slate-900"></div>
                    </div>

                    <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="text-emerald-500" size={20} /> Strengths
                            </h3>
                            <ul className="space-y-3">
                                {result.strengths.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                        <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="text-amber-500" size={20} /> Improvements
                            </h3>
                            <ul className="space-y-3">
                                {result.improvements.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                        <Sparkles size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <button onClick={() => setView('list')} className="font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            Back to Scenarios
                        </button>
                        <div className="flex gap-3">
                            <button onClick={handleCopyTranscript} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                                {isCopied ? <Check size={16} /> : <Copy size={16} />} Transcript
                            </button>
                            <button onClick={() => activeScenario && startSession(activeScenario, mode)} className="px-6 py-2 bg-[#0500e2] text-white rounded-lg font-bold text-sm hover:bg-[#0400c0] transition-colors flex items-center gap-2">
                                <RefreshCw size={16} /> Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};