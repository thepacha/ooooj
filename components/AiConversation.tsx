import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingScenario, TrainingResult, User, AnalysisResult, CriteriaResult } from '../types';
import { createTrainingSession, evaluateTrainingSession, connectLiveTraining, generateAIScenario, generateTrainingTopic, GenerateScenarioParams, getAI } from '../services/geminiService';
import { Shield, TrendingUp, Wrench, ArrowRight, RefreshCw, CheckCircle, Loader2, Send, Phone, PhoneOff, MessageSquare, Copy, Check, Plus, Sparkles, X, Calendar, Trash2, AlertTriangle, HelpCircle, Heart, Zap, Trophy, Target, Frown, Meh, Smile, MinusCircle, Clock, FileText, BarChart3, Timer, Mic, MicOff, Building2, ChevronRight, Globe, Award, Languages, BookOpen, Compass, Briefcase, Volume2, Pause, Square } from 'lucide-react';
import { incrementUsage, COSTS, checkLimit } from '../lib/usageService';
import { generateId, preprocessCartesiaText, stripAudioTags } from '../lib/utils';
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

const GEMINI_TO_CARTESIA_MAP: Record<string, Record<string, string>> = {
  'English': {
    Puck: '3d83e30f-c31b-4f26-b442-7075feafa53a', // Wade
    Charon: '56c7989e-7a5f-4d12-838f-e0f910e7356e', // Tristan
    Kore: 'c2ad7092-0447-47ea-948b-61fbb6faf153', // Grace
    Fenrir: '56c7989e-7a5f-4d12-838f-e0f910e7356e', // Tristan fallback
    Aoede: '2a12b36c-7f9b-4c3a-9f7a-72731b15323a', // Ella
  },
  'Chinese': {
    Puck: '7e2a44d1-76b8-42b8-9507-fedfe3a803c8', // Jian
    Charon: 'eda5bbff-1ff1-4886-8ef1-4e69a77640a0', // Kai
    Kore: '7a5d4663-88ae-47b7-808e-8f9b9ee4127b', // Hua
    Fenrir: 'eda5bbff-1ff1-4886-8ef1-4e69a77640a0', // Kai
    Aoede: 'bf32f849-7bc9-4b91-8c62-954588efcc30', // Lan
  },
  'Dutch': {
    Puck: 'af482421-80f4-4379-b00c-a118def29cde', // Lucas
    Charon: '4b250449-c635-4b63-bd1d-b654b12ffcd4', // Jeroen
    Kore: '225ba8cf-9fc2-4371-a78c-fe38ba38898a', // Anneliese
    Fenrir: '4b250449-c635-4b63-bd1d-b654b12ffcd4', // Jeroen
    Aoede: '0eb213fe-4658-45bc-9442-33a48b24b133', // Sanne
  },
  'French': {
    Puck: '0418348a-0ca2-4e90-9986-800fb8b3bbc0', // Antoine
    Charon: '93c98a2b-7d15-4f7b-8236-294b1e02b1c0', // Mathieu
    Kore: 'b6cbde9b-00e3-4a57-9955-0703001e3231', // Amélie
    Fenrir: '93c98a2b-7d15-4f7b-8236-294b1e02b1c0', // Mathieu
    Aoede: 'c96a7d7d-3457-4979-8665-522f7b3e36fb', // Léa
  },
  'German': {
    Puck: '42f14755-88c3-4124-aae3-5cc3a9618e8f', // Jan
    Charon: '2be00b67-d53f-4eb5-89e7-96c224d56fbc', // Dieter
    Kore: 'b9de4a89-2257-424b-94c2-db18ba68c81a', // Viktoria
    Fenrir: '2be00b67-d53f-4eb5-89e7-96c224d56fbc', // Dieter
    Aoede: '6d4b1416-8d54-4d94-a788-8a802c086544', // Sabine
  },
  'Italian': {
    Puck: 'e019ed7e-6079-4467-bc7f-b599a5dccf6f', // Luca
    Charon: '88b329db-85d7-47cc-a5c5-98225a756721', // Giuseppe
    Kore: '90c7d657-9599-4cd0-9ed2-2568359e4d1a', // Sofia
    Fenrir: '88b329db-85d7-47cc-a5c5-98225a756721', // Giuseppe
    Aoede: '36d94908-c5b9-4014-b521-e69aee5bead0', // Giulia
  },
  'Japanese': {
    Puck: '6b92f628-be90-497c-8f4c-3b035002df71', // Kenji
    Charon: '9436e723-612d-4114-aeb0-fa00d4d639bf', // Katsuya
    Kore: '31c55968-a9f4-4115-8831-3a16952179c8', // Ayumi
    Fenrir: '9436e723-612d-4114-aeb0-fa00d4d639bf', // Katsuya
    Aoede: '861213b7-f057-45c8-9527-0f4c144f1a03', // Haruka
  },
  'Korean': {
    Puck: 'f7755efb-1848-4321-aa22-5e5be5d32486', // Ryeowook
    Charon: '537a82ae-4926-4bfb-9aec-aff0b80a12a5', // Minho
    Kore: '4dd4630e-19e0-4243-bca0-676ff85119b7', // Haeun
    Fenrir: '537a82ae-4926-4bfb-9aec-aff0b80a12a5', // Minho
    Aoede: 'cac92886-4b7c-4bc1-a524-e0f79c0381be', // Yuna
  },
  'Portuguese': {
    Puck: 'b603811e-54c2-4a0a-8854-09eab9ffa63f', // Bruno
    Charon: '07b6f895-78b9-4921-8e10-8a21c99c2e8a', // Rafael
    Kore: 'c9611be8-aae9-4a93-bb1c-98dd6b7d52a4', // Isabella
    Fenrir: '07b6f895-78b9-4921-8e10-8a21c99c2e8a', // Rafael
    Aoede: '2f4d204f-a5dc-4196-81bc-155986b76ab6', // Mirella
  },
  'Russian': {
    Puck: '1e4176b1-3db9-44d6-a601-4fe68b041942', // Sergei
    Charon: '888b7df4-e165-4852-bfec-0ab2b96aaa46', // Dmitri
    Kore: '25b7aaa6-1670-42dc-b791-419322400803', // Daria
    Fenrir: '888b7df4-e165-4852-bfec-0ab2b96aaa46', // Dmitri
    Aoede: '7a62541e-5492-410e-95ff-3abd096fce87', // Natalia
  },
  'Spanish': {
    Puck: '3efb11f3-4c0e-43c2-bad5-85ab99e993e2', // Eduardo
    Charon: '4853bafa-52cc-48c8-86a1-1edf8c76e429', // Alonso
    Kore: '1cc00672-e9d4-455e-b3fb-31dfb7aad231', // Laura
    Fenrir: '4853bafa-52cc-48c8-86a1-1edf8c76e429', // Alonso
    Aoede: 'e5e5c8d7-3924-4ff6-981a-cb667034be29', // Regina
  },
  'Turkish': {
    Puck: '91e91d74-8eb4-43cd-97d3-7466c21db00d', // Aykut
    Charon: '5a31e4fb-f823-4359-aa91-82c0ae9a991c', // Murat
    Kore: 'bb2347fe-69e9-4810-873f-ffd759fe8420', // Aylin
    Fenrir: '5a31e4fb-f823-4359-aa91-82c0ae9a991c', // Murat
    Aoede: '8036098f-cff4-401e-bfba-f0a6a6e5e49b', // Elif
  },
  'Danish': {
    Puck: '926e0766-f380-4d77-aeb0-9aa4ebb16b38', // Soren
    Charon: 'a466f9e2-28eb-4bb7-925c-8e8984950700', // Søren
    Kore: 'c323c793-41f9-47b8-99dc-9b44b0440b84', // Katrine
    Fenrir: 'a466f9e2-28eb-4bb7-925c-8e8984950700', // Søren
    Aoede: 'eb929394-68e7-4e08-bd2f-e7055728a5e1', // Mette
  }
};

const getCartesiaVoiceId = (voiceName: string, language: string): string => {
    if (!voiceName) return 'c2ad7092-0447-47ea-948b-61fbb6faf153';
    if (voiceName.includes('-')) return voiceName; // Already a valid Cartesia UUID

    const cleanLang = language ? language.split(' ')[0] : 'English';
    const langMap = GEMINI_TO_CARTESIA_MAP[cleanLang] || GEMINI_TO_CARTESIA_MAP['English'];
    const resolvedId = langMap[voiceName] || langMap['Kore'] || 'c2ad7092-0447-47ea-948b-61fbb6faf153';
    return resolvedId;
};

