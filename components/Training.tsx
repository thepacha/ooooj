
import React, { useState, useRef, useEffect } from 'react';
import { TrainingScenario, TrainingResult, User, AnalysisResult, CriteriaResult } from '../types';
import { createTrainingSession, evaluateTrainingSession, connectLiveTraining, generateAIScenario, generateTrainingTopic, GenerateScenarioParams } from '../services/geminiService';
import { Shield, TrendingUp, Wrench, ArrowRight, RefreshCw, CheckCircle, Loader2, Send, Phone, PhoneOff, MessageSquare, Copy, Check, Plus, Sparkles, X, Calendar, Trash2, AlertTriangle, HelpCircle, Heart, Zap, Trophy, Target, Frown, Meh, Smile, MinusCircle, Clock, FileText, BarChart3, Timer, Mic, Building2, ChevronRight } from 'lucide-react';
import { incrementUsage, COSTS, checkLimit } from '../lib/usageService';
import { generateId } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { PreSessionBriefing } from './PreSessionBriefing';

// Define local interface for Audio Data to avoid SDK import conflicts
interface AudioDataPart {
  mimeType: string;
  data: string;
}

interface TrainingProps {
    user: User | null;
    history: AnalysisResult[];
    onAnalysisComplete: (result: AnalysisResult) => void;
}

// --- Procedural Generation Data (Kept same as before for variety) ---
const NAMES_MALE = ["James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Edward", "Ronald", "Ryan", "Gary", "Jacob", "Eric", "Stephen"];
const NAMES_FEMALE = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const PRODUCTS = ["Cloud CRM", "Video Editor Pro", "HR Payroll System", "Inventory Tracker", "Email Marketing Tool", "Project Management Suite", "Cybersecurity Shield", "VoIP Phone System", "Analytics Dashboard", "Payment Gateway"];
const ROLES = ["Marketing Manager", "Freelance Designer", "Small Business Owner", "CTO", "Sales VP", "Accountant", "Developer", "Operations Director", "CEO", "Office Admin"];
const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];

