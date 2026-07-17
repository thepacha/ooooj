import React, { useState, useRef, useEffect } from 'react';
import { TrainingScenario, TrainingResult, User, AnalysisResult, CriteriaResult } from '../types';
import { createTrainingSession, evaluateTrainingSession, connectLiveTraining, generateAIScenario, generateTrainingTopic, GenerateScenarioParams } from '../services/geminiService';
import { Shield, TrendingUp, Wrench, ArrowRight, RefreshCw, CheckCircle, Loader2, Send, Phone, PhoneOff, MessageSquare, Copy, Check, Plus, Sparkles, X, Calendar, Trash2, AlertTriangle, HelpCircle, Heart, Zap, Trophy, Target, Frown, Meh, Smile, MinusCircle, Clock, FileText, BarChart3, Timer, Mic, Building2, ChevronRight, Globe, Award, Languages, BookOpen } from 'lucide-react';
import { incrementUsage, COSTS, checkLimit } from '../lib/usageService';
import { generateId } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { PreSessionBriefing } from './PreSessionBriefing';
import { useLanguage } from '../contexts/LanguageContext';

// Define local interface for Audio Data to avoid SDK import conflicts
interface AudioDataPart {
  mimeType: string;
  data: string;
}

interface AiConversationProps {
    user: User | null;
    history: AnalysisResult[];
    onAnalysisComplete: (result: AnalysisResult) => void;
    addNotification: (notification: any) => void;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];

const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Pre-configured Language Scenarios to seed for a beautiful user experience
const generateDefaultLanguageScenarios = (): TrainingScenario[] => {
    return [
        {
            id: generateId(),
            title: "First Meeting: Cafe Chat",
            description: "You are meeting a friendly language exchange partner, Lucas, at a cozy cafe. Keep it casual, practice introducing yourself, ask about his hobbies, and order a coffee in your target language.",
            difficulty: 'Beginner',
            category: 'Sales', // Maps internally to Sales (Social Conversation)
            icon: 'TrendingUp',
            initialMessage: "Hey there! I'm Lucas. Great to finally meet you in person! What would you like to order? I'm getting a cappuccino.",
            systemInstruction: "You are Lucas, a friendly and extremely patient language partner. Speak clearly, use simple and approachable vocabulary, and gently prompt the user to practice introducing themselves, expressing preferences, and ordering cafe items. Support English, Spanish, French, German, Arabic, or Italian depending on user choice.",
            voice: 'Fenrir',
            language: 'English',
            dialect: '',
            objectives: [
                "Introduce yourself clearly (name, background, interests)",
                "Order a drink or snack politely using proper greetings",
                "Ask Lucas about his day or hobbies in the target language"
            ],
            talkTracks: [
                "Nice to meet you, I'm...",
                "I would like to order a...",
                "What do you like to do in your free time?"
            ],
            openers: [
                "\"Hi Lucas! It is so nice to meet you. I'll have an espresso, please.\"",
                "\"Hello! I'm excited to practice my speaking. What pastries do they have?\"",
                "\"Hey Lucas! Great cafe. Let's find a nice table and start chatting.\""
            ]
        },
        {
            id: generateId(),
            title: "Airport Lost Luggage Dispute",
            description: "Your bags did not arrive on your flight. You are talking to a busy airport baggage service agent, Clara. Explain your situation, describe your baggage, ask when it will arrive, and request a delivery address update.",
            difficulty: 'Intermediate',
            category: 'Support', // Maps internally to Support (Travel & Shopping)
            icon: 'Shield',
            initialMessage: "Next in line, please. Hello, how can I help you? Please have your passport and boarding pass ready.",
            systemInstruction: "You are Clara, a busy and direct airport baggage handler. You are polite but professional and want to get all the details quickly. Ask for the baggage claim tag, the bag's size/color/brand, and their hotel address. Respond dynamically to their target language.",
            voice: 'Kore',
            language: 'English',
            dialect: '',
            objectives: [
                "Explain the lost bag issue clearly in the target language",
                "Describe your luggage in detail (color, size, unique characteristics)",
                "Confirm the delivery hotel address and ask for a receipt/tracking number"
            ],
            talkTracks: [
                "My suitcase did not appear on the carousel.",
                "It is a large, hard-shell blue suitcase with wheels.",
                "Can you deliver it to my hotel?"
            ],
            openers: [
                "\"Hello Clara. I was on flight 204 and my bags are missing.\"",
                "\"Excuse me, my luggage seems to be lost. Where should I file a report?\"",
                "\"Hi, here is my claim ticket. My suitcase didn't come out on carousel 4.\""
            ]
        },
        {
            id: generateId(),
            title: "The Job Interview Pitch",
            description: "You are interviewing for a highly-coveted position in your target language. Speak with Elena, a sharp and demanding hiring manager. Explain your background, answer challenging behavioral questions, and pitch why you are the perfect candidate.",
            difficulty: 'Advanced',
            category: 'Technical', // Maps internally to Technical (Professional & Business)
            icon: 'Wrench',
            initialMessage: "Welcome, thank you for coming in today. Let's dive straight in. Can you walk me through your background and why you are interested in this specific role?",
            systemInstruction: "You are Elena, a sharp and professional corporate hiring manager. You ask challenging questions about past conflicts, accomplishments, and career goals. Expect formal, advanced vocabulary and confident sentence structure in the target language.",
            voice: 'Aoede',
            language: 'English',
            dialect: '',
            objectives: [
                "Deliver a confident, elegant professional introduction",
                "Describe a major career achievement using professional terms",
                "Politely state your compensation expectations and next steps"
            ],
            talkTracks: [
                "In my previous role, I was responsible for...",
                "One major challenge I overcame was...",
                "I am looking for a package around..."
            ],
            openers: [
                "\"Thank you Elena. I have over five years of experience in product development...\"",
                "\"Good morning Elena. I've been following your company's growth and am excited about...\"",
                "\"It's a pleasure to meet you. I'd love to tell you how my background fits your team.\""
            ]
        }
    ];
};

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

