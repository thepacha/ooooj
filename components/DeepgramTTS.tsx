import React, { useState, useRef } from 'react';
import { Play, Loader2, Volume2, Settings2, Download, AlertTriangle, Sparkles, ChevronDown, History as HistoryIcon, Search, Trash2, RotateCcw, Clock, X } from 'lucide-react';
import { getAI, Modality } from '../services/geminiService';

export interface PronunciationHistoryItem {
    id: string;
    text: string;
    modelId: string;
    modelName: string;
    language: string;
    timestamp: string;
    audioUrl?: string;
}

const DEEPGRAM_MODELS = [
  // English (US) - 4 models
  { id: 'aura-2-thalia-en', name: 'Thalia', language: 'English (US)', gender: 'Feminine', description: 'Clear, Confident, Energetic' },
  { id: 'aura-2-andromeda-en', name: 'Andromeda', language: 'English (US)', gender: 'Feminine', description: 'Casual, Expressive, Comfortable' },
  { id: 'aura-2-apollo-en', name: 'Apollo', language: 'English (US)', gender: 'Masculine', description: 'Confident, Comfortable, Casual' },
  { id: 'aura-2-arcas-en', name: 'Arcas', language: 'English (US)', gender: 'Masculine', description: 'Natural, Smooth, Clear' },

  // English (UK) - 4 models
  { id: 'aura-2-draco-en', name: 'Draco', language: 'English (UK)', gender: 'Masculine', description: 'Warm, Approachable, Trustworthy' },
  { id: 'aura-2-pandora-en', name: 'Pandora', language: 'English (UK)', gender: 'Feminine', description: 'Smooth, Calm, Melodic' },
  { id: 'aura-athena-en', name: 'Athena', language: 'English (UK)', gender: 'Feminine', description: 'Calm, Smooth, Professional' },
  { id: 'aura-helios-en', name: 'Helios', language: 'English (UK)', gender: 'Masculine', description: 'Professional, Clear, Confident' },

  // English (PH) - 1 model
  { id: 'aura-2-amalthea-en', name: 'Amalthea', language: 'English (PH)', gender: 'Feminine', description: 'Engaging, Natural, Cheerful' },

  // English (AU) - 2 models
  { id: 'aura-2-hyperion-en', name: 'Hyperion', language: 'English (AU)', gender: 'Masculine', description: 'Caring, Warm, Empathetic' },
  { id: 'aura-2-theia-en', name: 'Theia', language: 'English (AU)', gender: 'Feminine', description: 'Expressive, Polite, Sincere' },

  // English (IE) - 1 model
  { id: 'aura-angus-en', name: 'Angus', language: 'English (IE)', gender: 'Masculine', description: 'Warm, Friendly, Natural' },

  // Spanish (ES) - 4 models
  { id: 'aura-2-nestor-es', name: 'Nestor', language: 'Spanish (ES)', gender: 'Masculine', description: 'Calm, Professional, Clear' },
  { id: 'aura-2-carina-es', name: 'Carina', language: 'Spanish (ES)', gender: 'Feminine', description: 'Professional, Energetic' },
  { id: 'aura-2-alvaro-es', name: 'Alvaro', language: 'Spanish (ES)', gender: 'Masculine', description: 'Calm, Professional, Knowledgeable' },
  { id: 'aura-2-diana-es', name: 'Diana', language: 'Spanish (ES)', gender: 'Feminine', description: 'Professional, Confident, Expressive' },

  // Spanish (MX) - 4 models
  { id: 'aura-2-estrella-es', name: 'Estrella', language: 'Spanish (MX)', gender: 'Feminine', description: 'Approachable, Natural, Calm' },
  { id: 'aura-2-sirio-es', name: 'Sirio', language: 'Spanish (MX)', gender: 'Masculine', description: 'Calm, Professional, Baritone' },
  { id: 'aura-2-javier-es', name: 'Javier', language: 'Spanish (MX)', gender: 'Masculine', description: 'Approachable, Friendly, Calm' },
  { id: 'aura-2-luciano-es', name: 'Luciano', language: 'Spanish (MX)', gender: 'Masculine', description: 'Charismatic, Cheerful, Energetic' },

  // Spanish (CO) - 2 models
  { id: 'aura-2-celeste-es', name: 'Celeste', language: 'Spanish (CO)', gender: 'Feminine', description: 'Clear, Energetic, Positive' },
  { id: 'aura-2-gloria-es', name: 'Gloria', language: 'Spanish (CO)', gender: 'Feminine', description: 'Casual, Clear, Smooth' },

  // Spanish (LATAM) - 2 models
  { id: 'aura-2-aquila-es', name: 'Aquila', language: 'Spanish (LATAM)', gender: 'Masculine', description: 'Expressive, Enthusiastic' },
  { id: 'aura-2-selena-es', name: 'Selena', language: 'Spanish (LATAM)', gender: 'Feminine', description: 'Approachable, Friendly, Calm' },

  // Spanish (AR) - 1 model
  { id: 'aura-2-antonia-es', name: 'Antonia', language: 'Spanish (AR)', gender: 'Feminine', description: 'Approachable, Enthusiastic' },

  // Turkish - 4 models
  { id: 'aura-2-seda-tr', name: 'Seda', language: 'Turkish', gender: 'Feminine', description: 'Natural, Clear, Professional' },
  { id: 'aura-2-emre-tr', name: 'Emre', language: 'Turkish', gender: 'Masculine', description: 'Warm, Confident, Articulate' },
  { id: 'gemini-tts-zephyr-turkish', name: 'Selin (Gemini)', language: 'Turkish', gender: 'Feminine', description: 'Gemini TTS - Clear & Natural Turkish' },
  { id: 'gemini-tts-kore-turkish', name: 'Kaan (Gemini)', language: 'Turkish', gender: 'Masculine', description: 'Gemini TTS - Expressive Turkish' },

  // Chinese - 4 models
  { id: 'aura-2-lin-zh', name: 'Lin', language: 'Chinese (Mandarin)', gender: 'Feminine', description: 'Clear, Elegant, Professional' },
  { id: 'aura-2-ming-zh', name: 'Ming', language: 'Chinese (Mandarin)', gender: 'Masculine', description: 'Calm, Confident, Natural' },
  { id: 'gemini-tts-zephyr-chinese', name: 'Mei (Gemini)', language: 'Chinese (Mandarin)', gender: 'Feminine', description: 'Gemini TTS - Expressive Mandarin' },
  { id: 'gemini-tts-puck-chinese', name: 'Wei (Gemini)', language: 'Chinese (Mandarin)', gender: 'Masculine', description: 'Gemini TTS - Natural Mandarin' },

  // Danish - 4 models
  { id: 'aura-2-freja-da', name: 'Freja', language: 'Danish', gender: 'Feminine', description: 'Clear, Cheerful, Natural' },
  { id: 'aura-2-kristian-da', name: 'Kristian', language: 'Danish', gender: 'Masculine', description: 'Calm, Confident, Professional' },
  { id: 'gemini-tts-zephyr-danish', name: 'Astrid (Gemini)', language: 'Danish', gender: 'Feminine', description: 'Gemini TTS - Smooth Danish' },
  { id: 'gemini-tts-kore-danish', name: 'Lars (Gemini)', language: 'Danish', gender: 'Masculine', description: 'Gemini TTS - Expressive Danish' },

  // Dutch - 4 models
  { id: 'aura-2-rhea-nl', name: 'Rhea', language: 'Dutch', gender: 'Feminine', description: 'Caring, Knowledgeable, Positive' },
  { id: 'aura-2-sander-nl', name: 'Sander', language: 'Dutch', gender: 'Masculine', description: 'Calm, Clear, Deep, Professional' },
  { id: 'aura-2-beatrix-nl', name: 'Beatrix', language: 'Dutch', gender: 'Feminine', description: 'Cheerful, Enthusiastic, Friendly' },
  { id: 'aura-2-daphne-nl', name: 'Daphne', language: 'Dutch', gender: 'Feminine', description: 'Calm, Clear, Confident' },

  // French - 4 models
  { id: 'aura-2-agathe-fr', name: 'Agathe', language: 'French', gender: 'Feminine', description: 'Charismatic, Cheerful, Friendly' },
  { id: 'aura-2-hector-fr', name: 'Hector', language: 'French', gender: 'Masculine', description: 'Confident, Empathetic, Expressive' },
  { id: 'gemini-tts-zephyr-french', name: 'Camille (Gemini)', language: 'French', gender: 'Feminine', description: 'Gemini TTS - Elegant French' },
  { id: 'gemini-tts-kore-french', name: 'Antoine (Gemini)', language: 'French', gender: 'Masculine', description: 'Gemini TTS - Natural French' },

  // German - 4 models
  { id: 'aura-2-julius-de', name: 'Julius', language: 'German', gender: 'Masculine', description: 'Casual, Cheerful, Engaging' },
  { id: 'aura-2-viktoria-de', name: 'Viktoria', language: 'German', gender: 'Feminine', description: 'Charismatic, Cheerful, Warm' },
  { id: 'aura-2-elara-de', name: 'Elara', language: 'German', gender: 'Feminine', description: 'Calm, Clear, Natural' },
  { id: 'aura-2-aurelia-de', name: 'Aurelia', language: 'German', gender: 'Feminine', description: 'Approachable, Casual, Sincere' },

  // Italian - 4 models
  { id: 'aura-2-livia-it', name: 'Livia', language: 'Italian', gender: 'Feminine', description: 'Approachable, Cheerful, Clear' },
  { id: 'aura-2-dionisio-it', name: 'Dionisio', language: 'Italian', gender: 'Masculine', description: 'Confident, Engaging, Friendly' },
  { id: 'aura-2-melia-it', name: 'Melia', language: 'Italian', gender: 'Feminine', description: 'Clear, Comfortable, Natural' },
  { id: 'aura-2-elio-it', name: 'Elio', language: 'Italian', gender: 'Masculine', description: 'Breathy, Calm, Professional' },

  // Japanese - 4 models
  { id: 'aura-2-fujin-ja', name: 'Fujin', language: 'Japanese', gender: 'Masculine', description: 'Calm, Confident, Professional' },
  { id: 'aura-2-izanami-ja', name: 'Izanami', language: 'Japanese', gender: 'Feminine', description: 'Approachable, Clear, Polite' },
  { id: 'aura-2-uzume-ja', name: 'Uzume', language: 'Japanese', gender: 'Feminine', description: 'Approachable, Clear, Trustworthy' },
  { id: 'aura-2-ebisu-ja', name: 'Ebisu', language: 'Japanese', gender: 'Masculine', description: 'Calm, Deep, Natural' },

  // Korean - 4 models
  { id: 'aura-2-minseok-ko', name: 'Min-seok', language: 'Korean', gender: 'Masculine', description: 'Warm, Clear, Professional' },
  { id: 'aura-2-jiwon-ko', name: 'Ji-won', language: 'Korean', gender: 'Feminine', description: 'Friendly, Natural, Cheerful' },
  { id: 'gemini-tts-zephyr-korean', name: 'Su-jin (Gemini)', language: 'Korean', gender: 'Feminine', description: 'Gemini TTS - Expressive Korean' },
  { id: 'gemini-tts-kore-korean', name: 'Min-woo (Gemini)', language: 'Korean', gender: 'Masculine', description: 'Gemini TTS - Professional Korean' },

  // Portuguese (BR) - 4 models
  { id: 'aura-2-camila-pt', name: 'Camila', language: 'Portuguese (BR)', gender: 'Feminine', description: 'Clear, Energetic, Natural' },
  { id: 'aura-2-tiago-pt', name: 'Tiago', language: 'Portuguese (BR)', gender: 'Masculine', description: 'Warm, Friendly, Confident' },
  { id: 'gemini-tts-zephyr-portuguese', name: 'Isabela (Gemini)', language: 'Portuguese (BR)', gender: 'Feminine', description: 'Gemini TTS - Warm Portuguese' },
  { id: 'gemini-tts-kore-portuguese', name: 'Lucas (Gemini)', language: 'Portuguese (BR)', gender: 'Masculine', description: 'Gemini TTS - Clear Portuguese' },

  // Portuguese (PT) - 2 models
  { id: 'aura-2-ines-pt', name: 'Inês', language: 'Portuguese (PT)', gender: 'Feminine', description: 'Natural, Polite, Professional' },
  { id: 'aura-2-diogo-pt', name: 'Diogo', language: 'Portuguese (PT)', gender: 'Masculine', description: 'Clear, Calm, Trustworthy' },

  // Russian - 4 models
  { id: 'aura-2-anya-ru', name: 'Anya', language: 'Russian', gender: 'Feminine', description: 'Clear, Expressive, Friendly' },
  { id: 'aura-2-dmitry-ru', name: 'Dmitry', language: 'Russian', gender: 'Masculine', description: 'Calm, Deep, Professional' },
  { id: 'gemini-tts-zephyr-russian', name: 'Elena (Gemini)', language: 'Russian', gender: 'Feminine', description: 'Gemini TTS - Natural Russian' },
  { id: 'gemini-tts-kore-russian', name: 'Ivan (Gemini)', language: 'Russian', gender: 'Masculine', description: 'Gemini TTS - Confident Russian' },

  // Arabic Dialects (Gemini TTS) - 1 model each
  { id: 'gemini-tts-zephyr-egyptian', name: 'Amr (Gemini)', language: 'Arabic (Egyptian)', gender: 'Masculine', description: 'Gemini TTS - Egyptian Dialect' },
  { id: 'gemini-tts-kore-levantine', name: 'Layla (Gemini)', language: 'Arabic (Levantine)', gender: 'Feminine', description: 'Gemini TTS - Levantine Dialect' },
  { id: 'gemini-tts-puck-gulf', name: 'Faisal (Gemini)', language: 'Arabic (Gulf)', gender: 'Masculine', description: 'Gemini TTS - Gulf Dialect' },
  { id: 'gemini-tts-charon-maghrebi', name: 'Youssef (Gemini)', language: 'Arabic (Maghrebi)', gender: 'Masculine', description: 'Gemini TTS - Maghrebi Dialect' },
  { id: 'gemini-tts-fenrir-msa', name: 'Hamza (Gemini)', language: 'Arabic (MSA)', gender: 'Masculine', description: 'Gemini TTS - Modern Standard Arabic' }
];

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function createWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    return new Uint8Array(buffer);
}