const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Function to generate fresh scenarios on every load
const generateDynamicScenarios = (): TrainingScenario[] => {
    
    // Helper to build a random persona with more variation
    const createPersona = (difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced') => {
        const isMale = Math.random() > 0.5;
        const firstName = getRandom(isMale ? NAMES_MALE : NAMES_FEMALE);
        const lastName = getRandom(LAST_NAMES);
        const name = `${firstName} ${lastName}`;
        const product = getRandom(PRODUCTS);
        const role = getRandom(ROLES);
        const price = Math.floor(Math.random() * 200) + 49;
        
        // Voice Mapping
        const voice = isMale 
            ? (Math.random() > 0.5 ? 'Fenrir' : 'Puck') 
            : (Math.random() > 0.5 ? 'Kore' : 'Aoede');

        // Randomly pick a category if not derived from constraints
        const categories = ['Sales', 'Support', 'Technical'] as const;
        const category = getRandom([...categories]);
        
        const difficulty = difficultyLevel || getRandom(['Beginner', 'Intermediate', 'Advanced'] as const);

        // --- Sales Templates ---
        if (category === 'Sales') {
            if (difficulty === 'Beginner') {
                return {
                    id: generateId(),
                    title: `Lead: ${name}`,
                    description: `${name}, a ${role}, is interested in ${product} but needs a basic overview of features vs price.`,
                    difficulty: 'Beginner',
                    category: 'Sales',
                    icon: 'TrendingUp',
                    initialMessage: `Hi, I'm looking at ${product} for my team. Can you give me a quick rundown of the main benefits?`,
                    systemInstruction: `You are ${name}. You are curious but budget-conscious. Ask about pricing early. Respond positively to value.`,
                    voice: voice as any,
                    objectives: ["Explain core value prop", "Qualify the lead", "Discuss pricing clearly"],
                    talkTracks: ["We can help you scale", "The ROI is typically..."],
                    openers: [
                        "\"I noticed you're looking for a CRM. What is your current solution lacking?\"",
                        "\"Many small businesses struggle with organization. Is that a challenge for you?\"",
                        "\"I can offer a quick demo to show you how easy it is to use.\"",
                        "\"Are you the primary decision maker for this purchase?\""
                    ]
                };
            } else if (difficulty === 'Advanced') {
                return {
                    id: generateId(),
                    title: `Negotiation: ${name}`,
                    description: `${name} wants to buy ${product} but is aggressively demanding a 30% discount or they walk.`,
                    difficulty: 'Advanced',
                    category: 'Sales',
                    icon: 'TrendingUp',
                    initialMessage: `I like the product, but $${price} is way too high. I can get a competitor for half that. Match it or I'm gone.`,
                    systemInstruction: `You are ${name}. You are a tough negotiator. Threaten to leave repeatedly. Only accept if they offer value add instead of just price drop.`,
                    voice: voice as any,
                    objectives: ["Stand firm on price", "Pivot to value", "Offer a non-monetary concession"],
                    talkTracks: ["Our quality is unmatched", "I can't lower the price, but..."],
                    openers: [
                        "\"I understand budget is a concern. Let's focus on the value this brings.\"",
                        "\"Competitors may be cheaper, but do they offer 24/7 support?\"",
                        "\"What is the cost of inaction if you choose a cheaper, less reliable tool?\"",
                        "\"I can't offer a discount, but I can include an extra user seat.\""
                    ]
                };
            } else {
                return {
                    id: generateId(),
                    title: `Skeptical: ${name}`,
                    description: `${name} has been burned by similar tools before. They doubt ${product} will actually work for them.`,
                    difficulty: 'Intermediate',
                    category: 'Sales',
                    icon: 'TrendingUp',
                    initialMessage: `I've tried tools like ${product} before and they all failed. Why is yours any different?`,
                    systemInstruction: `You are ${name}. You are skeptical and cynical. Demand proof/case studies.`,
                    voice: voice as any,
                    objectives: ["Build trust", "Provide social proof", "Offer a risk-free trial"],
                    talkTracks: ["We are different because...", "Let me show you a case study"],
                    openers: [
                        "\"I appreciate your skepticism. Let me show you why we are different.\"",
                        "\"What specific issues did you face with previous tools?\"",
                        "\"We have a 99% retention rate. Would you like to see a case study?\"",
                        "\"I can offer a 14-day risk-free trial so you can see for yourself.\""
                    ]
                };
            }
        }

        // --- Technical Templates ---
        if (category === 'Technical') {
            const error = `Error ${Math.floor(Math.random() * 500) + 400}`;
            if (difficulty === 'Beginner') {
                return {
                    id: generateId(),
                    title: `Login Issue: ${name}`,
                    description: `${name} locked themselves out of ${product} and doesn't know how to reset the password.`,
                    difficulty: 'Beginner',
                    category: 'Technical',
                    icon: 'Wrench',
                    initialMessage: `I can't get into my account. It says 'Invalid Credentials' but I know I'm typing it right!`,
                    systemInstruction: `You are ${name}. You are slightly frustrated but cooperative. You have Caps Lock on by accident.`,
                    voice: voice as any,
                    objectives: ["Verify identity", "Check for simple errors (Caps Lock)", "Guide through reset"],
                    talkTracks: ["Let's try one more time", "Check your keyboard"],
                    openers: [
                        "\"Don't worry, we'll get you back in. Are you using the correct email?\"",
                        "\"Can you check if your Caps Lock key is on?\"",
                        "\"Let's try resetting your password together.\"",
                        "\"I can send you a password reset link right now.\""
                    ]
                };
            } else {
                return {
                    id: generateId(),
                    title: `API Fail: ${name}`,
                    description: `${name} is integrating your API and getting ${error}. They claim your documentation is wrong.`,
                    difficulty: 'Advanced',
                    category: 'Technical',
                    icon: 'Wrench',
                    initialMessage: `Your documentation is garbage. I'm hitting the endpoint exactly as described and getting ${error}. Fix it.`,
                    systemInstruction: `You are ${name}, a Developer. You are arrogant and impatient. You actually missed a header. Refuse to check unless asked politely.`,
                    voice: voice as any,
                    objectives: ["Don't take insults personally", "Verify their request format", "Spot the missing header"],
                    talkTracks: ["Can you share the request body?", "Let's debug this together"],
                    openers: [
                        "\"I understand your frustration. Can you share the exact request you are sending?\"",
                        "\"Let's look at the logs together to find the issue.\"",
                        "\"I assure you our documentation is tested, but let's verify your specific case.\"",
                        "\"Could you please copy and paste the error response here?\""
                    ]
                };
            }
        }

        // --- Support Templates (Default) ---
        if (difficulty === 'Advanced') {
            return {
                id: generateId(),
                title: `Crisis: ${name}`,
                description: `${name} claims ${product} deleted their data before a major presentation. They are panicking.`,
                difficulty: 'Advanced',
                category: 'Support',
                icon: 'Shield',
                initialMessage: `MY DATA IS GONE. ALL OF IT. I have a presentation in 20 minutes! restore it NOW!`,
                systemInstruction: `You are ${name}. You are PANICKING. Scream (use caps). Demand immediate results.`,
                voice: voice as any,
                objectives: ["De-escalate panic", "Check trash/archive", "Reassure the user"],
                talkTracks: ["Take a deep breath", "I can check the backups"],
                openers: [
                    "\"I can hear how stressed you are. I am going to make this my top priority.\"",
                    "\"Please try to stay calm. We have backups and I will check them now.\"",
                    "\"I understand the urgency. Let's check the trash folder first.\"",
                    "\"I'm here to help. Can you tell me exactly what you were doing before it disappeared?\""
                ]
            };
        } else {
            return {
                id: generateId(),
                title: `Refund: ${name}`,
                description: `${name} wants a refund for ${product} because they didn't use it. It's past the policy window.`,
                difficulty: 'Intermediate',
                category: 'Support',
                icon: 'Shield',
                initialMessage: `I realized I haven't used ${product} in 3 months. I want those months refunded please.`,
                systemInstruction: `You are ${name}. You feel entitled to the refund. If refused, threaten bad reviews.`,
                voice: voice as any,
                objectives: ["Explain policy firmly", "Empathize with the loss", "Offer future credit instead"],
                talkTracks: ["I understand you didn't use it", "Our policy states..."],
                openers: [
                    "\"I understand you'd like a refund. Let me check your account details.\"",
                    "\"I see you haven't logged in recently. Unfortunately, our policy is...\"",
                    "\"I can't refund the past months, but I can cancel your subscription moving forward.\"",
                    "\"Would you be interested in a credit for future use instead?\""
                ]
            };
        }
    };

    // Generate 3 distinct scenarios with varied difficulties
    const scenarios = [
        createPersona('Beginner'),
        createPersona('Intermediate'),
        createPersona('Advanced')
    ];

    return scenarios as TrainingScenario[];
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
    category: 'Sales' | 'Support' | 'Technical';
    funnelStage: string;
    persona: string;
    mood: string;
    industry: string;
}