function createAudioData(data: Float32Array): AudioDataPart {
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

interface AIParamsState {
    topic: string;
    difficulty: string;
    category: 'Sales' | 'Support' | 'Technical'; // Mapped internally: Sales=Social, Support=Travel, Technical=Professional
    funnelStage: string;
    persona: string;
    mood: string;
    industry: string;
    language: string;
    dialect: string;
}

export const AiConversation: React.FC<AiConversationProps> = ({ user, history, onAnalysisComplete, addNotification }) => {
    const { t, isRTL } = useLanguage();
    const [view, setView] = useState<'list' | 'briefing' | 'active' | 'result' | 'create'>('list');
    const [activeTab, setActiveTab] = useState<'scenarios' | 'history'>('scenarios');
    const [activeScenario, setActiveScenario] = useState<TrainingScenario | null>(null);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<TrainingResult | null>(null);
    const [mode, setMode] = useState<'text' | 'voice'>('text');
    const [isCopied, setIsCopied] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    
    const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Filter state for Languages and Difficulties
    const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');
    const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('All');

    // Creation State
    const [creationType, setCreationType] = useState<'manual' | 'ai'>('ai');
    
    // Customize params default state for Language Practice
    const [aiParams, setAiParams] = useState<AIParamsState>({ 
        topic: '', 
        difficulty: 'Intermediate', 
        category: 'Sales', // Maps to Social
        funnelStage: 'Conversational',
        persona: 'Friendly Native Speaker',
        mood: 'Patient',
        industry: 'Everyday Life',
        language: 'Spanish',
        dialect: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
    const [manualParams, setManualParams] = useState<Partial<TrainingScenario>>({ 
        difficulty: 'Intermediate', 
        category: 'Sales', 
        language: 'Spanish' 
    });
    
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

    // Refs for Cartesia low-latency sentence-level streaming pipeline
    const cartesiaSentenceBuffer = useRef('');
    const cartesiaQueue = useRef<{
        id: number;
        text: string;
        audioBuffer: AudioBuffer | null;
        isFetching: boolean;
        error: boolean;
    }[]>([]);
    const nextSentenceId = useRef(0);
    const isProcessingQueue = useRef(false);

    const resetCartesiaQueue = () => {
        cartesiaSentenceBuffer.current = '';
        cartesiaQueue.current = [];
        nextSentenceId.current = 0;
        isProcessingQueue.current = false;
    };

    // Derived state for input limits
    const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length;
    const isOverLimit = wordCount > 24;

    // Load Scenarios Logic
    useEffect(() => {
        if (!user) {
            setScenarios(generateDefaultLanguageScenarios());
            return;
        }

        const fetchAndSeedScenarios = async () => {
            setIsLoadingScenarios(true);
            try {
                // Fetch from supabase where target user id matches
                const { data, error } = await supabase
                    .from('scenarios')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error && error.code !== '42P01') throw error;

                // Separate custom language scenarios or use existing
                if (data && data.length > 0) {
                    const mapped: TrainingScenario[] = data.map(s => ({
                        id: s.id,
                        title: s.title,
                        description: s.description || '',
                        difficulty: s.difficulty as any,
                        category: s.category as any,
                        icon: s.icon as any,
                        initialMessage: s.initial_message,
                        systemInstruction: s.system_instruction,
                        voice: (s.voice || getRandom(VOICES)) as any, 
                        language: s.language || 'English',
                        dialect: s.dialect || '',
                        objectives: s.objectives || [],
                        talkTracks: s.talk_tracks || [],
                        openers: s.openers || []
                    }));
                    // Filter out non-language scenarios if any, or merge. Let's show language-based ones
                    setScenarios(mapped);
                } else {
                    const seedBatch = generateDefaultLanguageScenarios();
                    await saveScenariosToDb(seedBatch, user.id);
                    setScenarios(seedBatch);
                }
            } catch (e) {
                console.error("Error loading/seeding language scenarios:", e);
                setScenarios(generateDefaultLanguageScenarios());
            } finally {
                setIsLoadingScenarios(false);
            }
        };

        fetchAndSeedScenarios();
    }, [user]);

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

    // Helper to bulk save scenarios
    const saveScenariosToDb = async (newScenarios: TrainingScenario[], userId: string) => {
        const records = newScenarios.map(s => ({
            id: s.id,
            user_id: userId,
            title: s.title,
            description: s.description,
            difficulty: s.difficulty,
            category: s.category,
            icon: s.icon,
            initial_message: s.initialMessage,
            system_instruction: s.systemInstruction,
            objectives: s.objectives,
            talk_tracks: s.talkTracks,
            openers: s.openers,
            voice: s.voice,
            language: s.language || 'English',
            dialect: s.dialect || ''
        }));
        
        const { error } = await supabase.from('scenarios').insert(records);
        if (error) console.error("Failed to save scenarios to DB:", error);
    };

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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRegenerateCustomScenario = async (scenario: TrainingScenario, e: React.MouseEvent) => {
        e.stopPropagation();
        if (regeneratingIds.has(scenario.id)) return;

        setRegeneratingIds(prev => new Set(prev).add(scenario.id));

        try {
            const context = scenario.description || scenario.title;

            // Generate an AI scenario based on topic and parameters
            const newVersion = await generateAIScenario({
                topic: `A language practicing scenario: ${context}`,
                category: scenario.category,
                difficulty: scenario.difficulty,
                funnelStage: 'Conversational',
                persona: 'Native Speaker',
                mood: 'Patient',
                industry: 'Daily Interactions',
                language: scenario.language || 'English',
                dialect: scenario.dialect || ''
            });
            
            const updates = {
                title: newVersion.title,
                description: newVersion.description,
                initial_message: newVersion.initialMessage,
                system_instruction: newVersion.systemInstruction,
                voice: newVersion.voice,
                objectives: newVersion.objectives,
                talk_tracks: newVersion.talkTracks,
                openers: newVersion.openers,
                language: scenario.language || 'English',
                dialect: scenario.dialect || ''
            };

            if (user) {
                const { error } = await supabase
                    .from('scenarios')
                    .update(updates)
                    .eq('id', scenario.id);
                
                if (error) throw error;
            }

            setScenarios(prev => prev.map(s => 
                s.id === scenario.id 
                ? { ...s, ...newVersion, language: scenario.language, dialect: scenario.dialect } 
                : s
            ));

        } catch (e: any) {
            console.error("Failed to regenerate scenario", e);
            alert(`Failed to regenerate scenario: ${e.message || 'Unknown error'}`);
        } finally {
            setRegeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(scenario.id);
                return next;
            });
        }
    };
    
    // Filter history specifically for Language Practice sessions
    const languageHistory = history.filter(h => 
        h.customerName?.startsWith('Roleplay:') || h.summary?.startsWith('Training Session')
    );
    const totalAttempts = languageHistory.length;
    const totalXP = languageHistory.reduce((acc, curr) => acc + (curr.overallScore * 12) + 60, 0);
    const avgScore = totalAttempts > 0 
        ? Math.round(languageHistory.reduce((acc, curr) => acc + curr.overallScore, 0) / totalAttempts) 
        : 0;

    const selectScenario = (scenario: TrainingScenario, sessionMode: 'text' | 'voice') => {
        setActiveScenario(scenario);
        setMode(sessionMode);
        setView('briefing');
    };

    const confirmStartSession = async (selectedVoiceId?: string) => {
        if (!activeScenario) return;

        if (selectedVoiceId) {
            activeScenario.voice = selectedVoiceId;
        }

        if (user) {
             const canProceed = await checkLimit(user.id, COSTS.CHAT * 5); 
             if (!canProceed) {
                 alert("Insufficient credits for language practice session.");
                 return;
             }
        }

        setMessages([]); 
        setResult(null);
        setConnectionError(null);
        setIsAnalyzing(false);
        setSessionDuration(0);
        
        chatSession.current = null;

        if (mode === 'text') {
            try {
                chatSession.current = createTrainingSession(activeScenario);
                setView('active');
            } catch (e) {
                console.error(e);
                alert("Failed to start session. Check API Key configuration.");
            }
        } else {
            setView('active');
            startVoiceConnection(activeScenario);
        }
    };

    const queueAndFetchSentence = (text: string, voiceId: string) => {
        const sentenceId = nextSentenceId.current++;
        const item = {
            id: sentenceId,
            text,
            audioBuffer: null,
            isFetching: true,
            error: false
        };
        cartesiaQueue.current.push(item);
        
        // Start fetch asynchronously
        fetchSentenceAudio(item, voiceId);
    };

    const fetchSentenceAudio = async (item: any, voiceId: string) => {
        try {
            const response = await fetch('/api/cartesia/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: item.text,
                    voiceId: voiceId
                })
            });
            
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const ctx = outputAudioContext.current;
                if (ctx) {
                    if (ctx.state === 'suspended') {
                        await ctx.resume();
                    }
                    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                    item.audioBuffer = audioBuffer;
                } else {
                    item.error = true;
                }
            } else {
                console.error(`Cartesia TTS sentence fetch failed: status ${response.status} for text "${item.text}"`);
                item.error = true;
            }
        } catch (err) {
            console.error("Failed to fetch/decode Cartesia sentence:", err);
            item.error = true;
        } finally {
            item.isFetching = false;
            processCartesiaPlayQueue();
        }
    };

    const processCartesiaPlayQueue = async () => {
        if (isProcessingQueue.current) return;
        isProcessingQueue.current = true;
        
        try {
            const ctx = outputAudioContext.current;
            if (!ctx) {
                isProcessingQueue.current = false;
                return;
            }
            
            while (cartesiaQueue.current.length > 0) {
                const first = cartesiaQueue.current[0];
                
                if (first.isFetching) {
                    break;
                }
                
                if (first.error || !first.audioBuffer) {
                    cartesiaQueue.current.shift();
                    continue;
                }
                
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }
                
                const audioBuffer = first.audioBuffer;
                nextStartTime.current = Math.max(nextStartTime.current, ctx.currentTime);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                source.addEventListener('ended', () => {
                    sources.current.delete(source);
                });
                
                source.start(nextStartTime.current);
                nextStartTime.current += audioBuffer.duration;
                sources.current.add(source);
                
                cartesiaQueue.current.shift();
            }
        } catch (err) {
            console.error("Error in processCartesiaPlayQueue:", err);
        } finally {
            isProcessingQueue.current = false;
        }
    };

    const startVoiceConnection = async (scenario: TrainingScenario) => {
        setIsVoiceActive(true);
        setConnectionError(null);
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';
        nextStartTime.current = 0;
        resetCartesiaQueue();

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error("Audio Context not supported");
            }

            inputAudioContext.current = new AudioContextClass({sampleRate: 16000});
            outputAudioContext.current = new AudioContextClass({sampleRate: 24000});
            
            await inputAudioContext.current.resume();
            await outputAudioContext.current.resume();
            
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
                    console.log("Language Voice Session Open");
                    if (!inputAudioContext.current) return;
                    
                    const source = inputAudioContext.current.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContext.current.createScriptProcessor(2048, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const audioData = createAudioData(inputData);
                        sessionPromise.then(session => {
                            try {
                                session.sendRealtimeInput({ media: audioData });
                            } catch(err) {
                                console.warn("Failed to send audio", err);
                            }
                        });
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.current.destination);
                },
                onMessage: async (message) => {
                    const isCartesiaVoice = scenario.voice ? !VOICES.includes(scenario.voice) : false;

                    if (message.serverContent?.outputTranscription) {
                        const newText = message.serverContent.outputTranscription.text;
                        currentOutputTranscription.current += newText;

                        if (isCartesiaVoice) {
                            cartesiaSentenceBuffer.current += newText;
                            
                            // Regex to match a complete sentence ending with standard punctuation or newline
                            const sentenceRegex = /([^.?!。？！\n\r]+[.?!。？！\n\r]+)/g;
                            let match;
                            let lastIndex = 0;
                            const currentBufferText = cartesiaSentenceBuffer.current;
                            
                            while ((match = sentenceRegex.exec(currentBufferText)) !== null) {
                                const sentence = match[1].trim();
                                if (sentence.length > 0) {
                                    queueAndFetchSentence(sentence, scenario.voice || '');
                                }
                                lastIndex = sentenceRegex.lastIndex;
                            }
                            
                            if (lastIndex > 0) {
                                cartesiaSentenceBuffer.current = currentBufferText.substring(lastIndex);
                            }
                        }
                    } else if (message.serverContent?.inputTranscription) {
                        currentInputTranscription.current += message.serverContent.inputTranscription.text;
                        
                        // User started speaking/interrupted! Stop any playing Cartesia audio immediately and clear the queue
                        if (isCartesiaVoice) {
                            sources.current.forEach(src => {
                                try { src.stop(); } catch(e){}
                            });
                            sources.current.clear();
                            nextStartTime.current = 0;
                            resetCartesiaQueue();
                        }
                    }

                    if (message.serverContent?.turnComplete) {
                        const userText = currentInputTranscription.current;
                        const modelText = currentOutputTranscription.current;
                        
                        if (userText.trim()) {
                            setMessages(prev => {
                                const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
                                if (lastUserMsg && lastUserMsg.text === userText) return prev;
                                return [...prev, {role: 'user', text: userText}];
                            });
                        }
                        if (modelText.trim()) {
                            setMessages(prev => [...prev, {role: 'model', text: modelText}]);

                            if (isCartesiaVoice) {
                                // Flush any remaining text in the sentence buffer
                                const remainingText = cartesiaSentenceBuffer.current.trim();
                                if (remainingText.length > 0) {
                                    queueAndFetchSentence(remainingText, scenario.voice || '');
                                    cartesiaSentenceBuffer.current = '';
                                }
                            }
                        }

                        currentInputTranscription.current = '';
                        currentOutputTranscription.current = '';
                    }

                    const parts = message.serverContent?.modelTurn?.parts;
                    const base64Audio = parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContext.current && !isCartesiaVoice) {
                        const ctx = outputAudioContext.current;
                        if (ctx.state === 'suspended') {
                            await ctx.resume();
                        }

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
                    if (window.location.hostname === 'app.revuqai.com' || window.location.hostname.includes('vercel.app')) {
                        setConnectionError("Voice connection failed. Vercel's serverless hosting does not support persistent WebSockets. To run real-time AI Voice sessions, please deploy the application as a persistent container/server on Cloud Run or Render.");
                    } else {
                        setConnectionError("Voice session disconnected. Please check your network connection or model keys.");
                    }
                    setIsVoiceActive(false);
                    stopVoiceSession();
                },
                onClose: () => {
                    console.log("Voice Session Closed");
                    setIsVoiceActive(false);
                }
            });
            
            chatSession.current = sessionPromise; 

        } catch (e: any) {
            console.error("Voice setup failed", e);
            setConnectionError("Could not access microphone or connect to AI. Please check permissions and network.");
            setIsVoiceActive(false);
        }
    };

    const stopVoiceSession = () => {
        setIsVoiceActive(false);
        if (inputAudioContext.current) {
            inputAudioContext.current.close().catch(console.error);
            inputAudioContext.current = null;
        }
        if (outputAudioContext.current) {
            outputAudioContext.current.close().catch(console.error);
            outputAudioContext.current = null;
        }
        
        resetCartesiaQueue();

        if (chatSession.current && typeof chatSession.current.then === 'function') {
             chatSession.current.then((session: any) => {
                 try {
                    session.close();
                 } catch(e) { console.warn("Session already closed"); }
             }).catch(() => {});
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !chatSession.current || mode === 'voice' || isOverLimit) return;
        
        if (typeof chatSession.current.sendMessageStream !== 'function') {
            console.error("Chat session is not ready.");
            return;
        }

        const userMsg = input.trim();
        setInput('');
        
        setMessages(prev => [
            ...prev, 
            { role: 'user', text: userMsg },
            { role: 'model', text: '' } 
        ]);
        
        try {
            const result = await chatSession.current.sendMessageStream({ message: userMsg });
            
            for await (const chunk of result) {
                const chunkText = chunk.text;
                if (chunkText) {
                    setMessages(prev => {
                        const newHistory = [...prev];
                        const lastMsg = newHistory[newHistory.length - 1];
                        if (lastMsg && lastMsg.role === 'model') {
                            lastMsg.text += chunkText;
                        }
                        return newHistory;
                    });
                }
            }
        } catch (e: any) {
            console.error("Stream Error", e);
            setMessages(prev => {
                const newHistory = [...prev];
                const lastMsg = newHistory[newHistory.length - 1];
                let errorText = "⚠️ Connection Error. Please try again.";
                if (e.message?.includes('Failed to fetch')) {
                    errorText = "⚠️ Network Error: Unable to reach AI. Check your internet connection.";
                }
                if (lastMsg && lastMsg.role === 'model') {
                    lastMsg.text = lastMsg.text ? lastMsg.text + `\n[${errorText}]` : errorText;
                }
                return newHistory;
            });
        }
    };

    const endSession = async () => {
        if (!activeScenario) return;
        
        if (mode === 'voice') {
            stopVoiceSession();
        }
        
        setIsAnalyzing(true);
        const transcript = messages.map(m => `${m.role === 'user' ? 'Learner' : 'AI Partner'}: ${m.text}`).join('\n');
        
        try {
            const evalResult = await evaluateTrainingSession(transcript, activeScenario);
            setResult(evalResult);

            const conversationAnalysis: AnalysisResult = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                agentName: `Language Learner (${activeScenario.language})`,
                customerName: `Roleplay: ${activeScenario.title}`,
                summary: `Language Practice (${activeScenario.difficulty}): ${evalResult.feedback}`,
                overallScore: evalResult.score,
                sentiment: evalResult.sentiment || 'Neutral',
                criteriaResults: evalResult.criteriaResults || [],
                rawTranscript: transcript
            };

            onAnalysisComplete(conversationAnalysis);
            
            addNotification({
              type: 'system',
              title: 'Language Session Complete',
              message: `Practice "${activeScenario.title}" evaluated successfully. XP earned!`,
              link: 'evaluation',
              targetId: conversationAnalysis.id
            });

            if (user) {
                await incrementUsage(user.id, COSTS.ANALYSIS, 'analysis'); 
            }
            
            setView('result');
        } catch (e: any) {
            console.error(e);
            alert("Failed to evaluate session.");
            setIsAnalyzing(false);
        }
    };

    // AI Language Scenario Generator with mapped categories to avoid validation issues
    const handleGenerateScenario = async () => {
        if (!aiParams.topic) return;
        setIsGenerating(true);
        try {
            // Tweak the topic prompt so that the generator creates a language-focused roleplay
            const targetPrompt = `[LANGUAGE LEARNING SCENARIO in ${aiParams.language} ${aiParams.dialect ? `(${aiParams.dialect} Dialect)` : ''} for ${aiParams.difficulty} level] Situation: ${aiParams.topic}. The conversation partner is a ${aiParams.persona} with a ${aiParams.mood} temperament. Specify clear language-focused objectives.`;
            
            const generated = await generateAIScenario({
                ...aiParams,
                topic: targetPrompt
            });

            const newScenario: TrainingScenario = {
                ...generated,
                id: generateId(),
                icon: (aiParams.category === 'Sales' ? 'TrendingUp' : aiParams.category === 'Technical' ? 'Wrench' : 'Shield'),
                language: aiParams.language,
                dialect: aiParams.dialect
            };

            if (user) {
                await saveScenariosToDb([newScenario], user.id);
            }

            setScenarios(prev => [newScenario, ...prev]); 
            setView('list');
        } catch (e) {
            console.error(e);
            alert("Failed to generate language scenario. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto generate topic customized for language practicing
    const handleAutoGenerateTopic = async () => {
        setIsGeneratingTopic(true);
        try {
            const sampleTopics = [
                `Ordering street food and bargaining for a handwoven scarf at a bustling market in Madrid`,
                `Asking a friendly local for directions to the train station and buying a ticket from the kiosk`,
                `Checking into a boutique family-run hotel, requesting a high-floor room with a view, and asking for local restaurant recommendations`,
                `Describing acute flu symptoms, allergy notes, and filling a prescription at a pharmacy`,
                `Introducing yourself to fellow students in a local art class, asking about their interests, and arranging a weekend study group`,
                `Pitching your professional skills and past marketing experience in a job interview with a local tech firm`
            ];
            const topic = getRandom(sampleTopics);
            setAiParams(prev => ({...prev, topic}));
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingTopic(false);
        }
    };

    const handleCreateManual = async () => {
        if (!manualParams.title || !manualParams.initialMessage || !manualParams.systemInstruction) {
            alert("Please fill in all required fields.");
            return;
        }
        
        const langName = manualParams.language || 'English';

        const genericObjectives = [
            `Maintain a natural dialogue flow in ${langName}.`,
            "Express ideas and respond with appropriate vocabulary.",
            "Demonstrate proper grammar, tense agreement, and polite greetings."
        ];
        
        const genericTalkTracks = [
            `I am currently practicing my ${langName}, please excuse my mistakes!`,
            "Could you please repeat that a bit slower?",
            "How do you say that in a casual way?"
        ];
        
        const genericOpeners = [
            `"Hello! I am happy to meet you today. Let's practice speaking ${langName} together."`,
            `"Hi! Excuse me, could you help me practice? I want to talk about this topic."`
        ];

        const newScenario: TrainingScenario = {
            id: generateId(),
            title: manualParams.title!,
            description: manualParams.description || '',
            difficulty: (manualParams.difficulty as any) || 'Intermediate',
            category: (manualParams.category as any) || 'Sales',
            icon: 'TrendingUp',
            initialMessage: manualParams.initialMessage!,
            systemInstruction: manualParams.systemInstruction!,
            voice: 'Puck',
            objectives: genericObjectives,
            talkTracks: genericTalkTracks,
            openers: genericOpeners,
            language: manualParams.language || 'English',
            dialect: manualParams.dialect || ''
        };

        if (user) {
            await saveScenariosToDb([newScenario], user.id);
        }

        setScenarios(prev => [newScenario, ...prev]);
        setView('list');
    };

    const confirmDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            setScenarios(prev => prev.filter(s => s.id !== id));
            return;
        }
        
        setScenarios(prev => prev.filter(s => s.id !== id));
        setDeletingId(null);

        const { error } = await supabase.from('scenarios').delete().eq('id', id);
        if (error) {
            console.error("Error deleting scenario", error);
        }
    };

    const handleCopyTranscript = async () => {
        const transcript = messages.map(m => `${m.role === 'user' ? 'Learner' : 'AI Partner'}: ${m.text}`).join('\n');
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

    // Filtered Scenarios
    const filteredScenarios = scenarios.filter(s => {
        const matchesLanguage = selectedLanguageFilter === 'All' || s.language === selectedLanguageFilter;
        const matchesDifficulty = selectedDifficultyFilter === 'All' || s.difficulty === selectedDifficultyFilter;
        return matchesLanguage && matchesDifficulty;
    });

    // Unique languages in loaded scenarios
    const availableLanguages = Array.from(new Set(scenarios.map(s => s.language || 'English')));

    // --- VIEW: Create Scenario ---
    if (view === 'create') {
        return (
            <div className="max-w-2xl mx-auto pb-24 md:pb-12 animate-fade-in">
                <button onClick={() => setView('list')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-sm">
                    <ArrowRight size={20} className="rotate-180" /> Back to Practice Scenarios
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">Create Language Scenario</h2>
                        <p className="text-slate-500 dark:text-slate-400">Design a custom language roleplay scenario using the AI Generator or manual builder.</p>
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

                    <div className="p-6 md:p-10">
                        {creationType === 'ai' ? (
                            <div className="space-y-6">
                                {/* Category Selection Mapped */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Practice Category</label>
                                    <div className="flex gap-2">
                                        {[
                                            { ui: 'Social Conversation', val: 'Sales' },
                                            { ui: 'Travel & Shopping', val: 'Support' },
                                            { ui: 'Professional & Business', val: 'Technical' }
                                        ].map(cat => (
                                            <button
                                                key={cat.val}
                                                type="button"
                                                onClick={() => setAiParams({...aiParams, category: cat.val as any})}
                                                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${
                                                    aiParams.category === cat.val 
                                                    ? 'bg-blue-50 border-blue-200 text-[#0500e2] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' 
                                                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {cat.ui}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Language and Dialect selection */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Language</label>
                                        <select 
                                            value={aiParams.language}
                                            onChange={(e) => setAiParams({...aiParams, language: e.target.value, dialect: e.target.value === 'Arabic' ? 'Modern Standard Arabic' : ''})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        >
                                            <option value="English">English</option>
                                            <option value="Chinese">Chinese</option>
                                            <option value="Danish">Danish</option>
                                            <option value="Dutch">Dutch</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Arabic">Arabic</option>
                                            <option value="Italian">Italian</option>
                                            <option value="Japanese">Japanese</option>
                                            <option value="Korean">Korean</option>
                                            <option value="Portuguese">Portuguese</option>
                                            <option value="Russian">Russian</option>
                                            <option value="Spanish">Spanish</option>
                                            <option value="Turkish">Turkish</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Dialect or Accent</label>
                                        {aiParams.language === 'Arabic' ? (
                                            <select 
                                                value={aiParams.dialect}
                                                onChange={(e) => setAiParams({...aiParams, dialect: e.target.value})}
                                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                            >
                                                <option value="Modern Standard Arabic">Modern Standard Arabic</option>
                                                <option value="Egyptian Arabic">Egyptian Arabic</option>
                                                <option value="Gulf Arabic">Gulf Arabic</option>
                                                <option value="Levantine Arabic">Levantine Arabic</option>
                                                <option value="Maghrebi Arabic">Maghrebi Arabic</option>
                                            </select>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={aiParams.dialect}
                                                onChange={(e) => setAiParams({...aiParams, dialect: e.target.value})}
                                                placeholder="e.g. Mexican, Castilian, Parisian"
                                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Partner Persona & Difficulty */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">AI Partner Persona</label>
                                        <input 
                                            type="text"
                                            value={aiParams.persona}
                                            onChange={(e) => setAiParams({...aiParams, persona: e.target.value})}
                                            placeholder="e.g. Patient language exchange partner, strict customs agent"
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Fluency Level</label>
                                        <select 
                                            value={aiParams.difficulty}
                                            onChange={(e) => setAiParams({...aiParams, difficulty: e.target.value})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        >
                                            <option value="Beginner">Beginner (A1 - A2)</option>
                                            <option value="Intermediate">Intermediate (B1 - B2)</option>
                                            <option value="Advanced">Advanced (C1 - C2)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Partner Mood Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">AI Partner Attitude</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Patient', 'Talkative', 'Direct', 'Shy', 'Distracted', 'Formal'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setAiParams({...aiParams, mood: m})}
                                                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                                                    aiParams.mood === m 
                                                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                {m === 'Patient' && <HelpCircle size={14} />}
                                                {m === 'Talkative' && <Smile size={14} />}
                                                {m === 'Direct' && <Zap size={14} />}
                                                {m === 'Shy' && <MinusCircle size={14} />}
                                                {m === 'Distracted' && <Meh size={14} />}
                                                {m === 'Formal' && <Award size={14} />}
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Description */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Conversational Topic</label>
                                        <button 
                                            onClick={handleAutoGenerateTopic}
                                            disabled={isGeneratingTopic}
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-[#0500e2]/10 text-[#0500e2] dark:text-[#4b53fa] dark:bg-[#4b53fa]/10 rounded-full font-bold hover:bg-[#0500e2]/20 dark:hover:bg-[#4b53fa]/20 transition-colors disabled:opacity-50"
                                        >
                                            {isGeneratingTopic ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            {isGeneratingTopic ? 'Generating...' : 'Auto-fill Topic'}
                                        </button>
                                    </div>
                                    <textarea 
                                        value={aiParams.topic}
                                        onChange={(e) => setAiParams({...aiParams, topic: e.target.value})}
                                        placeholder="Describe what situation you want to practice (e.g. negotiating rent for an apartment, purchasing train tickets at a window, talking to local doctors about flu symptoms...)"
                                        className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none resize-none text-sm"
                                    />
                                </div>

                                <button 
                                    onClick={handleGenerateScenario}
                                    disabled={isGenerating || !aiParams.topic}
                                    className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                    {isGenerating ? 'Generating Scenario...' : 'Create with AI'}
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
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        placeholder="e.g. Renting a Vespa in Rome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                    <textarea 
                                        value={manualParams.description || ''}
                                        onChange={(e) => setManualParams({...manualParams, description: e.target.value})}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        placeholder="Brief scenario details..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Language</label>
                                        <select 
                                            value={manualParams.language || 'Spanish'}
                                            onChange={(e) => setManualParams({...manualParams, language: e.target.value})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        >
                                            <option value="English">English</option>
                                            <option value="Chinese">Chinese</option>
                                            <option value="Danish">Danish</option>
                                            <option value="Dutch">Dutch</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Arabic">Arabic</option>
                                            <option value="Italian">Italian</option>
                                            <option value="Japanese">Japanese</option>
                                            <option value="Korean">Korean</option>
                                            <option value="Portuguese">Portuguese</option>
                                            <option value="Russian">Russian</option>
                                            <option value="Spanish">Spanish</option>
                                            <option value="Turkish">Turkish</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Dialect / Accent</label>
                                        <input 
                                            type="text"
                                            value={manualParams.dialect || ''}
                                            onChange={(e) => setManualParams({...manualParams, dialect: e.target.value})}
                                            placeholder="e.g. Parisian, Andalusian, Tokyo"
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                        <select 
                                            value={manualParams.difficulty}
                                            onChange={(e) => setManualParams({...manualParams, difficulty: e.target.value as any})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        >
                                            <option value="Beginner">Beginner (A1-A2)</option>
                                            <option value="Intermediate">Intermediate (B1-B2)</option>
                                            <option value="Advanced">Advanced (C1-C2)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                        <select 
                                            value={manualParams.category}
                                            onChange={(e) => setManualParams({...manualParams, category: e.target.value as any})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        >
                                            <option value="Sales">Social Conversation</option>
                                            <option value="Support">Travel & Shopping</option>
                                            <option value="Technical">Professional & Business</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Initial Partner Opener</label>
                                    <input 
                                        type="text"
                                        value={manualParams.initialMessage || ''}
                                        onChange={(e) => setManualParams({...manualParams, initialMessage: e.target.value})}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        placeholder="The first phrase the AI partner says..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">AI Partner Core Persona Instructions</label>
                                    <textarea 
                                        value={manualParams.systemInstruction || ''}
                                        onChange={(e) => setManualParams({...manualParams, systemInstruction: e.target.value})}
                                        className="w-full h-32 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        placeholder="Instructions for the AI partner: 'You are a warm coffee shop barista in Paris. Talk casually but speak only French...'"
                                    />
                                </div>
                                <button 
                                    onClick={handleCreateManual}
                                    className="w-full py-4 bg-[#0500e2] text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-[#0400c0] transition-all"
                                >
                                    Create Manual Scenario
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'briefing') {
        if (!activeScenario) {
            setView('list');
            return null;
        }
        
        const scenarioHistory = history.filter(h => h.customerName === `Roleplay: ${activeScenario.title}`);
        const bestScore = scenarioHistory.reduce((max, curr) => Math.max(max, curr.overallScore), 0);
        const attempts = scenarioHistory.length;

        return (
            <PreSessionBriefing 
                scenario={activeScenario}
                mode={mode}
                onStart={confirmStartSession}
                onBack={() => setView('list')}
                bestScore={bestScore > 0 ? bestScore : undefined}
                attempts={attempts}
            />
        );
    }

    if (view === 'active') {
        if (!activeScenario) {
            setView('list');
            return null;
        }

        if (isAnalyzing) {
            return (
                <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg animate-fade-in">
                    <div className="text-center p-8 max-w-md">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Languages size={40} className="text-[#0500e2] animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Fluency & Skills</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Our advanced language engine is grading your vocabulary range, grammatical correctness, structural fluency, and comprehension. This will take just a few seconds...
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="h-[calc(100dvh-130px)] md:h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-900 rounded-xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Clean Header */}
                <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-indigo-600`}>
                            <Globe size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[200px] md:max-w-md">{activeScenario.title}</h3>
                            <div className="text-xs text-slate-500 truncate">
                                {activeScenario.language} Practice • {activeScenario.difficulty} Level
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        {/* Timer */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm font-medium text-slate-600 dark:text-slate-300">
                            <Clock size={14} />
                            {formatTime(sessionDuration)}
                        </div>

                        {mode === 'voice' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse border border-red-100 dark:border-red-900/50">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Speaking
                            </div>
                        )}

                        <button 
                            onClick={endSession}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm"
                        >
                            Complete Session
                        </button>
                    </div>
                </div>

                {connectionError && (
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-900/50 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">{connectionError}</span>
                        <button 
                            onClick={() => confirmStartSession()}
                            className="ms-auto text-xs bg-white dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Conversation Chat Bubbles */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-900 scroll-smooth pb-2">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                {mode === 'voice' ? <Mic size={24} /> : <MessageSquare size={24} />}
                            </div>
                            <p className="text-sm font-medium">Practice Room Connected</p>
                            <p className="text-xs mt-1">
                                {mode === 'voice' ? "Speak clearly to introduce yourself..." : "Type your greeting to Lucas in the target language!"}
                            </p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 text-sm md:text-base shadow-sm whitespace-pre-wrap leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-[#0500e2] text-white rounded-be-sm' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bs-sm'
                            }`}>
                                <div className="text-xs opacity-60 mb-1 font-bold">
                                    {msg.role === 'user' ? 'You' : `${activeScenario.title.split(':')[1]?.trim() || 'Partner'}`}
                                </div>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 safe-area-bottom">
                    {mode === 'text' ? (
                        <div className="relative flex gap-2 md:gap-3 items-end max-w-4xl mx-auto">
                            <div className="flex-1 relative">
                                <textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Type in ${activeScenario.language || 'target language'}...`}
                                    className="w-full py-3.5 ps-4 pe-12 bg-slate-100 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-[#0500e2] dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-900 outline-none rounded-2xl text-sm md:text-base resize-none max-h-32 min-h-[48px] overflow-y-auto leading-relaxed"
                                    rows={1}
                                />
                                <div className="absolute right-3 bottom-3 text-xs text-slate-400 font-bold">
                                    {wordCount}/24
                                </div>
                            </div>
                            <button 
                                onClick={sendMessage}
                                disabled={!input.trim() || isOverLimit}
                                className="p-3.5 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-2xl disabled:opacity-40 transition-colors shadow-md shrink-0"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto text-center py-6">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse relative">
                                <Mic size={36} />
                                <span className="absolute inset-0 rounded-full ring-4 ring-red-400/20 animate-ping"></span>
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white">Active Speaking Call</p>
                            <p className="text-xs text-slate-500 mt-1">Speak clearly in the target language. Your conversational partner is listening.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW: Practice Scorecard Result ---
    if (view === 'result') {
        if (!result) return null;

        const getMetricWeight = (name: string) => {
            const weights: Record<string, string> = {
                'Task Completion': '40% Weight',
                'Fluency': '20% Weight',
                'Pronunciation': '15% Weight',
                'Vocabulary': '15% Weight',
                'Grammar': '10% Weight'
            };
            return weights[name] || '';
        };

        return (
            <div className="max-w-4xl mx-auto pb-24 animate-fade-in px-4">
                {/* Result header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white">Practice Scorecard</h2>
                    <button 
                        onClick={() => setView('list')} 
                        className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold rounded-xl text-sm transition-colors"
                    >
                        Return to Hub
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Overall Score */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] text-center shadow-md relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fluency Score</p>
                        <p className="text-6xl font-serif font-black text-emerald-600 mb-2">{result.score}%</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                            Grade: {result.score >= 90 ? 'Fluent (C2)' : result.score >= 75 ? 'Proficient (B2)' : 'Learner (A2)'}
                        </p>
                    </div>

                    {/* Stats feedback */}
                    <div className="bg-slate-900 text-white rounded-[2rem] p-8 col-span-2 shadow-xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                XP Earned
                            </span>
                            <h3 className="text-3xl font-serif font-black text-emerald-400 mt-2">+{Math.round(result.score * 1.2) + 60} XP</h3>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed mt-4">
                            You completed <strong>{formatTime(sessionDuration)}</strong> of intensive speech practice! Complete daily challenges to grow your global fluency streak.
                        </p>
                    </div>
                </div>

                {/* Scorecard Detailed Metrics */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-lg space-y-8 mb-8">
                    <div>
                        <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white mb-2">Language Skills Evaluation</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Detailed feedback on grammar, syntax, conversational vocabulary, and flow.</p>
                    </div>

                    <div className="space-y-6">
                        {result.criteriaResults.map((crit, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                            {crit.name}
                                        </h4>
                                        <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider mt-0.5">
                                            {getMetricWeight(crit.name)}
                                        </span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        crit.score >= 85 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                        crit.score >= 70 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                        'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                    }`}>
                                        {crit.score}/100
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    <p><strong>Reasoning:</strong> {crit.reasoning}</p>
                                    <p className="text-indigo-600 dark:text-indigo-400"><strong>Coaching Tip:</strong> {crit.suggestion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversation Breakdown Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-lg space-y-8 mb-8">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-2">Conversation Breakdown</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Key strengths, grammar/vocabulary mistakes, and natural local phrasings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400 font-bold">
                                <CheckCircle size={20} />
                                <h4>Strengths</h4>
                            </div>
                            {result.strengths && result.strengths.length > 0 ? (
                                <ul className="space-y-3">
                                    {result.strengths.map((strength, sIdx) => (
                                        <li key={sIdx} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                            <span className="text-emerald-500 font-bold select-none">•</span>
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-400">No specific strengths captured.</p>
                            )}
                        </div>

                        {/* Mistakes */}
                        <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4 text-rose-700 dark:text-rose-400 font-bold">
                                <X size={20} className="text-rose-500" />
                                <h4>Mistakes & Adjustments</h4>
                            </div>
                            {result.mistakes && result.mistakes.length > 0 ? (
                                <ul className="space-y-3">
                                    {result.mistakes.map((mistake, mIdx) => (
                                        <li key={mIdx} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                            <span className="text-rose-500 font-bold select-none">•</span>
                                            <span>{mistake}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-400">No major mistakes detected.</p>
                            )}
                        </div>
                    </div>

                    {/* Native Alternatives */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400 font-bold">
                            <Sparkles size={18} />
                            <h4>Native Speaker Alternatives</h4>
                        </div>
                        {result.nativeAlternatives && result.nativeAlternatives.length > 0 ? (
                            <div className="space-y-4">
                                {result.nativeAlternatives.map((alt, aIdx) => (
                                    <div key={aIdx} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 border border-slate-100 dark:border-slate-800/80">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">What You Said</p>
                                                <p className="text-sm text-rose-600 dark:text-rose-400 font-mono line-through bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-rose-500/10">
                                                    "{alt.original}"
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">What a Native Would Say</p>
                                                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
                                                    "{alt.better}"
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                            <strong className="text-indigo-500">Why?</strong> {alt.explanation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">No phrasing alternatives suggested for this session.</p>
                        )}
                    </div>
                </div>

                {/* AI Assessment */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-lg space-y-6">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-1">AI Teacher Assessment</h3>
                        <p className="text-slate-500 text-sm">General summaries of conversational strengths and next exercises.</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{result.feedback}</p>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: Scenarios Hub / List ---
    return (
        <div className="max-w-7xl mx-auto pb-12 px-4 md:px-8 animate-fade-in">
            {/* Header section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-8 md:p-12 shadow-xl border border-indigo-800/20 mb-8 md:mb-12">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-200 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-indigo-500/30">
                            <Languages size={12} /> AI Language Practice Lounge
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif font-black leading-tight mb-3">
                            Become Fluent, One Conversation at a Time.
                        </h1>
                        <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                            Practice speaking and chatting in real-life situations with adaptive AI companions. Learn at your own pace and receive customized feedback on grammar, syntax, vocabulary, and pronunciation.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setView('create')} 
                        className="px-6 py-4 bg-white text-indigo-950 hover:bg-slate-100 rounded-2xl font-black text-sm md:text-base shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 self-start md:self-center shrink-0"
                    >
                        <Plus size={18} /> New Scenario
                    </button>
                </div>
            </div>

            {/* Quick Stats banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 md:mb-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Fluency XP Earned</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{totalXP} XP</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Practice Score</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{avgScore}%</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sessions Completed</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{totalAttempts} Sessions</p>
                    </div>
                </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('scenarios')} 
                        className={`pb-2 font-bold text-sm transition-colors relative ${activeTab === 'scenarios' ? 'text-[#0500e2] dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Conversational Scenarios
                        {activeTab === 'scenarios' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#0500e2]"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        className={`pb-2 font-bold text-sm transition-colors relative ${activeTab === 'history' ? 'text-[#0500e2] dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Practice Log
                        {activeTab === 'history' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#0500e2]"></span>}
                    </button>
                </div>

                {activeTab === 'scenarios' && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <select 
                            value={selectedLanguageFilter}
                            onChange={(e) => setSelectedLanguageFilter(e.target.value)}
                            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none text-slate-600 dark:text-slate-300"
                        >
                            <option value="All">All Languages</option>
                            {availableLanguages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedDifficultyFilter}
                            onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
                            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none text-slate-600 dark:text-slate-300"
                        >
                            <option value="All">All Levels</option>
                            <option value="Beginner">Beginner (A1-A2)</option>
                            <option value="Intermediate">Intermediate (B1-B2)</option>
                            <option value="Advanced">Advanced (C1-C2)</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Scenarios Grid Tab */}
            {activeTab === 'scenarios' ? (
                isLoadingScenarios ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <Loader2 className="animate-spin text-[#0500e2] mb-4" size={32} />
                        <p className="text-sm font-medium">Loading practice lounge...</p>
                    </div>
                ) : filteredScenarios.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-400 text-sm">No scenarios match your language/level filters.</p>
                        <button 
                            onClick={() => { setSelectedLanguageFilter('All'); setSelectedDifficultyFilter('All'); }}
                            className="mt-3 text-xs text-[#0500e2] hover:underline font-bold"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredScenarios.map((scenario) => {
                            // UI Mapped Categories
                            const uiCategory = 
                                scenario.category === 'Sales' ? 'Social Conversation' : 
                                scenario.category === 'Support' ? 'Travel & Shopping' : 'Professional & Business';

                            const levelLabel = 
                                scenario.difficulty === 'Beginner' ? 'Beginner (A1-A2)' :
                                scenario.difficulty === 'Intermediate' ? 'Intermediate (B1-B2)' : 'Advanced (C1-C2)';

                            const IconComponent = 
                                scenario.category === 'Sales' ? MessageSquare : 
                                scenario.category === 'Support' ? Globe : Building2;

                            return (
                                <div 
                                    key={scenario.id} 
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Header card info */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                                <IconComponent size={20} />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                                                    {scenario.language || 'English'}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    scenario.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                                    scenario.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                                                    'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                                }`}>
                                                    {scenario.difficulty}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title & description */}
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2">
                                            {scenario.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">
                                            {uiCategory}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-6">
                                            {scenario.description}
                                        </p>
                                    </div>

                                    {/* Action items */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end">
                                        {user && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); confirmDelete(scenario.id, e); }}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete Custom Scenario"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => selectScenario(scenario, 'text')}
                                            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs rounded-xl transition-colors"
                                        >
                                            Chat
                                        </button>
                                        <button 
                                            onClick={() => selectScenario(scenario, 'voice')}
                                            className="px-3.5 py-2 bg-[#0500e2] hover:bg-[#0400c0] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1"
                                        >
                                            <Mic size={12} /> Call
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* History Tab */
                languageHistory.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-400 text-sm">No practice logs found. Complete a conversational scenario to begin tracking your fluency.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                                <thead className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Date</th>
                                        <th scope="col" className="px-6 py-4">Target Language / Roleplay</th>
                                        <th scope="col" className="px-6 py-4">Detailed Performance</th>
                                        <th scope="col" className="px-6 py-4 text-right">Fluency Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {languageHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {item.customerName?.replace('Roleplay:', '') || 'Custom Practice'}
                                                </div>
                                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                                    {item.agentName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="line-clamp-2 leading-relaxed text-slate-600 dark:text-slate-300">
                                                    {item.summary?.replace('Training Session', 'Practice Session')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-base font-black text-slate-900 dark:text-white">
                                                <span className={`px-3 py-1.5 rounded-xl font-black ${
                                                    item.overallScore >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                                    item.overallScore >= 75 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                                                    'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                                }`}>
                                                    {item.overallScore}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