const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Pre-configured Language Scenarios to seed for a beautiful user experience
const generateDefaultLanguageScenarios = (): TrainingScenario[] => {
    return [
        {
            id: generateId(),
            title: "First Meeting: Cafe Chat",
            description: "You are meeting a friendly language exchange partner, Lucas, at a cozy cafe. Keep it casual, practice introducing yourself, ask about his hobbies, and order a coffee in your target language.",
            difficulty: 'A1',
            category: 'Sales', // Maps internally to Sales (Social Conversation)
            icon: 'TrendingUp',
            initialMessage: "Hey there! I'm Lucas. Great to finally meet you in person! What would you like to order? I'm getting a cappuccino.",
            systemInstruction: "You are Lucas, a friendly and extremely patient language partner. Speak clearly, use simple and approachable vocabulary, and gently prompt the user to practice introducing themselves, expressing preferences, and ordering cafe items. Support English, Spanish, French, German, or Italian depending on user choice.",
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
            ],
            objectiveText: "Successfully introduce yourself, express a beverage preference, and ask Lucas about his hobbies.",
            expectedVocabulary: ["Nice to meet you", "Order", "Cappuccino", "Hobbies", "Please"],
            estimatedDuration: "15 Minutes Max"
        },
        {
            id: generateId(),
            title: "Airport Lost Luggage Dispute",
            description: "Your bags did not arrive on your flight. You are talking to a busy airport baggage service agent, Clara. Explain your situation, describe your baggage, ask when it will arrive, and request a delivery address update.",
            difficulty: 'B2',
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
            ],
            objectiveText: "Report your lost suitcase to the desk agent with its details and arrange hotel delivery.",
            expectedVocabulary: ["Lost suitcase", "Baggage claim", "Carousel", "Hotel delivery", "Hard-shell"],
            estimatedDuration: "15 Minutes Max"
        },
        {
            id: generateId(),
            title: "The Job Interview Pitch",
            description: "You are interviewing for a highly-coveted position in your target language. Speak with Elena, a sharp and demanding hiring manager. Explain your background, answer challenging behavioral questions, and pitch why you are the perfect candidate.",
            difficulty: 'C1',
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
            ],
            objectiveText: "Pitch your candidacy for a high-level role, handle demanding behavioral questions, and discuss compensation.",
            expectedVocabulary: ["Background", "Achievement", "Demanding", "Compensation", "Candidacy"],
            estimatedDuration: "15 Minutes Max"
        }
    ];
};

// --- Audio & Language Helpers ---
export interface LanguageCheckResult {
    isOffTarget: boolean;
    detectedLangName?: string;
}