export const Training: React.FC<TrainingProps> = ({ user, history, onAnalysisComplete }) => {
    const [view, setView] = useState<'list' | 'briefing' | 'active' | 'result' | 'create'>('list');
    const [activeTab, setActiveTab] = useState<'scenarios' | 'history'>('scenarios');
    const [activeScenario, setActiveScenario] = useState<TrainingScenario | null>(null);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false); // New explicit analysis state
    const [result, setResult] = useState<TrainingResult | null>(null);
    const [mode, setMode] = useState<'text' | 'voice'>('text');
    const [isCopied, setIsCopied] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0); // Timer State
    
    // Combined Scenario State
    const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
    
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

    // Creation State
    const [creationType, setCreationType] = useState<'manual' | 'ai'>('ai');
    const [aiParams, setAiParams] = useState<AIParamsState>({ 
        topic: '', 
        difficulty: 'Intermediate', 
        category: 'Sales', 
        funnelStage: 'Discovery',
        persona: '',
        mood: 'Neutral',
        industry: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
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

    // Derived state for input limits
    const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length;
    const isOverLimit = wordCount > 24;

    // Load Scenarios Logic
    useEffect(() => {
        if (!user) {
            setScenarios(generateDynamicScenarios());
            return;
        }

        const fetchAndSeedScenarios = async () => {
            setIsLoadingScenarios(true);
            try {
                const { data, error } = await supabase
                    .from('scenarios')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error && error.code !== '42P01') throw error;

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
                        objectives: s.objectives || [],
                        talkTracks: s.talk_tracks || [],
                        openers: s.openers || []
                    }));
                    setScenarios(mapped);
                } else {
                    const seedBatch = generateDynamicScenarios();
                    await saveScenariosToDb(seedBatch, user.id);
                    setScenarios(seedBatch);
                }
            } catch (e) {
                console.error("Error loading/seeding scenarios:", e);
                setScenarios(generateDynamicScenarios());
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
            voice: s.voice
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
            // Use description as context if available for better continuity, otherwise title
            const context = scenario.description || scenario.title;

            const newVersion = await generateAIScenario({
                topic: context,
                category: scenario.category,
                difficulty: scenario.difficulty,
                funnelStage: '',
                persona: '',
                mood: '',
                industry: ''
            });
            
            const updates = {
                title: newVersion.title, // Update title too as name changes
                description: newVersion.description,
                initial_message: newVersion.initialMessage,
                system_instruction: newVersion.systemInstruction,
                voice: newVersion.voice,
                objectives: newVersion.objectives,
                talk_tracks: newVersion.talkTracks,
                openers: newVersion.openers
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
                ? { ...s, ...newVersion } 
                : s
            ));

        } catch (e: any) {
            console.error("Failed to regenerate custom scenario", e);
            alert(`Failed to regenerate scenario: ${e.message || 'Unknown error'}`);
        } finally {
            setRegeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(scenario.id);
                return next;
            });
        }
    };
    
    const trainingHistory = history.filter(h => h.customerName?.startsWith('Roleplay:') || h.summary?.startsWith('Training Session'));
    const totalAttempts = trainingHistory.length;
    const totalXP = trainingHistory.reduce((acc, curr) => acc + (curr.overallScore * 10) + 50, 0);

    const selectScenario = (scenario: TrainingScenario, sessionMode: 'text' | 'voice') => {
        setActiveScenario(scenario);
        setMode(sessionMode);
        setView('briefing');
    };

    const confirmStartSession = async () => {
        if (!activeScenario) return;
        
        if (!process.env.API_KEY) {
            alert("API Key is missing. Please check your configuration.");
            return;
        }

        if (user) {
             const canProceed = await checkLimit(user.id, COSTS.CHAT * 5); 
             if (!canProceed) {
                 alert("Insufficient credits for training session.");
                 return;
             }
        }

        // MODIFIED: Start with empty messages so the user can greet first.
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

    const startVoiceConnection = async (scenario: TrainingScenario) => {
        setIsVoiceActive(true);
        setConnectionError(null);
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';
        nextStartTime.current = 0;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error("Audio Context not supported");
            }

            inputAudioContext.current = new AudioContextClass({sampleRate: 16000});
            outputAudioContext.current = new AudioContextClass({sampleRate: 24000});
            
            // MODIFIED: Explicitly resume audio context to prevent start delay on some browsers
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
                    console.log("Voice Session Open");
                    if (!inputAudioContext.current) return;
                    
                    const source = inputAudioContext.current.createMediaStreamSource(stream);
                    // MODIFIED: Reduced buffer size to 2048 for lower latency (approx 128ms @ 16kHz)
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
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                    } else if (message.serverContent?.inputTranscription) {
                        currentInputTranscription.current += message.serverContent.inputTranscription.text;
                    }

                    if (message.serverContent?.turnComplete) {
                        const userText = currentInputTranscription.current;
                        const modelText = currentOutputTranscription.current;
                        
                        // IMPORTANT: Only update if we have meaningful text to avoid empty bubbles or repetition
                        if (userText.trim()) {
                            setMessages(prev => {
                                // De-duplicate: Don't add if it's identical to the last user message (fixes stutter)
                                const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
                                if (lastUserMsg && lastUserMsg.text === userText) return prev;
                                return [...prev, {role: 'user', text: userText}];
                            });
                        }
                        if (modelText.trim()) {
                            setMessages(prev => [...prev, {role: 'model', text: modelText}]);
                        }

                        currentInputTranscription.current = '';
                        currentOutputTranscription.current = '';
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContext.current) {
                        const ctx = outputAudioContext.current;
                        // Ensure playback context is running
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
                    setConnectionError("Voice session disconnected. Please check your network connection.");
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
            console.error("Chat session is not ready or is in voice mode.");
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
                    errorText = "⚠️ Network Error: Unable to reach AI service. Please check your internet connection.";
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
        
        // 1. Immediately Stop Audio/Chat
        if (mode === 'voice') {
            stopVoiceSession();
        }
        
        // 2. Set Analysis State (Shows Loading Screen immediately)
        setIsAnalyzing(true);
        
        const transcript = messages.map(m => `${m.role === 'user' ? 'Agent' : 'Customer'}: ${m.text}`).join('\n');
        
        try {
            // 3. Process Result
            const evalResult = await evaluateTrainingSession(transcript, activeScenario);
            setResult(evalResult);
            
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
                await incrementUsage(user.id, COSTS.ANALYSIS, 'analysis'); 
            }
            
            // 4. Switch to Result View
            setView('result');
        } catch (e) {
            console.error(e);
            alert("Failed to evaluate session.");
            setIsAnalyzing(false); // Only reset if error, otherwise view change handles it
        }
    };

    const handleGenerateScenario = async () => {
        if (!aiParams.topic) return;
        setIsGenerating(true);
        try {
            const generated = await generateAIScenario(aiParams);
            const newScenario: TrainingScenario = {
                ...generated,
                id: generateId(),
                icon: (aiParams.category === 'Sales' ? 'TrendingUp' : aiParams.category === 'Technical' ? 'Wrench' : 'Shield'),
            };

            if (user) {
                await saveScenariosToDb([newScenario], user.id);
            }

            setScenarios(prev => [newScenario, ...prev]); 
            setView('list');
        } catch (e) {
            console.error(e);
            alert("Failed to generate scenario. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutoGenerateTopic = async () => {
        setIsGeneratingTopic(true);
        try {
            const topic = await generateTrainingTopic();
            setAiParams(prev => ({...prev, topic}));
        } catch (e) {
            console.error("Failed to auto-generate topic", e);
        } finally {
            setIsGeneratingTopic(false);
        }
    };

    const handleCreateManual = async () => {
        if (!manualParams.title || !manualParams.initialMessage || !manualParams.systemInstruction) {
            alert("Please fill in all required fields.");
            return;
        }
        
        const genericObjectives = [
            "Resolve the issue efficiently.",
            "Maintain a professional and empathetic tone.",
            "Follow standard procedures.",
            "Ensure the customer feels heard.",
            "Verify the solution before closing."
        ];
        
        const genericTalkTracks = [
            "I understand how frustrating this must be.",
            "I'm here to help you with this.",
            "Let's figure this out together.",
            "Thank you for your patience.",
            "Is there anything else I can help with?",
            "I appreciate you bringing this to my attention."
        ];
        
        const genericOpeners = [
            "\"How can I help you today?\"",
            "\"I'd be happy to assist with that.\"",
            "\"Can you provide your account details?\"",
            "\"Let's take a look at what's going on.\""
        ];

        const newScenario: TrainingScenario = {
            id: generateId(),
            title: manualParams.title!,
            description: manualParams.description || '',
            difficulty: (manualParams.difficulty as any) || 'Intermediate',
            category: (manualParams.category as any) || 'Support',
            icon: 'Shield',
            initialMessage: manualParams.initialMessage!,
            systemInstruction: manualParams.systemInstruction!,
            voice: 'Puck',
            objectives: genericObjectives,
            talkTracks: genericTalkTracks,
            openers: genericOpeners
        };

        if (user) {
            await saveScenariosToDb([newScenario], user.id);
        }

        setScenarios(prev => [newScenario, ...prev]);
        setView('list');
    }

    const handleDeleteScenario = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (!window.confirm("Delete this scenario?")) return;

        setScenarios(prev => prev.filter(s => s.id !== id));

        const { error } = await supabase.from('scenarios').delete().eq('id', id);
        if (error) {
            console.error("Error deleting scenario", error);
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

    // --- VIEW: Create Scenario ---
    if (view === 'create') {
        return (
            <div className="max-w-2xl mx-auto pb-24 md:pb-12 animate-fade-in">
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

                    <div className="p-6 md:p-10">
                        {creationType === 'ai' ? (
                            <div className="space-y-6">
                                {/* Category Selection First */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                    <div className="flex gap-2">
                                        {(['Sales', 'Support', 'Technical'] as const).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setAiParams({...aiParams, category: cat})}
                                                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                                    aiParams.category === cat 
                                                    ? 'bg-blue-50 border-blue-200 text-[#0500e2] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' 
                                                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Industry Selection - NEW */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Industry / Sector</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {['SaaS', 'E-commerce', 'Healthcare', 'Retail', 'Fintech', 'Real Estate', 'Hospitality'].map(ind => (
                                            <button
                                                key={ind}
                                                onClick={() => setAiParams({...aiParams, industry: ind})}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                    aiParams.industry === ind
                                                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                                }`}
                                            >
                                                {ind}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative group">
                                        <Building2 size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            value={aiParams.industry}
                                            onChange={(e) => setAiParams({...aiParams, industry: e.target.value})}
                                            placeholder="Or type custom industry (e.g. Solar Energy)"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2] text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Sales Funnel Stage (Conditional) */}
                                {aiParams.category === 'Sales' && (
                                    <div className="animate-in fade-in slide-in-from-top-1">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sales Funnel Stage</label>
                                        <select 
                                            value={aiParams.funnelStage}
                                            onChange={(e) => setAiParams({...aiParams, funnelStage: e.target.value})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        >
                                            <option value="Prospecting">Prospecting / Cold Call</option>
                                            <option value="Discovery">Discovery & Needs Analysis</option>
                                            <option value="Demo">Product Demo / Presentation</option>
                                            <option value="Objection Handling">Objection Handling</option>
                                            <option value="Negotiation">Negotiation</option>
                                            <option value="Closing">Closing the Deal</option>
                                            <option value="Retention">Renewal / Retention</option>
                                        </select>
                                    </div>
                                )}

                                {/* Persona & Difficulty Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Buyer Persona</label>
                                        <input 
                                            type="text"
                                            value={aiParams.persona}
                                            onChange={(e) => setAiParams({...aiParams, persona: e.target.value})}
                                            placeholder={aiParams.category === 'Sales' ? "e.g. Skeptical CTO" : "e.g. Confused Grandmother"}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                        <select 
                                            value={aiParams.difficulty}
                                            onChange={(e) => setAiParams({...aiParams, difficulty: e.target.value})}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[#0500e2]"
                                        >
                                            <option value="Beginner">Beginner (Cooperative)</option>
                                            <option value="Intermediate">Intermediate (Typical)</option>
                                            <option value="Advanced">Advanced (Hostile/Complex)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Mood Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Buyer Mood</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Curious', 'Skeptical', 'Urgent', 'Frustrated', 'Happy', 'Indifferent'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setAiParams({...aiParams, mood: m})}
                                                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                                                    aiParams.mood === m 
                                                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                {m === 'Curious' && <HelpCircle size={14} />}
                                                {m === 'Skeptical' && <Meh size={14} />}
                                                {m === 'Urgent' && <Zap size={14} />}
                                                {m === 'Frustrated' && <Frown size={14} />}
                                                {m === 'Happy' && <Smile size={14} />}
                                                {m === 'Indifferent' && <MinusCircle size={14} />}
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Description */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Topic Context</label>
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
                                        placeholder="Describe the specific situation (e.g., Customer wants to upgrade but thinks the price is too high)"
                                        className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none resize-none text-sm"
                                    />
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        // Dedicated Loading Screen when analysis is running
        if (isAnalyzing) {
            return (
                <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
                    <div className="text-center p-8 max-w-md">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BarChart3 size={40} className="text-[#0500e2] animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Generating Performance Report</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Our AI is analyzing your conversation for tone, empathy, and solution accuracy. This typically takes 5-10 seconds.
                        </p>
                    </div>
                </div>
            )
        }

        return (
            <div className="h-[calc(100dvh-130px)] md:h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-900 rounded-xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Clean Header */}
                <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                            activeScenario.category === 'Sales' ? 'bg-green-600' : 
                            activeScenario.category === 'Technical' ? 'bg-slate-700' : 'bg-red-600'
                        }`}>
                            {activeScenario.icon === 'TrendingUp' ? <TrendingUp size={20} /> : activeScenario.icon === 'Wrench' ? <Wrench size={20} /> : <Shield size={20} />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[200px] md:max-w-md">{activeScenario.title}</h3>
                            <div className="text-xs text-slate-500 truncate">{activeScenario.category} • {activeScenario.difficulty}</div>
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
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Live
                            </div>
                        )}

                        <button 
                            onClick={endSession}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm"
                        >
                            <span className="hidden sm:inline">End Session</span>
                            <span className="sm:hidden">End</span>
                        </button>
                    </div>
                </div>

                {connectionError && (
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-900/50 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">{connectionError}</span>
                        <button 
                            onClick={() => confirmStartSession()}
                            className="ml-auto text-xs bg-white dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-900 scroll-smooth pb-2">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                {mode === 'voice' ? <Mic size={24} /> : <MessageSquare size={24} />}
                            </div>
                            <p className="text-sm font-medium">Session Started</p>
                            <p className="text-xs mt-1">
                                {mode === 'voice' ? "Speak to greet the customer..." : "Type a message to start..."}
                            </p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 text-sm md:text-base shadow-sm whitespace-pre-wrap leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-[#0500e2] text-white rounded-br-sm' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 safe-area-bottom">
                    {mode === 'text' ? (
                        <div className="relative flex gap-2 md:gap-3 items-end max-w-4xl mx-auto">
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isOverLimit ? "Message too long!" : "Type your response..."}
                                    className={`w-full pl-5 pr-14 py-3 md:py-4 text-base rounded-2xl bg-slate-100 dark:bg-slate-950 border outline-none focus:ring-2 focus:ring-[#0500e2] transition-all ${
                                        isOverLimit ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-transparent focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                <div className={`absolute top-1/2 -translate-y-1/2 right-4 text-[10px] font-bold transition-colors ${isOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
                                    {wordCount}/24
                                </div>
                            </div>
                            <button 
                                onClick={sendMessage}
                                disabled={!input.trim() || isOverLimit}
                                className="p-4 bg-[#0500e2] text-white rounded-2xl hover:bg-[#0400c0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md h-[50px] md:h-[58px] w-[50px] md:w-[58px] flex items-center justify-center shrink-0"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                            <div className="text-center">
                                <p className="text-slate-900 dark:text-white font-bold text-lg mb-1 animate-pulse">Listening...</p>
                                <p className="text-slate-500 text-sm">Use "End Session" above when finished.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'result' && result) {
        return (
            <div className="max-w-5xl mx-auto pb-20 md:pb-12 animate-fade-in px-4 md:px-0">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Analysis</h2>
                    <button onClick={() => setView('list')} className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Close Report
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Score & Summary */}
                    <div className="space-y-6">
                        {/* Score Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Performance Score</p>
                            <div className={`text-6xl font-bold mb-2 ${result.score >= 90 ? 'text-emerald-600' : result.score >= 75 ? 'text-[#0500e2]' : 'text-amber-500'}`}>
                                {result.score}
                            </div>
                            <p className="text-slate-400 text-sm">out of 100</p>
                        </div>

                        {/* Session Duration Box - NEW */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                    <Timer size={20} />
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Session Duration</span>
                            </div>
                            <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{formatTime(sessionDuration)}</span>
                        </div>

                        {/* Executive Summary */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-slate-400" /> Executive Summary
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {result.feedback}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleCopyTranscript} className="flex-1 justify-center px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                                {isCopied ? <Check size={16} /> : <Copy size={16} />} Copy Transcript
                            </button>
                            <button onClick={() => activeScenario && selectScenario(activeScenario, mode)} className="flex-1 justify-center px-4 py-3 bg-[#0500e2] text-white rounded-xl font-bold text-sm hover:bg-[#0400c0] transition-colors flex items-center gap-2">
                                <RefreshCw size={16} /> Retry
                            </button>
                        </div>
                    </div>

                    {/* Middle Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Strengths & Weaknesses Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 p-6">
                                <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                    <CheckCircle size={18} /> Key Strengths
                                </h3>
                                <ul className="space-y-3">
                                    {result.strengths.map((s, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 p-6">
                                <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} /> Areas to Improve
                                </h3>
                                <ul className="space-y-3">
                                    {result.improvements.map((s, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Transcript Preview */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-sm text-slate-500">
                                Session Transcript
                            </div>
                            <div className="p-6 max-h-[300px] overflow-y-auto bg-white dark:bg-slate-900 font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {activeScenario && messages.map((m, i) => (
                                    <div key={i} className="mb-3">
                                        <span className={`font-bold ${m.role === 'user' ? 'text-[#0500e2]' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {m.role === 'user' ? 'Agent' : 'Customer'}:
                                        </span> {m.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: Scenario List (Default) ---
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-12">
             
             {/* New "AI Training Companion" Header */}
             <div className="bg-[#0500e2] rounded-[2.5rem] p-6 md:p-12 text-white relative overflow-hidden shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider mb-6">
                            <Sparkles size={12} className="text-yellow-300" /> AI-Powered Simulation
                        </div>
                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">
                            Master Every Conversation.
                        </h2>
                        <p className="text-blue-100 text-lg mb-8 max-w-md leading-relaxed">
                            Practice with realistic, adaptive AI personas that challenge your skills in Sales, Support, and Technical scenarios.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => setView('create')}
                                className="px-6 py-3.5 bg-white text-[#0500e2] rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
                            >
                                <Plus size={18} /> Create Custom Scenario
                            </button>
                        </div>
                    </div>

                    {/* Gamification Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-300">
                                    <Trophy size={24} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Total XP</span>
                            </div>
                            <div>
                                <span className="text-4xl font-bold text-white">{trainingHistory.reduce((acc, curr) => acc + (curr.overallScore * 10) + 50, 0).toLocaleString()}</span>
                                <p className="text-sm text-blue-200 mt-1">Experience Points Earned</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                                <div className="p-2 bg-emerald-400/20 rounded-lg text-emerald-300">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {trainingHistory.length > 0 
                                            ? Math.round(trainingHistory.reduce((acc, curr) => acc + curr.overallScore, 0) / trainingHistory.length) 
                                            : 0}%
                                    </p>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wide">Avg Performance</p>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                                <div className="p-2 bg-blue-400/20 rounded-lg text-blue-300">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{trainingHistory.length}</p>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wide">Total Attempts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('scenarios')}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'scenarios' ? 'text-[#0500e2] border-[#0500e2]' : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
                >
                    Active Scenarios
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'text-[#0500e2] border-[#0500e2]' : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
                >
                    Training History
                </button>
             </div>

             {activeTab === 'scenarios' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2">
                    {isLoadingScenarios && (
                        <div className="col-span-full py-12 flex justify-center text-slate-400">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    )}

                    {!isLoadingScenarios && scenarios.map((scenario) => {
                        const Icon = scenario.icon === 'TrendingUp' ? TrendingUp : scenario.icon === 'Wrench' ? Wrench : Shield;
                        
                        return (
                            <div key={scenario.id} className="group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/30 transition-all duration-300 overflow-hidden">
                                
                                {/* Decorative Background Gradient (Subtle) */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-[4rem] transition-opacity group-hover:opacity-10 pointer-events-none ${
                                    scenario.category === 'Sales' ? 'from-green-500 to-emerald-600' : 
                                    scenario.category === 'Technical' ? 'from-slate-600 to-slate-800' : 
                                    'from-red-500 to-pink-600'
                                }`}></div>

                                <div className="p-7 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                                            scenario.category === 'Sales' ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20' : 
                                            scenario.category === 'Technical' ? 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-700/20' : 
                                            'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/20'
                                        }`}>
                                            <Icon size={26} strokeWidth={2} />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={(e) => handleRegenerateCustomScenario(scenario, e)}
                                                disabled={regeneratingIds.has(scenario.id)}
                                                className="p-2.5 text-slate-400 hover:text-[#0500e2] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group/regen relative"
                                                title="Regenerate this specific scenario (keeps topic, changes details)"
                                            >
                                                <RefreshCw size={18} className={regeneratingIds.has(scenario.id) ? "animate-spin text-[#0500e2]" : ""} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteScenario(scenario.id, e)}
                                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                title="Delete Scenario"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#0500e2] transition-colors line-clamp-1">
                                        {scenario.title}
                                    </h3>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-5">
                                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                            scenario.category === 'Sales' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' :
                                            scenario.category === 'Technical' ? 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' :
                                            'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                        }`}>
                                            {scenario.category}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                            scenario.difficulty === 'Beginner' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                            scenario.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                            'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
                                        }`}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>

                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 line-clamp-3 flex-1">
                                        {scenario.description}
                                    </p>

                                    {/* Action Grid */}
                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        <button 
                                            onClick={() => selectScenario(scenario, 'text')}
                                            className="py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                                        >
                                            <MessageSquare size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" /> Chat
                                        </button>
                                        <button 
                                            onClick={() => selectScenario(scenario, 'voice')}
                                            className="py-3 px-4 rounded-xl bg-[#0500e2] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0400c0] shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                        >
                                            <Phone size={16} /> Voice
                                        </button>
                                    </div>
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
                            <table className="w-full text-left border-collapse min-w-[600px]">
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
};
