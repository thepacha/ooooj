import React, { useState, useRef } from 'react';
import { Play, Square, Loader2, Volume2, Settings2, Download, AlertTriangle, Sparkles } from 'lucide-react';
import { getAI } from '../services/geminiService';
import { Modality } from '@google/genai';

const DEEPGRAM_MODELS = [
  { id: 'aura-2-thalia-en', name: 'Thalia', language: 'English (US)', gender: 'Feminine', description: 'Clear, Confident, Energetic, Enthusiastic' },
  { id: 'aura-2-andromeda-en', name: 'Andromeda', language: 'English (US)', gender: 'Feminine', description: 'Casual, Expressive, Comfortable' },
  { id: 'aura-2-helena-en', name: 'Helena', language: 'English (US)', gender: 'Feminine', description: 'Caring, Natural, Positive, Friendly, Raspy' },
  { id: 'aura-2-apollo-en', name: 'Apollo', language: 'English (US)', gender: 'Masculine', description: 'Confident, Comfortable, Casual' },
  { id: 'aura-2-arcas-en', name: 'Arcas', language: 'English (US)', gender: 'Masculine', description: 'Natural, Smooth, Clear, Comfortable' },
  { id: 'aura-2-aries-en', name: 'Aries', language: 'English (US)', gender: 'Masculine', description: 'Warm, Energetic, Caring' },
  { id: 'aura-2-amalthea-en', name: 'Amalthea', language: 'English (PH)', gender: 'Feminine', description: 'Engaging, Natural, Cheerful' },
  { id: 'aura-2-asteria-en', name: 'Asteria', language: 'English (US)', gender: 'Feminine', description: 'Clear, Confident, Knowledgeable, Energetic' },
  { id: 'aura-2-athena-en', name: 'Athena', language: 'English (US)', gender: 'Feminine', description: 'Calm, Smooth, Professional' },
  { id: 'aura-2-atlas-en', name: 'Atlas', language: 'English (US)', gender: 'Masculine', description: 'Enthusiastic, Confident, Approachable, Friendly' },
  { id: 'aura-2-aurora-en', name: 'Aurora', language: 'English (US)', gender: 'Feminine', description: 'Cheerful, Expressive, Energetic' },
  { id: 'aura-2-callista-en', name: 'Callista', language: 'English (US)', gender: 'Feminine', description: 'Clear, Energetic, Professional, Smooth' },
  { id: 'aura-2-cora-en', name: 'Cora', language: 'English (US)', gender: 'Feminine', description: 'Smooth, Melodic, Caring' },
  { id: 'aura-2-cordelia-en', name: 'Cordelia', language: 'English (US)', gender: 'Feminine', description: 'Approachable, Warm, Polite' },
  { id: 'aura-2-delia-en', name: 'Delia', language: 'English (US)', gender: 'Feminine', description: 'Casual, Friendly, Cheerful, Breathy' },
  { id: 'aura-2-draco-en', name: 'Draco', language: 'English (UK)', gender: 'Masculine', description: 'Warm, Approachable, Trustworthy, Baritone' },
  { id: 'aura-2-electra-en', name: 'Electra', language: 'English (US)', gender: 'Feminine', description: 'Professional, Engaging, Knowledgeable' },
  { id: 'aura-2-harmonia-en', name: 'Harmonia', language: 'English (US)', gender: 'Feminine', description: 'Empathetic, Clear, Calm, Confident' },
  { id: 'aura-2-hera-en', name: 'Hera', language: 'English (US)', gender: 'Feminine', description: 'Smooth, Warm, Professional' },
  { id: 'aura-2-hermes-en', name: 'Hermes', language: 'English (US)', gender: 'Masculine', description: 'Expressive, Engaging, Professional' },
  { id: 'aura-2-hyperion-en', name: 'Hyperion', language: 'English (AU)', gender: 'Masculine', description: 'Caring, Warm, Empathetic' },
  { id: 'aura-2-iris-en', name: 'Iris', language: 'English (US)', gender: 'Feminine', description: 'Cheerful, Positive, Approachable' },
  { id: 'aura-2-janus-en', name: 'Janus', language: 'English (US)', gender: 'Feminine', description: 'Southern, Smooth, Trustworthy' },
  { id: 'aura-2-juno-en', name: 'Juno', language: 'English (US)', gender: 'Feminine', description: 'Natural, Engaging, Melodic, Breathy' },
  { id: 'aura-2-jupiter-en', name: 'Jupiter', language: 'English (US)', gender: 'Masculine', description: 'Expressive, Knowledgeable, Baritone' },
  { id: 'aura-2-luna-en', name: 'Luna', language: 'English (US)', gender: 'Feminine', description: 'Friendly, Natural, Engaging' },
  { id: 'aura-2-mars-en', name: 'Mars', language: 'English (US)', gender: 'Masculine', description: 'Smooth, Patient, Trustworthy, Baritone' },
  { id: 'aura-2-minerva-en', name: 'Minerva', language: 'English (US)', gender: 'Feminine', description: 'Positive, Friendly, Natural' },
  { id: 'aura-2-neptune-en', name: 'Neptune', language: 'English (US)', gender: 'Masculine', description: 'Professional, Patient, Polite' },
  { id: 'aura-2-odysseus-en', name: 'Odysseus', language: 'English (US)', gender: 'Masculine', description: 'Calm, Smooth, Comfortable, Professional' },
  { id: 'aura-2-ophelia-en', name: 'Ophelia', language: 'English (US)', gender: 'Feminine', description: 'Expressive, Enthusiastic, Cheerful' },
  { id: 'aura-2-orion-en', name: 'Orion', language: 'English (US)', gender: 'Masculine', description: 'Approachable, Comfortable, Calm, Polite' },
  { id: 'aura-2-orpheus-en', name: 'Orpheus', language: 'English (US)', gender: 'Masculine', description: 'Professional, Clear, Confident, Trustworthy' },
  { id: 'aura-2-pandora-en', name: 'Pandora', language: 'English (UK)', gender: 'Feminine', description: 'Smooth, Calm, Melodic, Breathy' },
  { id: 'aura-2-phoebe-en', name: 'Phoebe', language: 'English (US)', gender: 'Feminine', description: 'Energetic, Warm, Casual' },
  { id: 'aura-2-pluto-en', name: 'Pluto', language: 'English (US)', gender: 'Masculine', description: 'Smooth, Calm, Empathetic, Baritone' },
  { id: 'aura-2-saturn-en', name: 'Saturn', language: 'English (US)', gender: 'Masculine', description: 'Knowledgeable, Confident, Baritone' },
  { id: 'aura-2-selene-en', name: 'Selene', language: 'English (US)', gender: 'Feminine', description: 'Expressive, Engaging, Energetic' },
  { id: 'aura-2-theia-en', name: 'Theia', language: 'English (AU)', gender: 'Feminine', description: 'Expressive, Polite, Sincere' },
  { id: 'aura-2-vesta-en', name: 'Vesta', language: 'English (US)', gender: 'Feminine', description: 'Natural, Expressive, Patient, Empathetic' },
  { id: 'aura-2-zeus-en', name: 'Zeus', language: 'English (US)', gender: 'Masculine', description: 'Deep, Trustworthy, Smooth' },
  { id: 'aura-2-celeste-es', name: 'Celeste', language: 'Spanish (CO)', gender: 'Feminine', description: 'Clear, Energetic, Positive, Friendly, Enthusiastic' },
  { id: 'aura-2-estrella-es', name: 'Estrella', language: 'Spanish (MX)', gender: 'Feminine', description: 'Approachable, Natural, Calm, Comfortable, Expressive' },
  { id: 'aura-2-nestor-es', name: 'Nestor', language: 'Spanish (ES)', gender: 'Masculine', description: 'Calm, Professional, Approachable, Clear, Confident' },
  { id: 'aura-2-sirio-es', name: 'Sirio', language: 'Spanish (MX)', gender: 'Masculine', description: 'Calm, Professional, Comfortable, Empathetic, Baritone' },
  { id: 'aura-2-carina-es', name: 'Carina', language: 'Spanish (ES)', gender: 'Feminine', description: 'Professional, Raspy, Energetic, Breathy, Confident' },
  { id: 'aura-2-alvaro-es', name: 'Alvaro', language: 'Spanish (ES)', gender: 'Masculine', description: 'Calm, Professional, Clear, Knowledgeable, Approachable' },
  { id: 'aura-2-diana-es', name: 'Diana', language: 'Spanish (ES)', gender: 'Feminine', description: 'Professional, Confident, Expressive, Polite, Knowledgeable' },
  { id: 'aura-2-aquila-es', name: 'Aquila', language: 'Spanish (LATAM)', gender: 'Masculine', description: 'Expressive, Enthusiastic, Confident, Casual, Comfortable' },
  { id: 'aura-2-selena-es', name: 'Selena', language: 'Spanish (LATAM)', gender: 'Feminine', description: 'Approachable, Casual, Friendly, Calm, Positive' },
  { id: 'aura-2-javier-es', name: 'Javier', language: 'Spanish (MX)', gender: 'Masculine', description: 'Approachable, Professional, Friendly, Comfortable, Calm' },
  { id: 'aura-2-agustina-es', name: 'Agustina', language: 'Spanish (ES)', gender: 'Feminine', description: 'Calm, Clear, Expressive, Knowledgeable, Professional' },
  { id: 'aura-2-antonia-es', name: 'Antonia', language: 'es-ar', gender: 'Feminine', description: 'Approachable, Enthusiastic, Friendly, Natural, Professional' },
  { id: 'aura-2-gloria-es', name: 'Gloria', language: 'Spanish (CO)', gender: 'Feminine', description: 'Casual, Clear, Expressive, Natural, Smooth' },
  { id: 'aura-2-luciano-es', name: 'Luciano', language: 'Spanish (MX)', gender: 'Masculine', description: 'Charismatic, Cheerful, Energetic, Expressive, Friendly' },
  { id: 'aura-2-olivia-es', name: 'Olivia', language: 'Spanish (MX)', gender: 'Feminine', description: 'Breathy, Calm, Casual, Expressive, Warm' },
  { id: 'aura-2-silvia-es', name: 'Silvia', language: 'Spanish (ES)', gender: 'Feminine', description: 'Charismatic, Clear, Expressive, Natural, Warm' },
  { id: 'aura-2-valerio-es', name: 'Valerio', language: 'Spanish (MX)', gender: 'Masculine', description: 'Deep, Knowledgeable, Natural, Polite, Professional' },
  { id: 'aura-2-rhea-nl', name: 'Rhea', language: 'Dutch', gender: 'Feminine', description: 'Caring, Knowledgeable, Positive, Smooth, Warm' },
  { id: 'aura-2-sander-nl', name: 'Sander', language: 'Dutch', gender: 'Masculine', description: 'Calm, Clear, Deep, Professional, Smooth' },
  { id: 'aura-2-beatrix-nl', name: 'Beatrix', language: 'Dutch', gender: 'Feminine', description: 'Cheerful, Enthusiastic, Friendly, Trustworthy, Warm' },
  { id: 'aura-2-daphne-nl', name: 'Daphne', language: 'Dutch', gender: 'Feminine', description: 'Calm, Clear, Confident, Professional, Smooth' },
  { id: 'aura-2-cornelia-nl', name: 'Cornelia', language: 'Dutch', gender: 'Feminine', description: 'Approachable, Friendly, Polite, Positive, Warm' },
  { id: 'aura-2-hestia-nl', name: 'Hestia', language: 'Dutch', gender: 'Feminine', description: 'Approachable, Caring, Expressive, Friendly, Knowledgeable' },
  { id: 'aura-2-lars-nl', name: 'Lars', language: 'Dutch', gender: 'Masculine', description: 'Breathy, Casual, Comfortable, Sincere, Trustworthy' },
  { id: 'aura-2-roman-nl', name: 'Roman', language: 'Dutch', gender: 'Masculine', description: 'Calm, Casual, Deep, Natural, Patient' },
  { id: 'aura-2-leda-nl', name: 'Leda', language: 'Dutch', gender: 'Feminine', description: 'Caring, Comfortable, Empathetic, Friendly, Sincere' },
  { id: 'aura-2-agathe-fr', name: 'Agathe', language: 'French', gender: 'Feminine', description: 'Charismatic, Cheerful, Enthusiastic, Friendly, Natural' },
  { id: 'aura-2-hector-fr', name: 'Hector', language: 'French', gender: 'Masculine', description: 'Confident, Empathetic, Expressive, Friendly, Patient' },
  { id: 'aura-2-julius-de', name: 'Julius', language: 'German', gender: 'Masculine', description: 'Casual, Cheerful, Engaging, Expressive, Friendly' },
  { id: 'aura-2-viktoria-de', name: 'Viktoria', language: 'German', gender: 'Feminine', description: 'Charismatic, Cheerful, Enthusiastic, Friendly, Warm' },
  { id: 'aura-2-elara-de', name: 'Elara', language: 'German', gender: 'Feminine', description: 'Calm, Clear, Natural, Patient, Trustworthy' },
  { id: 'aura-2-aurelia-de', name: 'Aurelia', language: 'German', gender: 'Feminine', description: 'Approachable, Casual, Comfortable, Natural, Sincere' },
  { id: 'aura-2-lara-de', name: 'Lara', language: 'German', gender: 'Feminine', description: 'Caring, Cheerful, Empathetic, Expressive, Warm' },
  { id: 'aura-2-fabian-de', name: 'Fabian', language: 'German', gender: 'Masculine', description: 'Confident, Knowledgeable, Natural, Polite, Professional' },
  { id: 'aura-2-kara-de', name: 'Kara', language: 'German', gender: 'Feminine', description: 'Caring, Empathetic, Expressive, Professional, Warm' },
  { id: 'aura-2-livia-it', name: 'Livia', language: 'Italian', gender: 'Feminine', description: 'Approachable, Cheerful, Clear, Engaging, Expressive' },
  { id: 'aura-2-dionisio-it', name: 'Dionisio', language: 'Italian', gender: 'Masculine', description: 'Confident, Engaging, Friendly, Melodic, Positive' },
  { id: 'aura-2-melia-it', name: 'Melia', language: 'Italian', gender: 'Feminine', description: 'Clear, Comfortable, Engaging, Friendly, Natural' },
  { id: 'aura-2-elio-it', name: 'Elio', language: 'Italian', gender: 'Masculine', description: 'Breathy, Calm, Professional, Smooth, Trustworthy' },
  { id: 'aura-2-flavio-it', name: 'Flavio', language: 'Italian', gender: 'Masculine', description: 'Confident, Deep, Empathetic, Professional, Trustworthy' },
  { id: 'aura-2-maia-it', name: 'Maia', language: 'Italian', gender: 'Feminine', description: 'Caring, Energetic, Expressive, Professional, Warm' },
  { id: 'aura-2-cinzia-it', name: 'Cinzia', language: 'Italian', gender: 'Feminine', description: 'Approachable, Friendly, Smooth, Trustworthy, Warm' },
  { id: 'aura-2-cesare-it', name: 'Cesare', language: 'Italian', gender: 'Masculine', description: 'Clear, Empathetic, Knowledgeable, Natural, Smooth' },
  { id: 'aura-2-perseo-it', name: 'Perseo', language: 'Italian', gender: 'Masculine', description: 'Casual, Clear, Natural, Polite, Smooth' },
  { id: 'aura-2-demetra-it', name: 'Demetra', language: 'Italian', gender: 'Feminine', description: 'Calm, Comfortable, Patient' },
  { id: 'aura-2-fujin-ja', name: 'Fujin', language: 'Japanese', gender: 'Masculine', description: 'Calm, Confident, Knowledgeable, Professional, Smooth' },
  { id: 'aura-2-izanami-ja', name: 'Izanami', language: 'Japanese', gender: 'Feminine', description: 'Approachable, Clear, Knowledgeable, Polite, Professional' },
  { id: 'aura-2-uzume-ja', name: 'Uzume', language: 'Japanese', gender: 'Feminine', description: 'Approachable, Clear, Polite, Professional, Trustworthy' },
  { id: 'aura-2-ebisu-ja', name: 'Ebisu', language: 'Japanese', gender: 'Masculine', description: 'Calm, Deep, Natural, Patient, Sincere' },
  { id: 'aura-2-ama-ja', name: 'Ama', language: 'Japanese', gender: 'Feminine', description: 'Casual, Comfortable, Confident, Knowledgeable, Natural' },
  { id: 'aura-asteria-en', name: 'Asteria', language: 'English (US)', gender: 'Feminine', description: 'Clear, Confident, Knowledgeable, Energetic' },
  { id: 'aura-luna-en', name: 'Luna', language: 'English (US)', gender: 'Feminine', description: 'Friendly, Natural, Engaging' },
  { id: 'aura-stella-en', name: 'Stella', language: 'English (US)', gender: 'Feminine', description: 'Clear, Professional, Engaging' },
  { id: 'aura-athena-en', name: 'Athena', language: 'English (UK)', gender: 'Feminine', description: 'Calm, Smooth, Professional' },
  { id: 'aura-hera-en', name: 'Hera', language: 'English (US)', gender: 'Feminine', description: 'Smooth, Warm, Professional' },
  { id: 'aura-orion-en', name: 'Orion', language: 'English (US)', gender: 'Masculine', description: 'Approachable, Comfortable, Calm, Polite' },
  { id: 'aura-arcas-en', name: 'Arcas', language: 'English (US)', gender: 'Masculine', description: 'Natural, Smooth, Clear, Comfortable' },
  { id: 'aura-perseus-en', name: 'Perseus', language: 'English (US)', gender: 'Masculine', description: 'Confident, Professional, Clear' },
  { id: 'aura-angus-en', name: 'Angus', language: 'English (IE)', gender: 'Masculine', description: 'Warm, Friendly, Natural' },
  { id: 'aura-orpheus-en', name: 'Orpheus', language: 'English (US)', gender: 'Masculine', description: 'Professional, Clear, Confident, Trustworthy' },
  { id: 'aura-helios-en', name: 'Helios', language: 'English (UK)', gender: 'Masculine', description: 'Professional, Clear, Confident' },
  { id: 'aura-zeus-en', name: 'Zeus', language: 'English (US)', gender: 'Masculine', description: 'Deep, Trustworthy, Smooth' },
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
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    return new Uint8Array(buffer);
}

