
import React, { useState, useRef, useEffect } from 'react';
import { TrainingScenario, TrainingResult, User, AnalysisResult } from '../types';
import { evaluateTrainingSession } from '../services/geminiService';
import { Shield, TrendingUp, Wrench, ArrowRight, RefreshCw, CheckCircle, Loader2, Send, Phone, PhoneOff, MessageSquare, Copy, Check, Plus, Sparkles, X, Calendar, Trash2, AlertTriangle, HelpCircle, Heart, Zap, Trophy, Target, Frown, Meh, Smile, MinusCircle, Clock, FileText, BarChart3, Timer, Mic, Building2, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { generateId } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { PreSessionBriefing } from './PreSessionBriefing';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface AssemblyAITestProps {
    user: User | null;
    history: AnalysisResult[];
    onAnalysisComplete: (result: AnalysisResult) => void;
    addNotification: (notification: any) => void;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const AssemblyAITest: React.FC<AssemblyAITestProps> = ({ user, history, onAnalysisComplete, addNotification }) => {
    const { t, isRTL } = useLanguage();
    const [view, setView] = useState<'list' | 'briefing' | 'active' | 'result'>('list');
    const [activeScenario, setActiveScenario] = useState<TrainingScenario | null>(null);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<TrainingResult | null>(null);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // AssemblyAI States
    const [sessionStatus, setSessionStatus] = useState<'Disconnected' | 'Connecting' | 'Ready' | 'Listening' | 'Speaking'>('Disconnected');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [technicalLogs, setTechnicalLogs] = useState<{timestamp: string, message: string, type: 'info' | 'error' | 'success'}[]>([]);

    const isSessionReadyRef = useRef(false);
    const audioSentLogRef = useRef(false);
    const audioBeforeReadyLoggedRef = useRef(false);

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load Scenarios (simplified for test page)
    useEffect(() => {
        const fetchScenarios = async () => {
            setIsLoadingScenarios(true);
            try {
                const { data } = await supabase
                    .from('scenarios')
                    .select('*')
                    .limit(3);
                
                if (data && data.length > 0) {
                    setScenarios(data.map(s => ({
                        id: s.id,
                        title: s.title,
                        description: s.description || '',
                        difficulty: s.difficulty as any,
                        category: s.category as any,
                        icon: s.icon as any,
                        initialMessage: s.initial_message,
                        systemInstruction: s.system_instruction,
                        voice: (s.voice || getRandom(VOICES)) as any,
                        objectives: s.objectives || [],
                        talkTracks: s.talk_tracks || [],
                        openers: s.openers || []
                    })));
                }
            } catch (e) {
                console.error("Error loading scenarios:", e);
            } finally {
                setIsLoadingScenarios(false);
            }
        };
        fetchScenarios();
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (view === 'active' && !isAnalyzing) {
            interval = setInterval(() => {
                setSessionDuration(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [view, isAnalyzing]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        setTechnicalLogs(prev => [{
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        }, ...prev].slice(0, 50));
    };

    const startAssemblySession = async () => {
        if (!activeScenario) return;
        
        setMessages([]);
        setResult(null);
        setConnectionError(null);
        setSessionDuration(0);
        setSessionStatus('Connecting');
        setTechnicalLogs([]);
        addLog("Initializing session...");
        setView('active');

        try {
            // Fetch temporary token from our Vercel Serverless Function
            addLog("Fetching temporary authentication token...");
            const tokenResponse = await fetch('/api/assemblyai/token');
            if (!tokenResponse.ok) {
                throw new Error("Failed to fetch AssemblyAI token");
            }
            const { token } = await tokenResponse.json();

            // Connect directly to AssemblyAI using the token
            const wsUrl = `wss://speech-to-speech.us.assemblyai.com/v1/realtime?token=${token}`;
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("Connected to AssemblyAI");
                addLog("Connected to AssemblyAI", 'success');
                // Send session update immediately
                const config = {
                    type: "session.update",
                    session: {
                        system_prompt: activeScenario.systemInstruction || "You are a helpful voice assistant.",
                        greeting: activeScenario.initialMessage || "Hello! How can I help you today?",
                        tools: []
                    }
                };
                const configJson = JSON.stringify(config);
                console.log("Sending session.update:", configJson);
                addLog(`Sending session.update: ${configJson}`);
                socket.send(configJson);
            };

            socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                console.log("Received event from AssemblyAI:", data.type);

                switch (data.type) {
                    case "log":
                        addLog(data.message, 'info');
                        break;
                    case "session.updated":
                        console.log("AssemblyAI: Session updated successfully");
                        addLog("Session updated", 'success');
                        break;
                    case "session.ready":
                        console.log("AssemblyAI: Session ready received", data.session_id);
                        addLog("Session ready!", 'success');
                        setSessionStatus('Ready');
                        setSessionId(data.session_id);
                        isSessionReadyRef.current = true;
                        startMicrophone();
                        break;
                    case "input.speech.started":
                        addLog("Speech detected", 'info');
                        setSessionStatus('Listening');
                        break;
                    case "input.speech.stopped":
                        addLog("Speech stopped", 'info');
                        break;
                    case "reply.started":
                        addLog("Agent is replying", 'info');
                        setSessionStatus('Speaking');
                        break;
                    case "reply.done":
                        setSessionStatus('Ready');
                        break;
                    case "transcript.user":
                        setMessages(prev => [...prev, { role: 'user', text: data.text }]);
                        break;
                    case "transcript.agent":
                        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
                        break;
                    case "reply.audio":
                        playOutputAudio(data.data);
                        break;
                    case "error":
                    case "session.error":
                        addLog(`Error: ${data.message || "Unknown error"}`, 'error');
                        setConnectionError(data.message || "An error occurred with AssemblyAI");
                        stopSession();
                        break;
                }
            };

            socket.onerror = (error) => {
                console.error("WebSocket error:", error);
                addLog("WebSocket error occurred", 'error');
                setConnectionError("WebSocket connection failed");
                stopSession();
            };

            socket.onclose = (event) => {
                console.log(`WebSocket closed: ${event.code} ${event.reason}`);
                addLog(`Connection closed: ${event.code} ${event.reason}`, 'info');
                setSessionStatus('Disconnected');
            };

        } catch (e) {
            console.error("Failed to start AssemblyAI session:", e);
            setConnectionError("Failed to initialize session");
        }
    };

    const startMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            // AssemblyAI S2S uses 24000 Hz
            const audioContext = new AudioContextClass({ sampleRate: 24000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // 1024 samples at 24kHz is ~42ms, which is close to the recommended 50ms
            const processor = audioContext.createScriptProcessor(1024, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    if (!isSessionReadyRef.current) {
                        if (!audioBeforeReadyLoggedRef.current) {
                            console.warn("Attempted to send audio before session.ready - blocking frame");
                            addLog("Audio blocked: session not ready", 'info');
                            audioBeforeReadyLoggedRef.current = true;
                        }
                        return;
                    }
                    
                    if (!audioSentLogRef.current) {
                        console.log("AssemblyAI: First audio frame sent successfully");
                        addLog("First audio frame sent", 'success');
                        audioSentLogRef.current = true;
                    }

                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert Float32 to Int16 PCM
                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }
                    
                    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
                    socketRef.current.send(JSON.stringify({
                        type: "input.audio",
                        audio: base64Audio
                    }));
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        } catch (e) {
            console.error("Microphone access failed:", e);
            setConnectionError("Microphone access denied or failed");
        }
    };

    const playOutputAudio = async (base64Data: string) => {
        try {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                // AssemblyAI S2S uses 24000 Hz
                audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
            }
            
            const ctx = audioContextRef.current;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const pcmData = new Int16Array(bytes.buffer);
            const floatData = new Float32Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                floatData[i] = pcmData[i] / 0x7FFF;
            }

            const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
            audioBuffer.getChannelData(0).set(floatData);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);

            const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
            source.start(startTime);
            nextStartTimeRef.current = startTime + audioBuffer.duration;
        } catch (e) {
            console.error("Error playing audio:", e);
        }
    };

    const stopSession = () => {
        isSessionReadyRef.current = false;
        audioSentLogRef.current = false;
        audioBeforeReadyLoggedRef.current = false;
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setSessionStatus('Disconnected');
    };

    const endSessionAndAnalyze = async () => {
        stopSession();
        setIsAnalyzing(true);
        
        const transcript = messages.map(m => `${m.role === 'user' ? 'Agent' : 'Customer'}: ${m.text}`).join('\n');
        
        try {
            const evalResult = await evaluateTrainingSession(transcript, activeScenario!);
            setResult(evalResult);

            const trainingAnalysis: AnalysisResult = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                agentName: user?.name || user?.email?.split('@')[0] || 'Trainee',
                customerName: `AssemblyAI Test: ${activeScenario!.title}`,
                summary: `AssemblyAI Session: ${evalResult.feedback}`,
                overallScore: evalResult.score,
                sentiment: evalResult.sentiment || 'Neutral',
                criteriaResults: evalResult.criteriaResults || [],
                rawTranscript: transcript
            };

            onAnalysisComplete(trainingAnalysis);
            setView('result');
        } catch (e) {
            console.error("Analysis failed:", e);
            setView('list');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const selectScenario = (scenario: TrainingScenario) => {
        setActiveScenario(scenario);
        setView('briefing');
    };

    if (view === 'active') {
        if (isAnalyzing) {
            return (
                <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
                    <div className="text-center p-8 max-w-md">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BarChart3 size={40} className="text-[#0500e2] animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('training.active.generating')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            {t('training.active.generating_desc')}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-bottom border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#0500e2] rounded-lg text-white">
                            <Mic size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{activeScenario?.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${
                                    sessionStatus === 'Ready' ? 'bg-green-500 animate-pulse' : 
                                    sessionStatus === 'Listening' ? 'bg-blue-500 animate-bounce' :
                                    sessionStatus === 'Speaking' ? 'bg-amber-500 animate-pulse' :
                                    'bg-slate-400'
                                }`} />
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {sessionStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Timer size={14} className="text-slate-400" />
                            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                                {formatTime(sessionDuration)}
                            </span>
                        </div>
                        
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <SettingsIcon size={20} />
                        </button>

                        <button
                            onClick={endSessionAndAnalyze}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
                        >
                            <PhoneOff size={18} />
                            End Session
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-bottom border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30"
                        >
                            <div className="p-6 grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Session Context</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Session ID:</span>
                                            <span className="font-mono text-slate-700 dark:text-slate-300">{sessionId || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Audio Format:</span>
                                            <span className="text-slate-700 dark:text-slate-300">PCM 16kHz</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Logs</h4>
                                    <div className="bg-slate-900 rounded-lg p-3 h-48 overflow-y-auto font-mono text-[10px] space-y-1">
                                        {technicalLogs.map((log, i) => (
                                            <div key={i} className={
                                                log.type === 'error' ? 'text-red-400' :
                                                log.type === 'success' ? 'text-green-400' :
                                                'text-slate-400'
                                            }>
                                                <span className="opacity-50">[{log.timestamp}]</span> {log.message}
                                            </div>
                                        ))}
                                        {technicalLogs.length === 0 && (
                                            <div className="text-slate-600 italic">No logs yet...</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-[#0500e2]/10 rounded-full flex items-center justify-center text-[#0500e2]">
                                <Sparkles size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Waiting for session...</h4>
                                <p className="text-sm text-slate-500 max-w-xs mt-1">
                                    The session is initializing. Once ready, the agent will greet you.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-[#0500e2] text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 rounded-tl-none'
                            }`}>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Status Bar */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-top border-slate-200 dark:border-slate-800 flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${sessionStatus === 'Listening' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listening</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${sessionStatus === 'Speaking' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Speaking</span>
                    </div>
                </div>
                
                {connectionError && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                        <AlertTriangle size={20} />
                        <span className="font-bold">{connectionError}</span>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'briefing') {
        return (
            <PreSessionBriefing 
                scenario={activeScenario!} 
                mode="voice"
                attempts={history.filter(h => h.customerName?.includes(activeScenario?.title || '')).length}
                onStart={startAssemblySession} 
                onBack={() => setView('list')} 
            />
        );
    }

    if (view === 'result' && result) {
        return (
            <div className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Session Analysis</h2>
                            <p className="text-slate-500">AssemblyAI Speech-to-Speech Test Results</p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-black text-[#0500e2]">{result.score}%</div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Overall Score</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-500" />
                                Key Feedback
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{result.feedback}</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target size={18} className="text-[#0500e2]" />
                                Next Steps
                            </h3>
                            <ul className="space-y-2">
                                {result.nextSteps?.map((step, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle size={14} className="text-green-500" />
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <button
                        onClick={() => setView('list')}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                        Back to Scenarios
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AssemblyAI Test</h2>
                    <p className="text-slate-500">Test real-time Speech-to-Speech integration</p>
                </div>
            </div>

            {isLoadingScenarios ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-[#0500e2]" size={40} />
                    <p className="text-slate-500 font-medium">Loading test scenarios...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {scenarios.map((scenario) => (
                        <motion.div
                            key={scenario.id}
                            whileHover={{ y: -5 }}
                            onClick={() => selectScenario(scenario)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#0500e2]/30 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[#0500e2] group-hover:bg-[#0500e2] group-hover:text-white transition-colors">
                                    {scenario.icon === 'Shield' && <Shield size={24} />}
                                    {scenario.icon === 'TrendingUp' && <TrendingUp size={24} />}
                                    {scenario.icon === 'Wrench' && <Wrench size={24} />}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    scenario.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                    scenario.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                }`}>
                                    {scenario.difficulty}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{scenario.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6">{scenario.description}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <Mic size={14} />
                                    Voice Test
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-[#0500e2] transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