export const DeepgramTTS: React.FC = () => {
    const [text, setText] = useState('Hello, how can I help you today?');
    const [selectedModel, setSelectedModel] = useState(DEEPGRAM_MODELS[0].id);
    const [languageFilter, setLanguageFilter] = useState('English (US)');
    const [genderFilter, setGenderFilter] = useState('All');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Pronunciation History state
    const [history, setHistory] = useState<PronunciationHistoryItem[]>(() => {
        try {
            const saved = localStorage.getItem('pronunciation_checker_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [historySearch, setHistorySearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: 'single' | 'all';
        itemId?: string;
        itemText?: string;
    } | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    const uniqueLanguages = ['All', ...Array.from(new Set(DEEPGRAM_MODELS.map(m => m.language)))];
    const uniqueGenders = ['All', ...Array.from(new Set(DEEPGRAM_MODELS.map(m => m.gender)))];

    const filteredModels = DEEPGRAM_MODELS.filter(model => {
        const matchLanguage = languageFilter === 'All' || model.language === languageFilter;
        const matchGender = genderFilter === 'All' || model.gender === genderFilter;
        return matchLanguage && matchGender;
    });

    const selectedModelDetails = DEEPGRAM_MODELS.find(m => m.id === selectedModel);

    const handleGenerateDemo = async () => {
        setIsGeneratingDemo(true);
        setError(null);
        try {
            const currentLang = languageFilter !== 'All' ? languageFilter : (selectedModelDetails?.language || 'English');
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Write a short, natural, and realistic speech sentence (1-2 sentences) in ${currentLang} that is ideal for practicing pronunciation in ${currentLang}. Do not include quotation marks, translations, or formatting. Output strictly text in ${currentLang}.`,
            });
            if (response.text) {
                setText(response.text.trim().slice(0, 500));
            }
        } catch (e: any) {
            console.error('Gemini Error:', e);
            setError(e.message || 'Failed to generate demo text.');
        } finally {
            setIsGeneratingDemo(false);
        }
    };

    const saveToHistory = (checkedText: string, modelId: string, url: string) => {
        const modelInfo = DEEPGRAM_MODELS.find(m => m.id === modelId);
        const newItem: PronunciationHistoryItem = {
            id: Date.now().toString(),
            text: checkedText.trim(),
            modelId: modelId,
            modelName: modelInfo?.name || modelId,
            language: modelInfo?.language || 'Unknown',
            timestamp: new Date().toISOString(),
            audioUrl: url
        };

        setHistory(prev => {
            const filtered = prev.filter(item => !(item.text.toLowerCase() === checkedText.trim().toLowerCase() && item.modelId === modelId));
            const updated = [newItem, ...filtered].slice(0, 50);
            try {
                localStorage.setItem('pronunciation_checker_history', JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save pronunciation history to localStorage:', e);
            }
            return updated;
        });
    };

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Please enter some text to check pronunciation.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setAudioUrl(null);

        try {
            let blob: Blob;

            if (selectedModel.startsWith('gemini-tts-')) {
                const parts = selectedModel.split('-');
                const voiceName = parts[2];
                const dialect = parts.slice(3).join('-');
                
                let promptText = text;
                if (dialect === 'egyptian') promptText = `Speak in an Egyptian Arabic dialect: ${text}`;
                else if (dialect === 'levantine') promptText = `Speak in a Levantine Arabic dialect: ${text}`;
                else if (dialect === 'gulf') promptText = `Speak in a Gulf Arabic dialect: ${text}`;
                else if (dialect === 'maghrebi') promptText = `Speak in a Maghrebi Arabic dialect: ${text}`;
                else if (dialect === 'msa') promptText = `Speak in Modern Standard Arabic: ${text}`;
                else if (dialect) promptText = `Speak in ${dialect}: ${text}`;

                const ai = getAI();
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: promptText }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: voiceName.charAt(0).toUpperCase() + voiceName.slice(1) },
                            },
                        },
                    },
                });

                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!base64Audio) {
                    throw new Error("Failed to generate audio from Gemini.");
                }

                const byteCharacters = atob(base64Audio);
                const isWav = byteCharacters.startsWith('RIFF');
                
                if (isWav) {
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    blob = new Blob([byteArray], { type: 'audio/wav' });
                } else {
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const pcmData = new Uint8Array(byteNumbers);
                    const wavHeader = createWavHeader(pcmData.length, 24000, 1, 16);
                    const wavData = new Uint8Array(wavHeader.length + pcmData.length);
                    wavData.set(wavHeader);
                    wavData.set(pcmData, wavHeader.length);
                    blob = new Blob([wavData], { type: 'audio/wav' });
                }
            } else {
                try {
                    const response = await fetch('/api/deepgram/tts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text,
                            model: selectedModel
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.error || 'Deepgram TTS API error');
                    }

                    blob = await response.blob();
                } catch (deepgramErr) {
                    console.warn("Deepgram API request issue, falling back to Gemini TTS:", deepgramErr);
                    const ai = getAI();
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-preview-tts",
                        contents: [{ parts: [{ text: `Speak in clear ${selectedModelDetails?.language || 'English'}: ${text}` }] }],
                        config: {
                            responseModalities: [Modality.AUDIO],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: "Puck" },
                                },
                            },
                        },
                    });

                    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (!base64Audio) {
                        throw new Error("Failed to generate fallback audio.");
                    }
                    const byteCharacters = atob(base64Audio);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const pcmData = new Uint8Array(byteNumbers);
                    const wavHeader = createWavHeader(pcmData.length, 24000, 1, 16);
                    const wavData = new Uint8Array(wavHeader.length + pcmData.length);
                    wavData.set(wavHeader);
                    wavData.set(pcmData, wavHeader.length);
                    blob = new Blob([wavData], { type: 'audio/wav' });
                }
            }

            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

            // Save to History
            saveToHistory(text, selectedModel, url);

            // Auto play
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play();
                }
            }, 100);

        } catch (e: any) {
            console.error('TTS Error:', e);
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLoadHistoryItem = (item: PronunciationHistoryItem) => {
        setText(item.text);
        if (DEEPGRAM_MODELS.some(m => m.id === item.modelId)) {
            setSelectedModel(item.modelId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePlayHistoryAudio = (item: PronunciationHistoryItem) => {
        if (item.audioUrl) {
            setAudioUrl(item.audioUrl);
            setTimeout(() => {
                if (audioRef.current) audioRef.current.play();
            }, 100);
        } else {
            setText(item.text);
            if (DEEPGRAM_MODELS.some(m => m.id === item.modelId)) {
                setSelectedModel(item.modelId);
            }
            handleGenerate();
        }
    };

    const handleDeleteHistoryItem = (id: string, text: string) => {
        setDeleteConfirm({
            type: 'single',
            itemId: id,
            itemText: text
        });
    };

    const handleClearHistory = () => {
        setDeleteConfirm({
            type: 'all'
        });
    };

    const confirmDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'all') {
            setHistory([]);
            try {
                localStorage.removeItem('pronunciation_checker_history');
            } catch (e) {}
        } else if (deleteConfirm.type === 'single' && deleteConfirm.itemId) {
            setHistory(prev => {
                const updated = prev.filter(item => item.id !== deleteConfirm.itemId);
                try {
                    localStorage.setItem('pronunciation_checker_history', JSON.stringify(updated));
                } catch (e) {}
                return updated;
            });
        }
        setDeleteConfirm(null);
    };

    const filteredHistory = history.filter(item => 
        item.text.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.modelName.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.language.toLowerCase().includes(historySearch.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20 sm:pb-12 px-1 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3 flex-wrap">
                        <Volume2 className="text-[#0500e2] shrink-0" size={26} />
                        <span>Pronunciation Checker</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Generate crystal-clear speech for any word or phrase to practice, compare, and master your pronunciation across multiple accents.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-xs sm:text-sm">Generation Failed</h4>
                        <p className="text-xs mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* Input Word or Phrase Panel with Integrated Voice Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-1.5">
                            <Volume2 size={18} className="text-[#0500e2] shrink-0" />
                            <span>Input Word or Phrase</span>
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md sm:hidden">
                            {text.length}/500
                        </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleGenerateDemo}
                            disabled={isGeneratingDemo || isGenerating}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg font-semibold transition-colors disabled:opacity-50 min-h-[34px] sm:min-h-0"
                            title="Generate sample practice text"
                        >
                            {isGeneratingDemo ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                            <span>Demo Text</span>
                        </button>
                        <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {text.length}/500
                        </span>
                    </div>
                </div>

                {/* Textarea */}
                <div className="p-3 sm:p-4">
                    <textarea
                        value={text}
                        maxLength={500}
                        onChange={(e) => setText(e.target.value.slice(0, 500))}
                        placeholder="Enter a word, sentence, or phrase to check pronunciation (max 500 characters)..."
                        className="w-full h-32 sm:h-40 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent outline-none text-slate-900 dark:text-white transition-all text-sm leading-relaxed"
                    />
                </div>

                {/* Integrated Voice Settings Controls Toolbar (Collapsible at bottom) */}
                <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 transition-all">
                    <button
                        type="button"
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                <Settings2 size={14} className="text-[#0500e2] shrink-0" />
                                <span>Voice Settings</span>
                            </div>
                            {selectedModelDetails && (
                                <span className="text-[11px] bg-[#0500e2]/10 text-[#0500e2] font-semibold px-2 py-0.5 rounded-full truncate max-w-[150px] sm:max-w-xs">
                                    {selectedModelDetails.name} • {selectedModelDetails.language}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-slate-500 dark:text-slate-400">
                            <span className="text-[11px] font-medium hidden sm:inline">
                                {isSettingsOpen ? 'Hide' : 'Show'}
                            </span>
                            <ChevronDown size={16} className={`transform transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    {isSettingsOpen && (
                        <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-2.5 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                                <div className="flex flex-col gap-1 lg:col-span-3">
                                    <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Language</label>
                                    <select 
                                        value={languageFilter}
                                        onChange={(e) => {
                                            const newLang = e.target.value;
                                            setLanguageFilter(newLang);
                                            const matching = DEEPGRAM_MODELS.find(m => newLang === 'All' || m.language === newLang);
                                            if (matching) setSelectedModel(matching.id);
                                        }}
                                        className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-[#0500e2] text-slate-900 dark:text-white font-medium min-h-[38px]"
                                    >
                                        {uniqueLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 lg:col-span-3">
                                    <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Gender</label>
                                    <select 
                                        value={genderFilter}
                                        onChange={(e) => setGenderFilter(e.target.value)}
                                        className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-[#0500e2] text-slate-900 dark:text-white font-medium min-h-[38px]"
                                    >
                                        {uniqueGenders.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-6">
                                    <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                        Voice Model ({filteredModels.length} available)
                                    </label>
                                    <select 
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-[#0500e2] text-slate-900 dark:text-white font-semibold truncate min-h-[38px]"
                                    >
                                        {filteredModels.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} ({model.gender}) - {model.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                        Active Voice: <strong className="text-slate-900 dark:text-white">{selectedModelDetails?.name}</strong> ({selectedModelDetails?.language})
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !text.trim()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#0500e2]/20 tracking-wide uppercase text-xs sm:text-sm min-h-[44px]"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Checking Pronunciation...
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                CHECK PRONUNCIATION
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Audio Player */}
            {audioUrl && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Checked Audio</h3>
                        {selectedModelDetails && (
                            <span className="text-xs text-[#0500e2] font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
                                {selectedModelDetails.name} ({selectedModelDetails.language})
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                        <a 
                            href={audioUrl} 
                            download={`pronunciation-${selectedModel}-${Date.now()}.wav`}
                            className="p-2.5 sm:p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                            title="Download Audio"
                        >
                            <Download size={18} />
                        </a>
                    </div>
                </div>
            )}

            {/* Pronunciation History Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <HistoryIcon size={18} className="text-[#0500e2]" />
                            <span>History</span>
                            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-[#0500e2] dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                                {history.length}
                            </span>
                        </h3>
                        {history.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="sm:hidden flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800/40"
                            >
                                <Trash2 size={12} />
                                Clear
                            </button>
                        )}
                    </div>

                    {history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/40 transition-colors"
                        >
                            <Trash2 size={14} />
                            Clear History
                        </button>
                    )}
                </div>

                {history.length > 0 && (
                    <div className="relative mb-3.5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            placeholder="Search history..."
                            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0500e2] text-slate-900 dark:text-white"
                        />
                        {historySearch && (
                            <button
                                onClick={() => setHistorySearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {filteredHistory.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-3">
                        <Volume2 className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={28} />
                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                            {historySearch ? 'No history matching your search.' : 'No checked words or phrases yet.'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            Enter text above and click "CHECK PRONUNCIATION" to save checked items here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredHistory.map((item) => (
                            <div
                                key={item.id}
                                className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                            >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#0500e2] dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-900/40">
                                            {item.modelName}
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {item.language}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                                        <Clock size={11} />
                                        {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 break-words leading-relaxed">
                                    "{item.text}"
                                </p>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                                    <button
                                        onClick={() => handleLoadHistoryItem(item)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-[#0500e2] border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
                                        title="Load phrase into editor"
                                    >
                                        <RotateCcw size={12} />
                                        <span>Practice</span>
                                    </button>
                                    <button
                                        onClick={() => handlePlayHistoryAudio(item)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#0500e2] text-white hover:bg-[#0400c0] rounded-lg transition-colors shadow-xs"
                                        title="Play audio"
                                    >
                                        <Play size={12} />
                                        <span>Listen</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteHistoryItem(item.id, item.text)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1"
                                        title="Delete from history"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <button 
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                {deleteConfirm.type === 'all' ? 'Clear All History?' : 'Delete Phrase?'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {deleteConfirm.type === 'all' ? (
                                    'Are you sure you want to clear all saved pronunciation history items? This action cannot be undone.'
                                ) : (
                                    <>
                                        Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">"{deleteConfirm.itemText}"</span> from your history?
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[38px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-md shadow-red-600/20 min-h-[38px]"
                            >
                                {deleteConfirm.type === 'all' ? 'Clear All' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