export function detectLanguageAndCheckTarget(text: string, targetLanguage: string): LanguageCheckResult {
    if (!text || !text.trim() || !targetLanguage) {
        return { isOffTarget: false };
    }

    const cleanText = text.trim();
    const lowerText = cleanText.toLowerCase();
    const targetLower = targetLanguage.toLowerCase().trim();

    // 1. Script checks
    const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const isCyrillic = /[\u0400-\u04FF]/.test(cleanText);
    const isArabicScript = /[\u0600-\u06FF]/.test(cleanText);
    const isCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(cleanText);

    if (isDevanagari && !['hindi', 'nepali', 'marathi', 'sanskrit'].includes(targetLower)) {
        return { isOffTarget: true, detectedLangName: 'Hindi / Devanagari' };
    }
    if (isCyrillic && !['russian', 'ukrainian', 'bulgarian', 'serbian', 'belarusian'].includes(targetLower)) {
        return { isOffTarget: true, detectedLangName: 'Russian / Cyrillic' };
    }
    if (isArabicScript && !['arabic', 'persian', 'farsi', 'urdu'].includes(targetLower)) {
        return { isOffTarget: true, detectedLangName: 'Arabic' };
    }
    if (isCJK && !['chinese', 'japanese', 'korean', 'mandarin', 'cantonese'].includes(targetLower)) {
        return { isOffTarget: true, detectedLangName: 'Asian Script' };
    }

    // 2. Word tokenization & stop word dictionaries
    const words = lowerText.replace(/[^\w\s\u00C0-\u024F\u0100-\u017F]/gi, ' ').split(/\s+/).filter(Boolean);
    if (words.length === 0) return { isOffTarget: false };

    const profiles: { [key: string]: { name: string; words: Set<string> } } = {
        french: {
            name: 'French',
            words: new Set(['même', 'meme', 'nous', 'donne', 'avec', 'dans', 'pour', 'est', 'pas', 'cest', 'c\'est', 'bonjour', 'merci', 'votre', 'notre', 'mais', 'sur', 'elle', 'vous', 'tout', 'faire', 'bien'])
        },
        spanish: {
            name: 'Spanish',
            words: new Set(['hola', 'como', 'esta', 'gracias', 'por', 'favor', 'muy', 'bien', 'tambien', 'pero', 'donde', 'porque', 'buenos', 'dias', 'tardes', 'noches', 'mucho', 'gusto', 'tengo'])
        },
        portuguese: {
            name: 'Portuguese',
            words: new Set(['acho', 'era', 'voce', 'você', 'obrigado', 'obrigada', 'muito', 'bem', 'tambem', 'também', 'para', 'com', 'nao', 'não', 'esta', 'está', 'falar', 'tudo'])
        },
        english: {
            name: 'English',
            words: new Set(['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'from', 'they', 'what', 'their', 'there', 'would', 'hello', 'doing', 'where', 'which', 'about'])
        },
        turkish: {
            name: 'Turkish',
            words: new Set(['bir', 've', 'bu', 'da', 'de', 'için', 'icin', 'çok', 'cok', 'daha', 'var', 'yok', 'ama', 'gibi', 'kadar', 'sonra', 'evet', 'hayır', 'hayir', 'ben', 'sen', 'biz', 'siz', 'ne', 'nasıl', 'nasil', 'merhaba', 'teşekkürler', 'tesekkurler', 'güzel', 'guzel', 'oldu', 'ederim', 'sayın', 'sayin', 'günaydın', 'gunaydin', 'hoş', 'hos', 'geldiniz'])
        },
        german: {
            name: 'German',
            words: new Set(['und', 'die', 'der', 'das', 'ist', 'nicht', 'mit', 'fuer', 'für', 'sind', 'dass', 'wir', 'aber', 'guten', 'morgen', 'tag', 'danke', 'bitte'])
        },
        italian: {
            name: 'Italian',
            words: new Set(['che', 'per', 'non', 'sono', 'questo', 'questa', 'grazie', 'ciao', 'molto', 'anche', 'buongiorno', 'bene', 'come', 'stai'])
        }
    };

    let targetKey = targetLower;
    if (targetKey.includes('turk')) targetKey = 'turkish';
    else if (targetKey.includes('fren')) targetKey = 'french';
    else if (targetKey.includes('span')) targetKey = 'spanish';
    else if (targetKey.includes('port')) targetKey = 'portuguese';
    else if (targetKey.includes('engl')) targetKey = 'english';
    else if (targetKey.includes('germ')) targetKey = 'german';
    else if (targetKey.includes('ital')) targetKey = 'italian';

    const scores: { [key: string]: number } = {};
    for (const [langKey, profile] of Object.entries(profiles)) {
        let matches = 0;
        for (const word of words) {
            if (profile.words.has(word)) matches++;
        }
        scores[langKey] = matches;
    }

    const targetScore = scores[targetKey] || 0;

    let maxForeignScore = 0;
    let bestForeignLang = '';
    for (const [langKey, score] of Object.entries(scores)) {
        if (langKey !== targetKey && score > maxForeignScore) {
            maxForeignScore = score;
            bestForeignLang = profiles[langKey].name;
        }
    }

    if (maxForeignScore >= 1 && maxForeignScore > targetScore) {
        return { isOffTarget: true, detectedLangName: bestForeignLang };
    }

    // Specific French character sequence check when target is not French
    if (targetKey !== 'french' && (lowerText.includes('même') || lowerText.includes('nous') || lowerText.includes('donne') || lowerText.includes('est-ce'))) {
        return { isOffTarget: true, detectedLangName: 'French' };
    }

    // Specific Portuguese check when target is not Portuguese
    if (targetKey !== 'portuguese' && (lowerText.includes('acho') || lowerText.includes('voce') || lowerText.includes('obrigado'))) {
        return { isOffTarget: true, detectedLangName: 'Portuguese' };
    }

    return { isOffTarget: false };
}

function sanitizeTranscription(text: string, language: string): string {
    return text || '';
}

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
    category: string; // Mapped internally: Sales=Social, Support=Travel, Technical=Professional
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

    const [translations, setTranslations] = useState<Record<number, string>>({});
    const [translatingIdx, setTranslatingIdx] = useState<Record<number, boolean>>({});
    const [hint, setHint] = useState<string | null>(null);
    const [isHintVisible, setIsHintVisible] = useState<boolean>(false);
    const [hintMsgCount, setHintMsgCount] = useState<number>(-1);
    const [isGettingHint, setIsGettingHint] = useState(false);

    const [playingMsgIdx, setPlayingMsgIdx] = useState<number | null>(null);
    const [loadingMsgIdx, setLoadingMsgIdx] = useState<number | null>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const isRepeatingAudioRef = useRef(false);

    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            isRepeatingAudioRef.current = false;
        };
    }, [view]);

    const handleRepeatVoice = async (text: string, idx: number) => {
        // If this message is currently playing, pause it and stop
        if (playingMsgIdx === idx) {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            isRepeatingAudioRef.current = false;
            setPlayingMsgIdx(null);
            return;
        }

        // If another message is playing, stop it
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        isRepeatingAudioRef.current = false;
        setPlayingMsgIdx(null);

        setLoadingMsgIdx(idx);
        try {
            const response = await fetch('/api/cartesia/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: preprocessCartesiaText(text),
                    voiceId: getCartesiaVoiceId(activeScenario?.voice || 'c2ad7092-0447-47ea-948b-61fbb6faf153', activeScenario?.language || 'English')
                })
            });

            if (!response.ok) {
                throw new Error("TTS request failed");
            }

            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            
            currentAudioRef.current = audio;
            isRepeatingAudioRef.current = true;
            setPlayingMsgIdx(idx);

            audio.addEventListener('ended', () => {
                if (currentAudioRef.current === audio) {
                    isRepeatingAudioRef.current = false;
                    setPlayingMsgIdx(null);
                    currentAudioRef.current = null;
                }
            });

            audio.addEventListener('pause', () => {
                if (currentAudioRef.current === audio) {
                    isRepeatingAudioRef.current = false;
                    setPlayingMsgIdx(null);
                }
            });

            await audio.play();
        } catch (e) {
            console.error("Failed to repeat audio via high-quality Cartesia TTS:", e);
            isRepeatingAudioRef.current = false;
            setPlayingMsgIdx(null);
        } finally {
            setLoadingMsgIdx(null);
        }
    };

    const handleTranslate = async (text: string, idx: number) => {
        if (translations[idx]) {
            setTranslations(prev => {
                const copy = { ...prev };
                delete copy[idx];
                return copy;
            });
            return;
        }
        setTranslatingIdx(prev => ({ ...prev, [idx]: true }));
        try {
            const ai = getAI();
            const prompt = `Translate the following text from ${activeScenario?.language || 'the target language'} to English. Provide ONLY the direct translation. Do not include any explanations, quotes, introduction, or markdown.
Text: "${text}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            const resultText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "Translation error";
            setTranslations(prev => ({ ...prev, [idx]: resultText.trim() }));
        } catch (e) {
            console.error("Translation failed:", e);
        } finally {
            setTranslatingIdx(prev => ({ ...prev, [idx]: false }));
        }
    };

    const handleGetHint = async (forceRegenerate: boolean = false) => {
        if (!activeScenario) return;

        // Toggle visibility if already visible and not forcing a regenerate
        if (isHintVisible && !forceRegenerate) {
            setIsHintVisible(false);
            return;
        }

        // Reuse cached hint if no new messages have been added since generation
        if (!forceRegenerate && hint && hintMsgCount === messages.length) {
            setIsHintVisible(true);
            return;
        }

        setIsGettingHint(true);
        setIsHintVisible(true);
        try {
            const ai = getAI();
            const lastPartnerMsg = [...messages].reverse().find(m => m.role === 'model')?.text || activeScenario.initialMessage;
            const prompt = `You are an expert ${activeScenario.language} native conversation coach.
The user is practicing ${activeScenario.language} in this scenario: "${activeScenario.title}: ${activeScenario.description}".
The conversation partner just said: "${lastPartnerMsg}".

Provide a substantial, lengthy, well-crafted conversational response (3 to 5 full, natural sentences) in ${activeScenario.language} that the user could speak or send to keep the discussion engaging and detailed.

CRITICAL MANDATES:
1. Write ENTIRELY in ${activeScenario.language}.
2. DO NOT include any English translation, parentheses, or phonetic guides.
3. DO NOT include intros or quotation marks.
4. Output ONLY the response text in ${activeScenario.language}.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            const suggestion = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const cleanedHint = suggestion.trim().replace(/^"/, '').replace(/"$/, '').trim();
            setHint(cleanedHint);
            setHintMsgCount(messages.length);
        } catch (e) {
            console.error("Hint generation failed:", e);
            setHint("Could not generate a hint. Please try again!");
            setHintMsgCount(messages.length);
        } finally {
            setIsGettingHint(false);
        }
    };
    
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
        difficulty: 'B1', 
        category: 'Sales', // Maps to Social
        funnelStage: 'Conversational',
        persona: 'Friendly Native Speaker',
        mood: 'Patient',
        industry: 'Everyday Life',
        language: 'English',
        dialect: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [manualParams, setManualParams] = useState<Partial<TrainingScenario>>({ 
        difficulty: 'B1', 
        category: 'Sales', 
        language: 'English' 
    });

    // Custom practice category state
    const [isCustomAiCategory, setIsCustomAiCategory] = useState(false);
    const [customAiCategory, setCustomAiCategory] = useState('');
    const [isCustomManualCategory, setIsCustomManualCategory] = useState(false);
    const [customManualCategory, setCustomManualCategory] = useState('');
    
    // Chat Refs
    const chatSession = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatContentRef = useRef<HTMLDivElement>(null);

    // Voice Refs
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const isMicMutedRef = useRef(false);
    
    useEffect(() => {
        isMicMutedRef.current = isMicMuted;
    }, [isMicMuted]);

    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const nextStartTime = useRef<number>(0);
    const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    // Live Transcription State Buffers
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    const [liveInputTranscription, setLiveInputTranscription] = useState('');
    const [liveOutputTranscription, setLiveOutputTranscription] = useState('');

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

    // Gently scroll down to the latest message whenever user or AI speaks or finishes speaking
    const scrollToBottomSmooth = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        } else if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior
            });
        }
    };

    useEffect(() => {
        if (view !== 'active') return;
        const timer = setTimeout(() => {
            scrollToBottomSmooth('smooth');
        }, 60);
        return () => clearTimeout(timer);
    }, [messages, liveInputTranscription, liveOutputTranscription, view]);

    // Scroll to top of page/container when sub-view shifts within AiConversation
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as any });
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.scrollTo({ top: 0, behavior: 'instant' as any });
            contentWrapper.scrollTop = 0;
        }
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [view]);

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
        const cleanedText = preprocessCartesiaText(text);
        if (!cleanedText) return;
        const sentenceId = nextSentenceId.current++;
        const item = {
            id: sentenceId,
            text: cleanedText,
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
                    voiceId: getCartesiaVoiceId(voiceId, activeScenario?.language || 'English')
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
        setIsMicMuted(false);
        setConnectionError(null);
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';
        setLiveInputTranscription('');
        setLiveOutputTranscription('');
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
                        if (isMicMutedRef.current) {
                            return; // Do not transmit audio when muted
                        }
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
                        // User has finished speaking because AI has started transcribing output.
                        // Commit the user's input transcription to message history in real-time.
                        const userText = currentInputTranscription.current;
                        if (userText.trim()) {
                            setMessages(prev => {
                                const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
                                if (lastUserMsg && lastUserMsg.text === userText) return prev;
                                return [...prev, {role: 'user', text: userText}];
                            });
                            currentInputTranscription.current = '';
                            setLiveInputTranscription('');
                        }

                        const newText = message.serverContent.outputTranscription.text;
                        currentOutputTranscription.current += newText;
                        setLiveOutputTranscription(currentOutputTranscription.current);
                        setLiveInputTranscription(''); // Clear user input text as AI responds

                        if (isCartesiaVoice) {
                            cartesiaSentenceBuffer.current += newText;
                            
                            // Match sentences or clauses ending with standard punctuation, commas, colons, semicolons, or newlines
                            const sentenceRegex = /([^.?!,;:。？！，；：\n\r]+[.?!,;:。？！，；：\n\r]+)/g;
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

                            // Fallback split: If the pending buffer is growing long (e.g., > 50 characters) and has a space,
                            // split at the last space to avoid delayed playback for long run-on sentences.
                            if (cartesiaSentenceBuffer.current.length > 50) {
                                const lastSpace = cartesiaSentenceBuffer.current.lastIndexOf(' ');
                                if (lastSpace > 15) {
                                    const sentence = cartesiaSentenceBuffer.current.substring(0, lastSpace).trim();
                                    if (sentence.length > 0) {
                                        queueAndFetchSentence(sentence, scenario.voice || '');
                                    }
                                    cartesiaSentenceBuffer.current = cartesiaSentenceBuffer.current.substring(lastSpace + 1);
                                }
                            }
                        }
                    }

                    if (message.serverContent?.interrupted) {
                        // User speech detected (barge-in interruption)! Stop all playing audio immediately
                        sources.current.forEach(src => {
                            try { src.stop(); } catch(e){}
                        });
                        sources.current.clear();
                        nextStartTime.current = 0;
                        if (isCartesiaVoice) {
                            resetCartesiaQueue();
                        }

                        // Stop repeated audio if playing
                        if (currentAudioRef.current) {
                            currentAudioRef.current.pause();
                            currentAudioRef.current = null;
                        }
                        isRepeatingAudioRef.current = false;
                        setPlayingMsgIdx(null);
                        
                        // Commit whatever partial response the AI was saying before being interrupted
                        const modelText = currentOutputTranscription.current;
                        if (modelText.trim()) {
                            const cleanText = stripAudioTags(modelText);
                            if (cleanText) {
                                setMessages(prev => {
                                    const lastModelMsg = [...prev].reverse().find(m => m.role === 'model');
                                    if (lastModelMsg && lastModelMsg.text.startsWith(cleanText)) return prev;
                                    return [...prev, {role: 'model', text: cleanText + '...'}];
                                });
                            }
                        }
                        currentOutputTranscription.current = '';
                        setLiveOutputTranscription(''); // User cut-off the AI
                    } else if (message.serverContent?.inputTranscription) {
                        const rawText = message.serverContent.inputTranscription.text;
                        const cleanChunk = sanitizeTranscription(rawText, scenario.language || 'English');
                        currentInputTranscription.current += cleanChunk;
                        setLiveInputTranscription(currentInputTranscription.current);
                        setLiveOutputTranscription(''); // Clear output while user speaks
                        
                        // Stop repeated audio if playing
                        if (currentAudioRef.current) {
                            currentAudioRef.current.pause();
                            currentAudioRef.current = null;
                        }
                        isRepeatingAudioRef.current = false;
                        setPlayingMsgIdx(null);

                        // User started speaking/interrupted! Stop all playing audio immediately and clear the queue
                        sources.current.forEach(src => {
                            try { src.stop(); } catch(e){}
                        });
                        sources.current.clear();
                        nextStartTime.current = 0;
                        if (isCartesiaVoice) {
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
                            const cleanText = stripAudioTags(modelText);
                            if (cleanText) {
                                setMessages(prev => {
                                    const lastModelMsg = [...prev].reverse().find(m => m.role === 'model');
                                    if (lastModelMsg && lastModelMsg.text === cleanText) return prev;
                                    return [...prev, {role: 'model', text: cleanText}];
                                });
                            }

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
                        setLiveInputTranscription('');
                        setLiveOutputTranscription('');
                    }

                    const parts = message.serverContent?.modelTurn?.parts;
                    const base64Audio = parts?.[0]?.inlineData?.data;

                    // If we receive the AI response parts/audio, make sure user speech was committed
                    if (base64Audio) {
                        const userText = currentInputTranscription.current;
                        if (userText.trim()) {
                            setMessages(prev => {
                                const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
                                if (lastUserMsg && lastUserMsg.text === userText) return prev;
                                return [...prev, {role: 'user', text: userText}];
                            });
                            currentInputTranscription.current = '';
                            setLiveInputTranscription('');
                        }
                    }

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
        setLiveInputTranscription('');
        setLiveOutputTranscription('');
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
        if (!input.trim() || !chatSession.current || mode === 'voice' || isOverLimit || isSendingMessage) return;
        
        if (typeof chatSession.current.sendMessageStream !== 'function') {
            console.error("Chat session is not ready.");
            return;
        }

        const userMsg = input.trim();
        setInput('');
        setIsSendingMessage(true);
        
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
        } finally {
            setIsSendingMessage(false);
        }
    };

    const endSession = async () => {
        if (!activeScenario) return;
        
        if (mode === 'voice') {
            stopVoiceSession();
        }
        
        setIsAnalyzing(true);
        const transcript = messages.map(m => `${m.role === 'user' ? 'Learner' : 'AI Partner'}: ${stripAudioTags(m.text)}`).join('\n');
        
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
                icon: (aiParams.category === 'Social Conversation' ? 'MessageSquare' : 
                       aiParams.category === 'Travel & Shopping' ? 'Compass' : 
                       aiParams.category === 'Professional & Business' ? 'Briefcase' : 
                       aiParams.category === 'Academic & Study' ? 'BookOpen' : 
                       aiParams.category === 'Technical & IT' ? 'Wrench' : 'Smile'),
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

    // Auto generate topic customized for language practicing using the live backend AI generator
    const handleAutoGenerateTopic = async () => {
        setIsGeneratingTopic(true);
        try {
            const topic = await generateTrainingTopic({
                language: aiParams.language,
                dialect: aiParams.dialect,
                category: aiParams.category,
                difficulty: aiParams.difficulty,
                persona: aiParams.persona,
                mood: aiParams.mood
            });
            if (topic) {
                setAiParams(prev => ({...prev, topic}));
            } else {
                throw new Error("Empty topic response");
            }
        } catch (e) {
            console.error("Failed to generate dynamic topic, using fallback:", e);
            const sampleTopics = [
                `Ordering street food and bargaining for a handwoven scarf at a bustling market in Madrid`,
                `Asking a friendly local for directions to the train station and buying a ticket from the kiosk`,
                `Checking into a boutique family-run hotel, requesting a high-floor room with a view, and asking for local restaurant recommendations`,
                `Describing acute flu symptoms, allergy notes, and filling a prescription at a pharmacy`,
                `Introducing yourself to fellow students in a local art class, asking about their interests, and arranging a weekend study group`,
                `Pitching your professional skills and past marketing experience in a job interview with a local tech firm`
            ];
            setAiParams(prev => ({...prev, topic: getRandom(sampleTopics)}));
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
            difficulty: (manualParams.difficulty as any) || 'B1',
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
        const transcript = messages.map(m => `${m.role === 'user' ? 'Learner' : 'AI Partner'}: ${stripAudioTags(m.text)}`).join('\n');
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
        const matchesDifficulty = selectedDifficultyFilter === 'All' || 
            s.difficulty === selectedDifficultyFilter ||
            (selectedDifficultyFilter === 'A1' && s.difficulty === 'Beginner') ||
            (selectedDifficultyFilter === 'B1' && s.difficulty === 'Intermediate') ||
            (selectedDifficultyFilter === 'C1' && s.difficulty === 'Advanced');
        return matchesLanguage && matchesDifficulty;
    });

    // Unique languages in loaded scenarios
    const availableLanguages = Array.from(new Set(scenarios.map(s => s.language || 'English')));

    // --- VIEW: Create Scenario ---
    if (view === 'create') {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="max-w-2xl mx-auto pb-24 md:pb-12"
            >
                <button 
                    onClick={() => setView('list')} 
                    className="mb-8 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all group shadow-sm"
                >
                    <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" /> 
                    Back to Practice Scenarios
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create Language Scenario</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">Design a custom language roleplay scenario using our automated AI Generator or the fine-grained manual builder.</p>
                    </div>
                    
                    <div className="p-1.5 bg-slate-50 dark:bg-slate-950 flex border-b border-slate-100 dark:border-slate-850">
                        <button 
                            onClick={() => setCreationType('ai')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${creationType === 'ai' ? 'bg-white dark:bg-slate-900 shadow-sm text-[#0500e2] dark:text-white border border-slate-200/30 dark:border-slate-800/40' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            <Sparkles size={15} /> AI Generator
                        </button>
                        <button 
                            onClick={() => setCreationType('manual')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${creationType === 'manual' ? 'bg-white dark:bg-slate-900 shadow-sm text-[#0500e2] dark:text-white border border-slate-200/30 dark:border-slate-800/40' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            <Wrench size={15} /> Manual Builder
                        </button>
                    </div>

                    <div className="p-8 md:p-10">
                        {creationType === 'ai' ? (
                            <div className="space-y-6 animate-fade-in">
                                {/* Category Selection Mapped */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Practice Category</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { ui: 'Social Conversation', val: 'Social Conversation' },
                                            { ui: 'Travel & Shopping', val: 'Travel & Shopping' },
                                            { ui: 'Professional & Business', val: 'Professional & Business' },
                                            { ui: 'Daily Life & Routine', val: 'Daily Life & Routine' },
                                            { ui: 'Academic & Study', val: 'Academic & Study' },
                                            { ui: 'Technical & IT', val: 'Technical & IT' },
                                            { ui: 'Health & Medical', val: 'Health & Medical' },
                                            { ui: 'Leisure & Hobbies', val: 'Leisure & Hobbies' },
                                            { ui: 'Culture & Arts', val: 'Culture & Arts' },
                                            { ui: 'Sports & Fitness', val: 'Sports & Fitness' },
                                            { ui: 'Emergency', val: 'Emergency Situations' }
                                        ].map(cat => (
                                            <button
                                                key={cat.val}
                                                type="button"
                                                onClick={() => {
                                                    setIsCustomAiCategory(false);
                                                    setAiParams({...aiParams, category: cat.val});
                                                }}
                                                className={`py-3.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                    (!isCustomAiCategory && aiParams.category === cat.val) 
                                                    ? 'bg-slate-50 border-[#0500e2] text-[#0500e2] dark:bg-slate-950 dark:border-[#4b53fa] dark:text-white ring-1 ring-[#0500e2] dark:ring-[#4b53fa]' 
                                                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {cat.ui}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomAiCategory(true);
                                                setAiParams({...aiParams, category: customAiCategory || 'Custom Category'});
                                            }}
                                            className={`py-3.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                isCustomAiCategory 
                                                ? 'bg-slate-50 border-[#0500e2] text-[#0500e2] dark:bg-slate-950 dark:border-[#4b53fa] dark:text-white ring-1 ring-[#0500e2] dark:ring-[#4b53fa]' 
                                                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            + Custom Category
                                        </button>
                                    </div>
                                    {isCustomAiCategory && (
                                        <div className="mt-3 animate-fade-in">
                                            <input
                                                type="text"
                                                value={customAiCategory}
                                                onChange={(e) => {
                                                    setCustomAiCategory(e.target.value);
                                                    setAiParams({...aiParams, category: e.target.value});
                                                }}
                                                placeholder="Enter custom category (e.g. Health & Medical, Hobbies, Arts...)"
                                                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Language and Dialect selection */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Target Language</label>
                                        <select 
                                            value={aiParams.language}
                                            onChange={(e) => setAiParams({...aiParams, language: e.target.value, dialect: ''})}
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all"
                                        >
                                            <option value="English">English</option>
                                            <option value="Turkish">Turkish</option>
                                            <option value="Chinese">Chinese</option>
                                            <option value="Danish">Danish</option>
                                            <option value="Dutch">Dutch</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Italian">Italian</option>
                                            <option value="Japanese">Japanese</option>
                                            <option value="Korean">Korean</option>
                                            <option value="Portuguese">Portuguese</option>
                                            <option value="Russian">Russian</option>
                                            <option value="Spanish">Spanish</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Dialect or Accent</label>
                                        <input 
                                            type="text"
                                            value={aiParams.dialect}
                                            onChange={(e) => setAiParams({...aiParams, dialect: e.target.value})}
                                            placeholder="e.g. Mexican, Castilian, Parisian"
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Partner Persona & Difficulty */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">AI Partner Persona</label>
                                        <input 
                                            type="text"
                                            value={aiParams.persona}
                                            onChange={(e) => setAiParams({...aiParams, persona: e.target.value})}
                                            placeholder="e.g. Patient exchange partner, street food vendor"
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Target Fluency Level</label>
                                        <select 
                                            value={aiParams.difficulty}
                                            onChange={(e) => setAiParams({...aiParams, difficulty: e.target.value})}
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all"
                                        >
                                            <option value="A1">A1</option>
                                            <option value="A2">A2</option>
                                            <option value="B1">B1</option>
                                            <option value="B2">B2</option>
                                            <option value="C1">C1</option>
                                            <option value="C2">C2</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Partner Mood Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">AI Partner Attitude</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                        {['Patient', 'Talkative', 'Direct', 'Shy', 'Distracted', 'Formal'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setAiParams({...aiParams, mood: m})}
                                                className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1.5 ${
                                                    aiParams.mood === m 
                                                    ? 'bg-[#0500e2] text-white border-[#0500e2] dark:bg-[#4b53fa] dark:border-[#4b53fa]' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700'
                                                }`}
                                            >
                                                {m === 'Patient' && <HelpCircle size={15} />}
                                                {m === 'Talkative' && <Smile size={15} />}
                                                {m === 'Direct' && <Zap size={15} />}
                                                {m === 'Shy' && <MinusCircle size={15} />}
                                                {m === 'Distracted' && <Meh size={15} />}
                                                {m === 'Formal' && <Award size={15} />}
                                                <span>{m}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Description */}
                                <div>
                                    <div className="flex justify-between items-center mb-2.5">
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Conversational Topic</label>
                                        <button 
                                            onClick={handleAutoGenerateTopic}
                                            disabled={isGeneratingTopic}
                                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-[#0500e2]/10 text-[#0500e2] dark:text-[#4b53fa] dark:bg-[#4b53fa]/10 rounded-full font-bold hover:bg-[#0500e2]/20 dark:hover:bg-[#4b53fa]/20 transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            {isGeneratingTopic ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            {isGeneratingTopic ? 'Generating...' : 'Auto-fill Topic'}
                                        </button>
                                    </div>
                                    <textarea 
                                        value={aiParams.topic}
                                        onChange={(e) => setAiParams({...aiParams, topic: e.target.value})}
                                        placeholder="Describe what situation you want to practice (e.g. negotiating rent for an apartment, purchasing train tickets at a window, talking to local doctors about flu symptoms...)"
                                        className="w-full h-28 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#0500e2] dark:focus:border-[#4b53fa] outline-none resize-none text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed placeholder:text-slate-400"
                                    />
                                </div>

                                <button 
                                    onClick={handleGenerateScenario}
                                    disabled={isGenerating || !aiParams.topic}
                                    className="w-full py-4 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-xl font-bold shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    {isGenerating ? 'Generating Scenario...' : 'Create Scenario with AI'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Scenario Title</label>
                                    <input 
                                        type="text"
                                        value={manualParams.title || ''}
                                        onChange={(e) => setManualParams({...manualParams, title: e.target.value})}
                                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all"
                                        placeholder="e.g. Renting a Vespa in Rome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Description</label>
                                    <textarea 
                                        value={manualParams.description || ''}
                                        onChange={(e) => setManualParams({...manualParams, description: e.target.value})}
                                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all resize-none h-20 leading-relaxed"
                                        placeholder="Brief scenario details..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Target Language</label>
                                        <select 
                                            value={manualParams.language || 'English'}
                                            onChange={(e) => setManualParams({...manualParams, language: e.target.value})}
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all"
                                        >
                                            <option value="English">English</option>
                                            <option value="Turkish">Turkish</option>
                                            <option value="Chinese">Chinese</option>
                                            <option value="Danish">Danish</option>
                                            <option value="Dutch">Dutch</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Italian">Italian</option>
                                            <option value="Japanese">Japanese</option>
                                            <option value="Korean">Korean</option>
                                            <option value="Portuguese">Portuguese</option>
                                            <option value="Russian">Russian</option>
                                            <option value="Spanish">Spanish</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Dialect / Accent</label>
                                        <input 
                                            type="text"
                                            value={manualParams.dialect || ''}
                                            onChange={(e) => setManualParams({...manualParams, dialect: e.target.value})}
                                            placeholder="e.g. Parisian, Andalusian, Tokyo"
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Difficulty</label>
                                        <select 
                                            value={manualParams.difficulty}
                                            onChange={(e) => setManualParams({...manualParams, difficulty: e.target.value as any})}
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all"
                                        >
                                            <option value="A1">A1</option>
                                            <option value="A2">A2</option>
                                            <option value="B1">B1</option>
                                            <option value="B2">B2</option>
                                            <option value="C1">C1</option>
                                            <option value="C2">C2</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Category</label>
                                        <select 
                                            value={isCustomManualCategory ? 'Custom' : manualParams.category}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'Custom') {
                                                    setIsCustomManualCategory(true);
                                                    setManualParams({...manualParams, category: customManualCategory || 'Custom Category'});
                                                } else {
                                                    setIsCustomManualCategory(false);
                                                    setManualParams({...manualParams, category: val});
                                                }
                                            }}
                                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all"
                                        >
                                            <option value="Social Conversation">Social Conversation</option>
                                            <option value="Travel & Shopping">Travel & Shopping</option>
                                            <option value="Professional & Business">Professional & Business</option>
                                            <option value="Daily Life & Routine">Daily Life & Routine</option>
                                            <option value="Academic & Study">Academic & Study</option>
                                            <option value="Technical & IT">Technical & IT</option>
                                            <option value="Health & Medical">Health & Medical</option>
                                            <option value="Leisure & Hobbies">Leisure & Hobbies</option>
                                            <option value="Culture & Arts">Culture & Arts</option>
                                            <option value="Sports & Fitness">Sports & Fitness</option>
                                            <option value="Emergency Situations">Emergency Situations</option>
                                            <option value="Custom">+ Custom Category</option>
                                        </select>
                                        {isCustomManualCategory && (
                                            <div className="mt-3 animate-fade-in">
                                                <input 
                                                    type="text"
                                                    value={customManualCategory}
                                                    onChange={(e) => {
                                                        setCustomManualCategory(e.target.value);
                                                        setManualParams({...manualParams, category: e.target.value});
                                                    }}
                                                    placeholder="Enter custom category..."
                                                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Initial Partner Opener</label>
                                    <input 
                                        type="text"
                                        value={manualParams.initialMessage || ''}
                                        onChange={(e) => setManualParams({...manualParams, initialMessage: e.target.value})}
                                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400"
                                        placeholder="The first phrase the AI partner says..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">AI Partner Core Persona Instructions</label>
                                    <textarea 
                                        value={manualParams.systemInstruction || ''}
                                        onChange={(e) => setManualParams({...manualParams, systemInstruction: e.target.value})}
                                        className="w-full h-36 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-[#0500e2] dark:focus:border-[#4b53fa] text-sm text-slate-800 dark:text-slate-100 font-medium transition-all resize-none leading-relaxed placeholder:text-slate-400"
                                        placeholder="Instructions for the AI partner: 'You are a warm coffee shop barista in Paris. Talk casually but speak only French...'"
                                    />
                                </div>
                                <button 
                                    onClick={handleCreateManual}
                                    className="w-full py-4 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                                >
                                    Create Manual Scenario
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
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
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
                >
                    <div className="text-center p-8 max-w-md">
                        <div className="w-20 h-20 bg-[#0500e2]/10 dark:bg-[#4b53fa]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Languages size={40} className="text-[#0500e2] dark:text-[#4b53fa] animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analyzing Practice & Fluency</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                            Our Revu-powered language grader is evaluating your vocabulary range, grammatical correctness, structural fluency, and comprehension. This will take just a few seconds...
                        </p>
                    </div>
                </motion.div>
            );
        }

        return (
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100dvh-130px)] md:h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
                {/* Clean Header */}
                <div className="py-2.5 px-4 md:py-3.5 md:px-5 bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 flex flex-row justify-between items-center shrink-0 z-10 gap-2">
                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden min-w-0">
                        <div className="hidden sm:flex w-7 h-7 md:w-9 md:h-9 rounded-lg items-center justify-center text-white shrink-0 bg-[#0500e2] dark:bg-[#4b53fa] shadow-xs">
                            <Globe size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-[11px] md:text-sm text-slate-900 dark:text-white leading-tight truncate">{activeScenario.title}</h3>
                            <div className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 truncate">
                                {activeScenario.language} • {activeScenario.difficulty}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
                        {/* Timer */}
                        <div className="flex items-center gap-1 px-2 py-0.5 md:gap-1.5 md:px-2.5 md:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg font-mono text-[9px] md:text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <Clock size={10} className="text-[#0500e2] dark:text-[#4b53fa] shrink-0" />
                            {formatTime(sessionDuration)}
                        </div>

                        {mode === 'voice' && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-wider animate-pulse border border-rose-100 dark:border-rose-900/40 shrink-0">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                <span className="hidden xs:inline">Speaking</span>
                            </div>
                        )}

                        <button 
                            onClick={endSession}
                            className="px-2.5 py-1 md:px-3 md:py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-extrabold text-[9px] md:text-[11px] transition-all shadow-xs cursor-pointer shrink-0"
                        >
                            <span className="sm:hidden">Complete</span>
                            <span className="hidden sm:inline">Complete Session</span>
                        </button>
                    </div>
                </div>

                {connectionError && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 p-4 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-3 animate-fade-in">
                        <AlertTriangle className="text-rose-600 dark:text-rose-450" size={18} />
                        <span className="text-xs md:text-sm font-semibold text-rose-700 dark:text-rose-350">{connectionError}</span>
                        <button 
                            onClick={() => confirmStartSession()}
                            className="ms-auto text-xs bg-white dark:bg-rose-900/50 border border-rose-250 dark:border-rose-800 text-rose-750 dark:text-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Conversation Chat Bubbles */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/50 pb-3">
                    <div ref={chatContentRef} className="space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-405">
                                <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                    {mode === 'voice' ? <Mic size={22} className="text-[#0500e2] dark:text-[#4b53fa]" /> : <MessageSquare size={22} className="text-[#0500e2] dark:text-[#4b53fa]" />}
                                </div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Practice Room Ready</p>
                                <p className="text-xs mt-1 leading-relaxed text-slate-400">
                                    {mode === 'voice' ? "Speak clearly in your target language to begin..." : `Introduce yourself to the partner in ${activeScenario.language}!`}
                                </p>
                            </div>
                        )}
                        
                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-[#0500e2] text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 rounded-bl-none'
                                    }`}>
                                        <div className="text-[10px] uppercase tracking-wider mb-1.5 font-extrabold flex items-center justify-between gap-1.5 w-full">
                                            {msg.role === 'user' ? (
                                                <>
                                                    <span className="opacity-75">You</span>
                                                    {(() => {
                                                        const langCheck = detectLanguageAndCheckTarget(msg.text, activeScenario?.language || 'English');
                                                        if (langCheck.isOffTarget) {
                                                            return (
                                                                <div className="relative group/warn inline-flex items-center">
                                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-amber-950 shadow-xs cursor-help border border-amber-300">
                                                                        <AlertTriangle size={11} className="text-amber-900 shrink-0" />
                                                                        <span>Non-{activeScenario?.language} Speech</span>
                                                                    </span>
                                                                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/warn:flex group-focus/warn:flex flex-col w-60 sm:w-64 p-3 bg-slate-900 text-slate-100 text-xs rounded-xl shadow-2xl z-50 pointer-events-none border border-amber-500/40 normal-case tracking-normal">
                                                                        <div className="font-extrabold text-amber-300 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                                                                            <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                                                                            Language Warning
                                                                        </div>
                                                                        <p className="text-[11px] leading-relaxed text-slate-200 font-normal">
                                                                            You spoke in <strong className="text-amber-300">{langCheck.detectedLangName || 'a non-target language'}</strong> instead of <strong className="text-white">{activeScenario?.language}</strong>. Speak in <strong>{activeScenario?.language}</strong> for best results!
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </>
                                            ) : (
                                                <span className="opacity-75">{activeScenario?.title?.split(':')[1]?.trim() || 'Partner'}</span>
                                            )}
                                        </div>
                                        <div className="font-normal text-sm md:text-base leading-relaxed break-words">
                                            {msg.text ? stripAudioTags(msg.text) : (
                                                <span className="flex gap-1 items-center py-1.5">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Buttons & Translation Box for AI partner messages only */}
                                        {msg.role !== 'user' && (
                                            <>
                                                <div className="mt-2.5 pt-2 border-t border-slate-100/15 dark:border-slate-700/50 flex items-center gap-2.5">
                                                    <button 
                                                        onClick={() => handleTranslate(msg.text, idx)}
                                                        disabled={translatingIdx[idx]}
                                                        className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold py-1 px-2 rounded-md transition-all active:scale-95 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-150 dark:border-slate-750"
                                                    >
                                                        {translatingIdx[idx] ? (
                                                            <Loader2 size={10} className="animate-spin" />
                                                        ) : (
                                                            <Languages size={10} />
                                                        )}
                                                        <span>{translations[idx] ? "Show Original" : "Translate"}</span>
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleRepeatVoice(msg.text, idx)}
                                                        disabled={loadingMsgIdx === idx}
                                                        className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold py-1 px-2 rounded-md transition-all active:scale-95 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-150 dark:border-slate-750"
                                                    >
                                                        {loadingMsgIdx === idx ? (
                                                            <>
                                                                <Loader2 size={10} className="animate-spin" />
                                                                <span>Loading...</span>
                                                            </>
                                                        ) : playingMsgIdx === idx ? (
                                                            <>
                                                                <Square size={10} className="fill-current text-amber-500" />
                                                                <span>Stop</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Volume2 size={10} />
                                                                <span>Repeat</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Translation Box */}
                                                {translations[idx] && (
                                                    <div className="mt-2 p-2 rounded-lg text-xs leading-relaxed border animate-fade-in bg-indigo-50/50 dark:bg-slate-900/30 border-indigo-100/30 dark:border-slate-750/80 text-indigo-950 dark:text-indigo-200 italic">
                                                        <strong>Translation:</strong> {translations[idx]}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </ AnimatePresence>

                        {/* Render live transcriptions instantly when active without exit-animation layouts shifts */}
                        {liveInputTranscription.trim() && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.15 }}
                                className="flex justify-end"
                            >
                                <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm bg-[#0500e2]/90 dark:bg-[#4b53fa]/95 text-white rounded-br-none border border-[#0500e2]/20 dark:border-[#4b53fa]/20 animate-pulse">
                                    <div className="text-[10px] uppercase tracking-wider mb-1.5 font-extrabold flex items-center justify-between gap-1.5 w-full">
                                        <div className="flex items-center gap-1.5 opacity-75">
                                            <span>You (Speaking...)</span>
                                            <span className="flex gap-0.5 items-center">
                                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </span>
                                        </div>
                                        {(() => {
                                            const langCheck = detectLanguageAndCheckTarget(liveInputTranscription, activeScenario?.language || 'English');
                                            if (langCheck.isOffTarget) {
                                                return (
                                                    <div className="relative group/warn inline-flex items-center">
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-amber-950 shadow-xs cursor-help border border-amber-300">
                                                            <AlertTriangle size={11} className="text-amber-900 shrink-0" />
                                                            <span>Non-{activeScenario?.language}</span>
                                                        </span>
                                                        <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/warn:flex group-focus/warn:flex flex-col w-60 sm:w-64 p-3 bg-slate-900 text-slate-100 text-xs rounded-xl shadow-2xl z-50 pointer-events-none border border-amber-500/40 normal-case tracking-normal">
                                                            <div className="font-extrabold text-amber-300 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                                                                <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                                                                Language Warning
                                                            </div>
                                                            <p className="text-[11px] leading-relaxed text-slate-200 font-normal">
                                                                You are speaking in <strong className="text-amber-300">{langCheck.detectedLangName || 'another language'}</strong> instead of <strong className="text-white">{activeScenario?.language}</strong>.
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div className="font-normal italic">{liveInputTranscription}</div>
                                </div>
                            </motion.div>
                        )}

                        {liveOutputTranscription.trim() && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.15 }}
                                className="flex justify-start"
                            >
                                <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 rounded-bl-none">
                                    <div className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-[#4b53fa] mb-1.5 font-extrabold flex items-center gap-1.5">
                                        <span>{activeScenario.title.split(':')[1]?.trim() || 'Partner'} (Speaking...)</span>
                                        <span className="flex gap-0.5 items-center">
                                            <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-[#4b53fa] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-[#4b53fa] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-[#4b53fa] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </span>
                                    </div>
                                    <div className="font-normal">{stripAudioTags(liveOutputTranscription)}</div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div ref={messagesEndRef} />
                </div>

                {/* Compact Live Assistance Widget */}
                <div className="mx-auto max-w-4xl w-full px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900 border-t border-b border-slate-200/65 dark:border-slate-800/80 flex flex-col shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <Sparkles size={12} className="text-amber-500 animate-pulse" />
                            <span>Live Assistance</span>
                        </div>
                        <button 
                            onClick={() => handleGetHint(false)}
                            disabled={isGettingHint}
                            className="flex items-center gap-1 px-3 py-1.5 sm:py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-full text-[10px] sm:text-xs font-extrabold transition-all cursor-pointer shadow-xs min-h-[30px]"
                        >
                            {isGettingHint ? (
                                <>
                                    <Loader2 size={11} className="animate-spin" />
                                    <span>Getting Hint...</span>
                                </>
                            ) : (
                                <>
                                    <HelpCircle size={11} />
                                    <span>{isHintVisible ? "Hide Hint" : "Hint Reply"}</span>
                                </>
                            )}
                        </button>
                    </div>
                    <AnimatePresence>
                        {isHintVisible && hint && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="p-3 sm:p-4 bg-amber-50/95 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 rounded-xl sm:rounded-2xl flex flex-col gap-2.5 text-xs sm:text-sm text-amber-950 dark:text-amber-100 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/50 pb-2">
                                        <span className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                            <Sparkles size={12} className="text-amber-500 shrink-0" />
                                            Suggested {activeScenario.language} Response
                                        </span>
                                        <button 
                                            onClick={() => setIsHintVisible(false)}
                                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 p-1.5 cursor-pointer transition-colors rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 min-h-[32px] min-w-[32px] flex items-center justify-center"
                                            title="Close hint"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <p className="font-normal leading-relaxed break-words text-xs sm:text-sm md:text-base text-slate-800 dark:text-slate-100 max-h-36 sm:max-h-52 overflow-y-auto pr-1">
                                        {hint}
                                    </p>
                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <button 
                                            onClick={() => {
                                                setInput(hint.trim());
                                                setIsHintVisible(false);
                                            }}
                                            className="w-full sm:w-auto min-h-[38px] px-4 py-2 bg-[#0500e2] hover:bg-[#0400b8] active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                                        >
                                            Use Response
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Chat Input */}
                <div className={`${mode === 'voice' ? 'py-1 px-3 bg-transparent border-t-0 shadow-none pb-3' : 'p-5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850'} shrink-0 safe-area-bottom`}>
                    {mode === 'text' ? (
                        <div className="relative flex gap-3 items-end max-w-4xl mx-auto">
                            <div className="flex-1 relative">
                                <textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Type in ${activeScenario.language || 'target language'}...`}
                                    className="w-full py-3.5 ps-4 pe-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#0500e2] dark:focus:border-[#4b53fa] focus:bg-white dark:focus:bg-slate-900 outline-none rounded-2xl text-sm md:text-base resize-none max-h-32 min-h-[48px] overflow-y-auto leading-relaxed shadow-inner"
                                    rows={1}
                                />
                                <div className="absolute right-4 bottom-3 text-[10px] text-slate-400 font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                    {wordCount}/24
                                </div>
                            </div>
                            <button 
                                onClick={sendMessage}
                                disabled={!input.trim() || isOverLimit}
                                className="p-3.5 bg-[#0500e2] hover:bg-[#0400c0] dark:bg-[#4b53fa] dark:hover:bg-[#4b53fa]/90 text-white rounded-2xl disabled:opacity-40 transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="w-fit mx-auto flex items-center justify-center gap-2 py-1 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-md transition-all hover:shadow-lg hover:scale-[1.01]">
                            <div className="flex items-center gap-1.5 min-w-0">
                                {isMicMuted ? (
                                    <div className="w-5 h-5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full flex items-center justify-center shrink-0 border border-rose-100/60 dark:border-rose-900/45">
                                        <MicOff size={9} />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0 relative border border-emerald-100/60 dark:border-emerald-900/45">
                                        <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></span>
                                        <Mic size={9} className="relative z-10 animate-pulse" />
                                    </div>
                                )}
                                <div className="text-left min-w-0">
                                    <p className="text-[9px] font-extrabold text-slate-900 dark:text-white leading-none">
                                        {isMicMuted ? 'Muted' : 'Mic Open'}
                                    </p>
                                    <p className="text-[7.5px] text-slate-500 dark:text-slate-400 whitespace-nowrap leading-none mt-0.5">
                                        {isMicMuted ? 'Tap to unmute' : 'Speak in your target language...'}
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => setIsMicMuted(!isMicMuted)}
                                className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold transition-all flex items-center gap-0.5 cursor-pointer border shrink-0 ${
                                    isMicMuted 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs' 
                                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 border-slate-200 dark:border-slate-700 shadow-3xs'
                                }`}
                            >
                                {isMicMuted ? (
                                    <>
                                        <Mic size={8} />
                                        <span>Unmute</span>
                                    </>
                                ) : (
                                    <>
                                        <MicOff size={8} />
                                        <span>Mute</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
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
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto pb-24 px-4"
            >
                {/* Result header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <span className="px-3 py-1 bg-[#0500e2]/10 dark:bg-[#4b53fa]/10 text-[#0500e2] dark:text-[#4b53fa] rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Session Evaluation
                        </span>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">Practice Scorecard</h2>
                    </div>
                    <button 
                        onClick={() => setView('list')} 
                        className="px-6 py-3 bg-[#0500e2] hover:bg-[#0400c0] text-white font-bold rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                        Return to Hub
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {/* Overall Score */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 rounded-3xl text-center shadow-sm relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                        <p className="text-xs font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-widest mb-2.5">Fluency Score</p>
                        <p className="text-6xl font-black text-emerald-600 mb-2.5">{result.score}%</p>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                            Grade: {result.score >= 90 ? 'Fluent (C2)' : result.score >= 75 ? 'Proficient (B2)' : 'Learner (A2)'}
                        </p>
                    </div>

                    {/* Stats feedback */}
                    <div className="bg-[#0500e2] text-white rounded-3xl p-8 sm:col-span-2 shadow-md relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-white/15">
                                XP Earned
                            </span>
                            <h3 className="text-4xl font-extrabold text-emerald-400 mt-3.5">+{Math.round(result.score * 1.2) + 60} XP</h3>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed mt-4">
                            You completed <strong>{formatTime(sessionDuration)}</strong> of intensive speech practice! Complete daily challenges to grow your global fluency streak.
                        </p>
                    </div>
                </div>

                {/* Scorecard Detailed Metrics */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-10 shadow-sm space-y-8 mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Language Skills Evaluation</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Detailed feedback on grammar, syntax, conversational vocabulary, and flow.</p>
                    </div>

                    <div className="space-y-4">
                        {result.criteriaResults.map((crit, idx) => (
                            <div key={idx} className="bg-slate-50/50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-150/40 dark:border-slate-800/80">
                                <div className="flex justify-between items-center mb-3.5">
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                            {crit.name}
                                        </h4>
                                        <span className="text-[10px] text-[#4b53fa] dark:text-[#4b53fa] font-extrabold uppercase tracking-wider mt-1">
                                            {getMetricWeight(crit.name)}
                                        </span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                                        crit.score >= 85 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                        crit.score >= 70 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                        'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                    }`}>
                                        {crit.score}/100
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm leading-relaxed text-slate-655 dark:text-slate-350">
                                    <p><strong className="text-slate-800 dark:text-slate-200">Reasoning:</strong> {crit.reasoning}</p>
                                    <p><strong className="text-[#0500e2] dark:text-[#4b53fa]">Coaching Tip:</strong> {crit.suggestion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversation Breakdown Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-10 shadow-sm space-y-8 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Conversation Breakdown</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Key strengths, grammar/vocabulary mistakes, and natural local phrasings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/30 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4 text-emerald-750 dark:text-emerald-400 font-bold">
                                <CheckCircle size={18} />
                                <h4>Strengths</h4>
                            </div>
                            {result.strengths && result.strengths.length > 0 ? (
                                <ul className="space-y-3">
                                    {result.strengths.map((strength, sIdx) => (
                                        <li key={sIdx} className="flex gap-2.5 text-sm text-slate-705 dark:text-slate-300 leading-relaxed">
                                            <span className="text-emerald-500 font-bold select-none">•</span>
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-400">No specific strengths captured.</p>
                            )}
                        </div>

                        {/* Mistakes */}
                        <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/40 dark:border-rose-900/30 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4 text-rose-750 dark:text-rose-450 font-bold">
                                <X size={18} className="text-rose-500" />
                                <h4>Mistakes & Adjustments</h4>
                            </div>
                            {result.mistakes && result.mistakes.length > 0 ? (
                                <ul className="space-y-3">
                                    {result.mistakes.map((mistake, mIdx) => (
                                        <li key={mIdx} className="flex gap-2.5 text-sm text-slate-705 dark:text-slate-300 leading-relaxed">
                                            <span className="text-rose-500 font-bold select-none">•</span>
                                            <span>{mistake}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-400">No major mistakes detected.</p>
                            )}
                        </div>
                    </div>

                    {/* Native Alternatives */}
                    <div className="pt-4">
                        <div className="flex items-center gap-2 mb-4 text-[#0500e2] dark:text-[#4b53fa] font-bold">
                            <Sparkles size={18} />
                            <h4>Native Speaker Alternatives</h4>
                        </div>
                        {result.nativeAlternatives && result.nativeAlternatives.length > 0 ? (
                            <div className="space-y-4">
                                {result.nativeAlternatives.map((alt, aIdx) => (
                                    <div key={aIdx} className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                            <div>
                                                <p className="text-xs font-bold text-slate-405 uppercase tracking-wider mb-1.5">What You Said</p>
                                                <p className="text-sm text-rose-600 dark:text-rose-400 font-mono line-through bg-rose-500/5 px-3.5 py-2 rounded-xl border border-rose-500/10">
                                                    "{alt.original}"
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">A Native Would Say</p>
                                                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/5 px-3.5 py-2 rounded-xl border border-emerald-500/10">
                                                    "{alt.better}"
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                                            <strong className="text-[#0500e2] dark:text-[#4b53fa]">Why?</strong> {alt.explanation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">No phrasing alternatives suggested for this session.</p>
                        )}
                    </div>
                </div>

                {/* AI Assessment */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-10 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Revu Tutor Assessment</h3>
                        <p className="text-slate-500 text-sm mt-1">General summaries of conversational strengths and next exercises.</p>
                    </div>
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-950 rounded-2xl border border-slate-150/40 dark:border-slate-850">
                        <p className="text-slate-700 dark:text-slate-350 leading-relaxed text-sm font-medium">{result.feedback}</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // --- VIEW: Scenarios Hub / List ---
    return (
        <div className="pb-16 space-y-8 animate-fade-in">
            {/* Header section - Solid, high-end minimal design */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 p-8 md:p-10">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0500e2]/5 dark:bg-[#4b53fa]/10 text-[#0500e2] dark:text-[#4b53fa] rounded-full text-xs font-bold tracking-wide uppercase border border-[#0500e2]/10 dark:border-[#4b53fa]/20">
                            <Languages size={13} className="text-[#0500e2] dark:text-[#4b53fa]" />
                            <span>AI Language Practice Lounge</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                            Become Fluent, One Conversation at a Time.
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
                            Practice speaking and chatting in real-life situations with adaptive AI companions. Learn at your own pace and receive customized feedback on grammar, syntax, vocabulary, and pronunciation.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setView('create')} 
                        className="px-6 py-3.5 bg-[#0500e2] hover:bg-[#3b36e8] dark:bg-[#0500e2] dark:hover:bg-[#4b53fa] text-white rounded-xl font-bold text-sm shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-center gap-2 self-start lg:self-center shrink-0 border border-[#0500e2]/10 cursor-pointer"
                    >
                        <Plus size={16} /> New Scenario
                    </button>
                </div>
            </div>

            {/* Quick Stats banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Fluency XP Earned", value: `${totalXP} XP`, icon: Trophy, desc: "Cumulative skill points" },
                    { label: "Avg Practice Score", value: `${avgScore}%`, icon: Award, desc: "Performance across sessions" },
                    { label: "Sessions Completed", value: `${totalAttempts} Sessions`, icon: BookOpen, desc: "Active roleplay logs" }
                ].map((stat, sIdx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={sIdx} className="bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-855 p-6 rounded-2xl transition-all duration-300 flex items-center justify-between shadow-xs">
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider block">
                                    {stat.label}
                                </span>
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-white block tracking-tight">
                                    {stat.value}
                                </span>
                                <span className="text-xs text-slate-450 dark:text-slate-555 block font-normal">
                                    {stat.desc}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-[#0500e2] dark:text-[#4b53fa] rounded-xl border border-slate-100 dark:border-slate-800/40">
                                <Icon size={20} className="stroke-[1.75]" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-5 justify-between items-stretch sm:items-center border-b border-slate-150 dark:border-slate-855 pb-4">
                <div className="flex gap-6">
                    <button 
                        onClick={() => setActiveTab('scenarios')} 
                        className={`pb-3 font-bold text-xs md:text-sm tracking-wide transition-all relative cursor-pointer ${activeTab === 'scenarios' ? 'text-[#0500e2] dark:text-[#4b53fa]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Conversational Scenarios
                        {activeTab === 'scenarios' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#0500e2] dark:bg-[#4b53fa]"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        className={`pb-3 font-bold text-xs md:text-sm tracking-wide transition-all relative cursor-pointer ${activeTab === 'history' ? 'text-[#0500e2] dark:text-[#4b53fa]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Practice Log
                        {activeTab === 'history' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#0500e2] dark:bg-[#4b53fa]"></span>}
                    </button>
                </div>

                {activeTab === 'scenarios' && (
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative">
                            <select 
                                value={selectedLanguageFilter}
                                onChange={(e) => setSelectedLanguageFilter(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:border-[#0500e2]/50 cursor-pointer transition-all min-w-[130px]"
                            >
                                <option value="All">All Languages</option>
                                {availableLanguages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 text-[9px]">▼</span>
                        </div>
                        <div className="relative">
                            <select 
                                value={selectedDifficultyFilter}
                                onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:border-[#0500e2]/50 cursor-pointer transition-all min-w-[120px]"
                            >
                                <option value="All">All Levels</option>
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                                <option value="C2">C2</option>
                            </select>
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 text-[9px]">▼</span>
                        </div>
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
                    <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-855">
                        <p className="text-slate-450 dark:text-slate-500 text-sm">No scenarios match your language/level filters.</p>
                        <button 
                            onClick={() => { setSelectedLanguageFilter('All'); setSelectedDifficultyFilter('All'); }}
                            className="mt-3 text-xs text-[#0500e2] dark:text-[#4b53fa] hover:underline font-bold"
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
                                scenario.category === 'Support' ? 'Travel & Shopping' : 
                                scenario.category === 'Technical' ? 'Professional & Business' : 
                                scenario.category;

                            const levelLabel = 
                                scenario.difficulty === 'Beginner' ? 'A1' :
                                scenario.difficulty === 'Intermediate' ? 'B1' : 
                                scenario.difficulty === 'Advanced' ? 'C1' :
                                scenario.difficulty;

                            const IconComponent = 
                                scenario.category === 'Sales' || scenario.category === 'Social Conversation' ? MessageSquare : 
                                scenario.category === 'Support' || scenario.category === 'Travel & Shopping' ? Compass : 
                                scenario.category === 'Technical' || scenario.category === 'Professional & Business' ? Briefcase : 
                                scenario.category === 'Academic & Study' ? BookOpen :
                                scenario.category === 'Technical & IT' ? Wrench : 
                                Smile;

                            const difficultyColor = 
                                (scenario.difficulty === 'Beginner' || scenario.difficulty?.startsWith('A')) ? 'bg-emerald-500' :
                                (scenario.difficulty === 'Intermediate' || scenario.difficulty?.startsWith('B')) ? 'bg-amber-500' : 'bg-rose-500';

                            return (
                                <div 
                                    key={scenario.id} 
                                    className="group bg-white dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-150 dark:border-slate-855/80 hover:border-[#0500e2]/25 dark:hover:border-[#4b53fa]/25 rounded-2xl p-6 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Top Info row */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-slate-50 dark:bg-slate-800 text-[#0500e2] dark:text-[#4b53fa] rounded-lg border border-slate-100 dark:border-slate-800/60">
                                                    <IconComponent size={14} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    {uiCategory}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="px-2.5 py-0.5 bg-[#0500e2]/5 dark:bg-[#4b53fa]/10 text-[#0500e2] dark:text-[#4b53fa] border border-[#0500e2]/10 dark:border-[#4b53fa]/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                    {scenario.language || 'English'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug tracking-tight mb-2 group-hover:text-[#0500e2] dark:group-hover:text-white transition-colors">
                                            {scenario.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal line-clamp-3 mb-6">
                                            {scenario.description}
                                        </p>
                                    </div>

                                    {/* Action Row */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-855/60 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${difficultyColor}`}></span>
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                {levelLabel}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5">
                                            {user && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); confirmDelete(scenario.id, e); }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-455 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer mr-1"
                                                    title="Delete Custom Scenario"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => selectScenario(scenario, 'text')}
                                                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                <MessageSquare size={12} className="opacity-70 text-slate-450" />
                                                <span>Chat</span>
                                            </button>
                                            <button 
                                                onClick={() => selectScenario(scenario, 'voice')}
                                                className="px-3.5 py-1.5 bg-[#0500e2] hover:bg-[#3b36e8] dark:bg-[#0500e2] dark:hover:bg-[#4b53fa] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                                            >
                                                <Mic size={12} />
                                                <span>Call</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* History Tab */
                languageHistory.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-855">
                        <p className="text-slate-450 dark:text-slate-500 text-sm">No practice logs found. Complete a conversational scenario to begin tracking your fluency.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-855 shadow-3xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                                <thead className="text-xs font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-855">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Date</th>
                                        <th scope="col" className="px-6 py-4">Target Language / Roleplay</th>
                                        <th scope="col" className="px-6 py-4">Detailed Performance</th>
                                        <th scope="col" className="px-6 py-4 text-right">Fluency Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                                    {languageHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-all">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium text-xs">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                    {item.customerName?.replace('Roleplay:', '') || 'Custom Practice'}
                                                </div>
                                                <div className="text-xs text-[#0500e2] dark:text-[#4b53fa] font-semibold mt-0.5">
                                                    {item.agentName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="line-clamp-2 leading-relaxed text-slate-600 dark:text-slate-300 text-xs">
                                                    {item.summary?.replace('Training Session', 'Practice Session')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className={`px-2.5 py-1 rounded-lg font-extrabold ${
                                                    item.overallScore >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                                    item.overallScore >= 75 ? 'bg-[#0500e2]/5 text-[#0500e2] dark:bg-[#4b53fa]/10 dark:text-[#4b53fa]' :
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