export const DeepgramTTS: React.FC = () => {
    const [text, setText] = useState('Hello, how can I help you today?');
    const [selectedModel, setSelectedModel] = useState(DEEPGRAM_MODELS[0].id);
    const [languageFilter, setLanguageFilter] = useState('All');
    const [genderFilter, setGenderFilter] = useState('All');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const uniqueLanguages = ['All', ...Array.from(new Set(DEEPGRAM_MODELS.map(m => m.language)))];
    const uniqueGenders = ['All', ...Array.from(new Set(DEEPGRAM_MODELS.map(m => m.gender)))];

    const filteredModels = DEEPGRAM_MODELS.filter(model => {
        const matchLanguage = languageFilter === 'All' || model.language === languageFilter;
        const matchGender = genderFilter === 'All' || model.gender === genderFilter;
        return matchLanguage && matchGender;
    });

    const handleGenerateDemo = async () => {
        setIsGeneratingDemo(true);
        setError(null);
        try {
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: "Write a short, engaging, and realistic customer service script (about 3-4 sentences) that would be perfect for testing a text-to-speech voice model. Do not include any formatting like bolding, asterisks, or speaker labels. Just the raw text.",
            });
            if (response.text) {
                setText(response.text.trim());
            }
        } catch (e: any) {
            console.error('Gemini Error:', e);
            setError(e.message || 'Failed to generate demo text with Gemini.');
        } finally {
            setIsGeneratingDemo(false);
        }
    };

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Please enter some text to synthesize.');
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
                const dialect = parts[3];
                
                let promptText = text;
                if (dialect === 'egyptian') promptText = `Speak in an Egyptian Arabic dialect: ${text}`;
                else if (dialect === 'levantine') promptText = `Speak in a Levantine Arabic dialect: ${text}`;
                else if (dialect === 'gulf') promptText = `Speak in a Gulf Arabic dialect: ${text}`;
                else if (dialect === 'maghrebi') promptText = `Speak in a Maghrebi Arabic dialect: ${text}`;
                else if (dialect === 'msa') promptText = `Speak in Modern Standard Arabic: ${text}`;

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
                    throw new Error(errData.error || 'Failed to generate audio');
                }

                blob = await response.blob();
            }

            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

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

    const selectedModelDetails = DEEPGRAM_MODELS.find(m => m.id === selectedModel);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Volume2 className="text-[#0500e2]" size={32} />
                        Text-to-Speech <span className="text-xs bg-[#0500e2]/10 text-[#0500e2] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Beta</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Convert text into highly realistic speech using Deepgram's Aura models and Gemini's TTS models.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Generation Failed</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Text Input */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Input Text</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleGenerateDemo}
                                    disabled={isGeneratingDemo || isGenerating}
                                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isGeneratingDemo ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={14} />
                                    )}
                                    Generate Demo Text
                                </button>
                                <span className="text-xs text-slate-500 font-mono">{text.length} / 5000</span>
                            </div>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value.slice(0, 5000))}
                                placeholder="Enter text to synthesize..."
                                className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent outline-none text-slate-900 dark:text-white transition-all"
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !text.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#0500e2] hover:bg-[#0400c0] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0500e2]/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} />
                                        Generate Audio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Audio Player */}
                    {audioUrl && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Generated Audio</h3>
                            <div className="flex items-center gap-4">
                                <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                                <a 
                                    href={audioUrl} 
                                    download={`tts-${selectedModel}-${Date.now()}.wav`}
                                    className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    title="Download Audio"
                                >
                                    <Download size={20} />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                            <Settings2 size={18} className="text-slate-500" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Voice Settings</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Language</label>
                                    <select 
                                        value={languageFilter}
                                        onChange={(e) => setLanguageFilter(e.target.value)}
                                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent text-slate-900 dark:text-white"
                                    >
                                        {uniqueLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Gender</label>
                                    <select 
                                        value={genderFilter}
                                        onChange={(e) => setGenderFilter(e.target.value)}
                                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent text-slate-900 dark:text-white"
                                    >
                                        {uniqueGenders.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Select Voice Model
                                </label>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredModels.length === 0 ? (
                                        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                            No voices match your filters.
                                        </div>
                                    ) : (
                                        filteredModels.map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => setSelectedModel(model.id)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${
                                                    selectedModel === model.id
                                                        ? 'border-[#0500e2] bg-[#0500e2]/5 dark:bg-[#0500e2]/10 ring-1 ring-[#0500e2]'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-900 dark:text-white">{model.name}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                                                        {model.language}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {model.gender} • {model.description}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
