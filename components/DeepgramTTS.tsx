import React, { useState, useRef } from 'react';
import { Play, Square, Loader2, Volume2, Settings2, Download, AlertTriangle, Sparkles } from 'lucide-react';
import { getAI } from '../services/geminiService';

const ALL_TTS_MODELS = [
  // Deepgram Aura 2 Models
  { id: 'aura-2-thalia-en', name: 'Thalia', language: 'English (US)', gender: 'Feminine', description: 'Clear, Confident, Energetic, Enthusiastic', provider: 'deepgram' },
  { id: 'aura-2-andromeda-en', name: 'Andromeda', language: 'English (US)', gender: 'Feminine', description: 'Casual, Expressive, Comfortable', provider: 'deepgram' },
  { id: 'aura-2-helena-en', name: 'Helena', language: 'English (US)', gender: 'Feminine', description: 'Caring, Natural, Positive, Friendly, Raspy', provider: 'deepgram' },
  { id: 'aura-2-apollo-en', name: 'Apollo', language: 'English (US)', gender: 'Masculine', description: 'Confident, Comfortable, Casual', provider: 'deepgram' },
  { id: 'aura-2-arcas-en', name: 'Arcas', language: 'English (US)', gender: 'Masculine', description: 'Natural, Smooth, Clear, Comfortable', provider: 'deepgram' },
  { id: 'aura-2-aries-en', name: 'Aries', language: 'English (US)', gender: 'Masculine', description: 'Warm, Energetic, Caring', provider: 'deepgram' },
  { id: 'aura-2-amalthea-en', name: 'Amalthea', language: 'English (PH)', gender: 'Feminine', description: 'Engaging, Natural, Cheerful', provider: 'deepgram' },
  { id: 'aura-2-asteria-en', name: 'Asteria', language: 'English (US)', gender: 'Feminine', description: 'Clear, Confident, Knowledgeable, Energetic', provider: 'deepgram' },
  { id: 'aura-2-athena-en', name: 'Athena', language: 'English (US)', gender: 'Feminine', description: 'Calm, Smooth, Professional', provider: 'deepgram' },
  { id: 'aura-2-atlas-en', name: 'Atlas', language: 'English (US)', gender: 'Masculine', description: 'Enthusiastic, Confident, Approachable, Friendly', provider: 'deepgram' },
  { id: 'aura-2-aurora-en', name: 'Aurora', language: 'English (US)', gender: 'Feminine', description: 'Cheerful, Expressive, Energetic', provider: 'deepgram' },
  { id: 'aura-2-callista-en', name: 'Callista', language: 'English (US)', gender: 'Feminine', description: 'Clear, Energetic, Professional, Smooth', provider: 'deepgram' },
  { id: 'aura-2-cora-en', name: 'Cora', language: 'English (US)', gender: 'Feminine', description: 'Smooth, Melodic, Caring', provider: 'deepgram' },
  { id: 'aura-2-cordelia-en', name: 'Cordelia', language: 'English (US)', gender: 'Feminine', description: 'Approachable, Warm, Polite', provider: 'deepgram' },
  { id: 'aura-2-delia-en', name: 'Delia', language: 'English (US)', gender: 'Feminine', description: 'Casual, Friendly, Cheerful, Breathy', provider: 'deepgram' },
  { id: 'aura-2-draco-en', name: 'Draco', language: 'English (UK)', gender: 'Masculine', description: 'Warm, Approachable, Trustworthy, Baritone', provider: 'deepgram' },
  { id: 'aura-2-electra-en', name: 'Electra', language: 'English (US)', gender: 'Feminine', description: 'Professional, Engaging, Knowledgeable', provider: 'deepgram' },
  { id: 'aura-2-harmonia-en', name: 'Harmonia', language: 'English (US)', gender: 'Feminine', description: 'Empathetic, Clear, Calm, Confident', provider: 'deepgram' },
  { id: 'aura-2-hera-en', name: 'Hera', language: 'English (US)', gender: 'Feminine', description: 'Smooth, Warm, Professional', provider: 'deepgram' },
  { id: 'aura-2-hermes-en', name: 'Hermes', language: 'English (US)', gender: 'Masculine', description: 'Expressive, Engaging, Professional', provider: 'deepgram' },
  { id: 'aura-2-hyperion-en', name: 'Hyperion', language: 'English (AU)', gender: 'Masculine', description: 'Caring, Warm, Empathetic', provider: 'deepgram' },
  { id: 'aura-2-iris-en', name: 'Iris', language: 'English (US)', gender: 'Feminine', description: 'Cheerful, Positive, Approachable', provider: 'deepgram' },
  { id: 'aura-2-janus-en', name: 'Janus', language: 'English (US)', gender: 'Feminine', description: 'Southern, Smooth, Trustworthy', provider: 'deepgram' },
  { id: 'aura-2-juno-en', name: 'Juno', language: 'English (US)', gender: 'Feminine', description: 'Natural, Engaging, Melodic, Breathy', provider: 'deepgram' },
  { id: 'aura-2-jupiter-en', name: 'Jupiter', language: 'English (US)', gender: 'Masculine', description: 'Expressive, Knowledgeable, Baritone', provider: 'deepgram' },
  { id: 'aura-2-luna-en', name: 'Luna', language: 'English (US)', gender: 'Feminine', description: 'Friendly, Natural, Engaging', provider: 'deepgram' },
  { id: 'aura-2-mars-en', name: 'Mars', language: 'English (US)', gender: 'Masculine', description: 'Smooth, Patient, Trustworthy, Baritone', provider: 'deepgram' },
  { id: 'aura-2-minerva-en', name: 'Minerva', language: 'English (US)', gender: 'Feminine', description: 'Positive, Friendly, Natural', provider: 'deepgram' },
  { id: 'aura-2-neptune-en', name: 'Neptune', language: 'English (US)', gender: 'Masculine', description: 'Professional, Patient, Polite', provider: 'deepgram' },
  { id: 'aura-2-odysseus-en', name: 'Odysseus', language: 'English (US)', gender: 'Masculine', description: 'Calm, Smooth, Comfortable, Professional', provider: 'deepgram' },
  { id: 'aura-2-ophelia-en', name: 'Ophelia', language: 'English (US)', gender: 'Feminine', description: 'Expressive, Enthusiastic, Cheerful', provider: 'deepgram' },
  { id: 'aura-2-orion-en', name: 'Orion', language: 'English (US)', gender: 'Masculine', description: 'Approachable, Comfortable, Calm, Polite', provider: 'deepgram' },
  { id: 'aura-2-orpheus-en', name: 'Orpheus', language: 'English (US)', gender: 'Masculine', description: 'Professional, Clear, Confident, Trustworthy', provider: 'deepgram' },
  { id: 'aura-2-pandora-en', name: 'Pandora', language: 'English (UK)', gender: 'Feminine', description: 'Smooth, Calm, Melodic, Breathy', provider: 'deepgram' },
  { id: 'aura-2-phoebe-en', name: 'Phoebe', language: 'English (US)', gender: 'Feminine', description: 'Energetic, Warm, Casual', provider: 'deepgram' },
  { id: 'aura-2-pluto-en', name: 'Pluto', language: 'English (US)', gender: 'Masculine', description: 'Smooth, Calm, Empathetic, Baritone', provider: 'deepgram' },
  { id: 'aura-2-saturn-en', name: 'Saturn', language: 'English (US)', gender: 'Masculine', description: 'Knowledgeable, Confident, Baritone', provider: 'deepgram' },
  { id: 'aura-2-selene-en', name: 'Selene', language: 'English (US)', gender: 'Feminine', description: 'Expressive, Engaging, Energetic', provider: 'deepgram' },
  { id: 'aura-2-theia-en', name: 'Theia', language: 'English (AU)', gender: 'Feminine', description: 'Expressive, Polite, Sincere', provider: 'deepgram' },
  { id: 'aura-2-vesta-en', name: 'Vesta', language: 'English (US)', gender: 'Feminine', description: 'Natural, Expressive, Patient, Empathetic', provider: 'deepgram' },
  { id: 'aura-2-zeus-en', name: 'Zeus', language: 'English (US)', gender: 'Masculine', description: 'Deep, Trustworthy, Smooth', provider: 'deepgram' },
  { id: 'aura-2-celeste-es', name: 'Celeste', language: 'Spanish (CO)', gender: 'Feminine', description: 'Clear, Energetic, Positive, Friendly, Enthusiastic', provider: 'deepgram' },
  { id: 'aura-2-estrella-es', name: 'Estrella', language: 'Spanish (MX)', gender: 'Feminine', description: 'Approachable, Natural, Calm, Comfortable, Expressive', provider: 'deepgram' },
  { id: 'aura-2-nestor-es', name: 'Nestor', language: 'Spanish (ES)', gender: 'Masculine', description: 'Calm, Professional, Approachable, Clear, Confident', provider: 'deepgram' },
  { id: 'aura-2-sirio-es', name: 'Sirio', language: 'Spanish (MX)', gender: 'Masculine', description: 'Calm, Professional, Comfortable, Empathetic, Baritone', provider: 'deepgram' },
  { id: 'aura-2-carina-es', name: 'Carina', language: 'Spanish (ES)', gender: 'Feminine', description: 'Professional, Raspy, Energetic, Breathy, Confident', provider: 'deepgram' },
  { id: 'aura-2-alvaro-es', name: 'Alvaro', language: 'Spanish (ES)', gender: 'Masculine', description: 'Calm, Professional, Clear, Knowledgeable, Approachable', provider: 'deepgram' },
  { id: 'aura-2-diana-es', name: 'Diana', language: 'Spanish (ES)', gender: 'Feminine', description: 'Professional, Confident, Expressive, Polite, Knowledgeable', provider: 'deepgram' },
  { id: 'aura-2-aquila-es', name: 'Aquila', language: 'Spanish (LATAM)', gender: 'Masculine', description: 'Expressive, Enthusiastic, Confident, Casual, Comfortable', provider: 'deepgram' },
  { id: 'aura-2-selena-es', name: 'Selena', language: 'Spanish (LATAM)', gender: 'Feminine', description: 'Approachable, Casual, Friendly, Calm, Positive', provider: 'deepgram' },
  { id: 'aura-2-javier-es', name: 'Javier', language: 'Spanish (MX)', gender: 'Masculine', description: 'Approachable, Professional, Friendly, Comfortable, Calm', provider: 'deepgram' },
  { id: 'aura-2-agustina-es', name: 'Agustina', language: 'Spanish (ES)', gender: 'Feminine', description: 'Calm, Clear, Expressive, Knowledgeable, Professional', provider: 'deepgram' },
  { id: 'aura-2-antonia-es', name: 'Antonia', language: 'es-ar', gender: 'Feminine', description: 'Approachable, Enthusiastic, Friendly, Natural, Professional', provider: 'deepgram' },
  { id: 'aura-2-gloria-es', name: 'Gloria', language: 'Spanish (CO)', gender: 'Feminine', description: 'Casual, Clear, Expressive, Natural, Smooth', provider: 'deepgram' },
  { id: 'aura-2-luciano-es', name: 'Luciano', language: 'Spanish (MX)', gender: 'Masculine', description: 'Charismatic, Cheerful, Energetic, Expressive, Friendly', provider: 'deepgram' },
  { id: 'aura-2-olivia-es', name: 'Olivia', language: 'Spanish (MX)', gender: 'Feminine', description: 'Breathy, Calm, Casual, Expressive, Warm', provider: 'deepgram' },
  { id: 'aura-2-silvia-es', name: 'Silvia', language: 'Spanish (ES)', gender: 'Feminine', description: 'Charismatic, Clear, Expressive, Natural, Warm', provider: 'deepgram' },
  { id: 'aura-2-valerio-es', name: 'Valerio', language: 'Spanish (MX)', gender: 'Masculine', description: 'Deep, Knowledgeable, Natural, Polite, Professional', provider: 'deepgram' },
  { id: 'aura-2-rhea-nl', name: 'Rhea', language: 'Dutch', gender: 'Feminine', description: 'Caring, Knowledgeable, Positive, Smooth, Warm', provider: 'deepgram' },
  { id: 'aura-2-sander-nl', name: 'Sander', language: 'Dutch', gender: 'Masculine', description: 'Calm, Clear, Deep, Professional, Smooth', provider: 'deepgram' },
  { id: 'aura-2-beatrix-nl', name: 'Beatrix', language: 'Dutch', gender: 'Feminine', description: 'Cheerful, Enthusiastic, Friendly, Trustworthy, Warm', provider: 'deepgram' },
  { id: 'aura-2-daphne-nl', name: 'Daphne', language: 'Dutch', gender: 'Feminine', description: 'Calm, Clear, Confident, Professional, Smooth', provider: 'deepgram' },
  { id: 'aura-2-cornelia-nl', name: 'Cornelia', language: 'Dutch', gender: 'Feminine', description: 'Approachable, Friendly, Polite, Positive, Warm', provider: 'deepgram' },
  { id: 'aura-2-hestia-nl', name: 'Hestia', language: 'Dutch', gender: 'Feminine', description: 'Approachable, Caring, Expressive, Friendly, Knowledgeable', provider: 'deepgram' },
  { id: 'aura-2-lars-nl', name: 'Lars', language: 'Dutch', gender: 'Masculine', description: 'Breathy, Casual, Comfortable, Sincere, Trustworthy', provider: 'deepgram' },
  { id: 'aura-2-roman-nl', name: 'Roman', language: 'Dutch', gender: 'Masculine', description: 'Calm, Casual, Deep, Natural, Patient', provider: 'deepgram' },
  { id: 'aura-2-leda-nl', name: 'Leda', language: 'Dutch', gender: 'Feminine', description: 'Caring, Comfortable, Empathetic, Friendly, Sincere', provider: 'deepgram' },
  { id: 'aura-2-agathe-fr', name: 'Agathe', language: 'French', gender: 'Feminine', description: 'Charismatic, Cheerful, Enthusiastic, Friendly, Natural', provider: 'deepgram' },
  { id: 'aura-2-hector-fr', name: 'Hector', language: 'French', gender: 'Masculine', description: 'Confident, Empathetic, Expressive, Friendly, Patient', provider: 'deepgram' },
  { id: 'aura-2-julius-de', name: 'Julius', language: 'German', gender: 'Masculine', description: 'Casual, Cheerful, Engaging, Expressive, Friendly', provider: 'deepgram' },
  { id: 'aura-2-viktoria-de', name: 'Viktoria', language: 'German', gender: 'Feminine', description: 'Charismatic, Cheerful, Enthusiastic, Friendly, Warm', provider: 'deepgram' },
  { id: 'aura-2-elara-de', name: 'Elara', language: 'German', gender: 'Feminine', description: 'Calm, Clear, Natural, Patient, Trustworthy', provider: 'deepgram' },
  { id: 'aura-2-aurelia-de', name: 'Aurelia', language: 'German', gender: 'Feminine', description: 'Approachable, Casual, Comfortable, Natural, Sincere', provider: 'deepgram' },
  { id: 'aura-2-lara-de', name: 'Lara', language: 'German', gender: 'Feminine', description: 'Caring, Cheerful, Empathetic, Expressive, Warm', provider: 'deepgram' },
  { id: 'aura-2-fabian-de', name: 'Fabian', language: 'German', gender: 'Masculine', description: 'Confident, Knowledgeable, Natural, Polite, Professional', provider: 'deepgram' },
  { id: 'aura-2-kara-de', name: 'Kara', language: 'German', gender: 'Feminine', description: 'Caring, Empathetic, Expressive, Professional, Warm', provider: 'deepgram' },
  { id: 'aura-2-livia-it', name: 'Livia', language: 'Italian', gender: 'Feminine', description: 'Approachable, Cheerful, Clear, Engaging, Expressive', provider: 'deepgram' },
  { id: 'aura-2-dionisio-it', name: 'Dionisio', language: 'Italian', gender: 'Masculine', description: 'Confident, Engaging, Friendly, Melodic, Positive', provider: 'deepgram' },
  { id: 'aura-2-melia-it', name: 'Melia', language: 'Italian', gender: 'Feminine', description: 'Clear, Comfortable, Engaging, Friendly, Natural', provider: 'deepgram' },
  { id: 'aura-2-elio-it', name: 'Elio', language: 'Italian', gender: 'Masculine', description: 'Breathy, Calm, Professional, Smooth, Trustworthy', provider: 'deepgram' },
  { id: 'aura-2-flavio-it', name: 'Flavio', language: 'Italian', gender: 'Masculine', description: 'Confident, Deep, Empathetic, Professional, Trustworthy', provider: 'deepgram' },
  { id: 'aura-2-maia-it', name: 'Maia', language: 'Italian', gender: 'Feminine', description: 'Caring, Energetic, Expressive, Professional, Warm', provider: 'deepgram' },
  { id: 'aura-2-cinzia-it', name: 'Cinzia', language: 'Italian', gender: 'Feminine', description: 'Approachable, Friendly, Smooth, Trustworthy, Warm', provider: 'deepgram' },
  { id: 'aura-2-cesare-it', name: 'Cesare', language: 'Italian', gender: 'Masculine', description: 'Clear, Empathetic, Knowledgeable, Natural, Smooth', provider: 'deepgram' },
  { id: 'aura-2-perseo-it', name: 'Perseo', language: 'Italian', gender: 'Masculine', description: 'Casual, Clear, Natural, Polite, Smooth', provider: 'deepgram' },
  { id: 'aura-2-demetra-it', name: 'Demetra', language: 'Italian', gender: 'Feminine', description: 'Calm, Comfortable, Patient', provider: 'deepgram' },
  { id: 'aura-2-fujin-ja', name: 'Fujin', language: 'Japanese', gender: 'Masculine', description: 'Calm, Confident, Knowledgeable, Professional, Smooth', provider: 'deepgram' },
  { id: 'aura-2-izanami-ja', name: 'Izanami', language: 'Japanese', gender: 'Feminine', description: 'Approachable, Clear, Knowledgeable, Polite, Professional', provider: 'deepgram' },
  { id: 'aura-2-uzume-ja', name: 'Uzume', language: 'Japanese', gender: 'Feminine', description: 'Approachable, Clear, Polite, Professional, Trustworthy', provider: 'deepgram' },
  { id: 'aura-2-ebisu-ja', name: 'Ebisu', language: 'Japanese', gender: 'Masculine', description: 'Calm, Deep, Natural, Patient, Sincere', provider: 'deepgram' },
  { id: 'aura-2-ama-ja', name: 'Ama', language: 'Japanese', gender: 'Feminine', description: 'Casual, Comfortable, Confident, Knowledgeable, Natural', provider: 'deepgram' },
  
  // Deepgram Aura 1 Models
  { id: 'aura-asteria-en', name: 'Asteria', language: 'English (US)', gender: 'Feminine', description: 'Clear, Confident, Knowledgeable, Energetic', provider: 'deepgram' },
  { id: 'aura-luna-en', name: 'Luna', language: 'English (US)', gender: 'Feminine', description: 'Friendly, Natural, Engaging', provider: 'deepgram' },
  { id: 'aura-stella-en', name: 'Stella', language: 'English (US)', gender: 'Feminine', description: 'Clear, Professional, Engaging', provider: 'deepgram' },
  { id: 'aura-athena-en', name: 'Athena', language: 'English (UK)', gender: 'Feminine', description: 'Calm, Smooth, Professional', provider: 'deepgram' },
  { id: 'aura-hera-en', name: 'Hera', language: 'English (US)', gender: 'Feminine', description: 'Smooth, Warm, Professional', provider: 'deepgram' },
  { id: 'aura-orion-en', name: 'Orion', language: 'English (US)', gender: 'Masculine', description: 'Approachable, Comfortable, Calm, Polite', provider: 'deepgram' },
  { id: 'aura-arcas-en', name: 'Arcas', language: 'English (US)', gender: 'Masculine', description: 'Natural, Smooth, Clear, Comfortable', provider: 'deepgram' },
  { id: 'aura-perseus-en', name: 'Perseus', language: 'English (US)', gender: 'Masculine', description: 'Confident, Professional, Clear', provider: 'deepgram' },
  { id: 'aura-angus-en', name: 'Angus', language: 'English (IE)', gender: 'Masculine', description: 'Warm, Friendly, Natural', provider: 'deepgram' },
  { id: 'aura-orpheus-en', name: 'Orpheus', language: 'English (US)', gender: 'Masculine', description: 'Professional, Clear, Confident, Trustworthy', provider: 'deepgram' },
  { id: 'aura-helios-en', name: 'Helios', language: 'English (UK)', gender: 'Masculine', description: 'Professional, Clear, Confident', provider: 'deepgram' },
  { id: 'aura-zeus-en', name: 'Zeus', language: 'English (US)', gender: 'Masculine', description: 'Deep, Trustworthy, Smooth', provider: 'deepgram' },

  // Google Cloud TTS Arabic Voices
  { id: 'ar-AE-Neural2-A', name: 'Fatima (AE)', language: 'Arabic (UAE)', gender: 'Feminine', description: 'Neural2, High Quality, Clear', provider: 'google' },
  { id: 'ar-AE-Neural2-B', name: 'Zayed (AE)', language: 'Arabic (UAE)', gender: 'Masculine', description: 'Neural2, High Quality, Deep', provider: 'google' },
  { id: 'ar-AE-Neural2-C', name: 'Omar (AE)', language: 'Arabic (UAE)', gender: 'Masculine', description: 'Neural2, High Quality, Professional', provider: 'google' },
  { id: 'ar-SA-Neural2-A', name: 'Aisha (SA)', language: 'Arabic (Saudi Arabia)', gender: 'Feminine', description: 'Neural2, High Quality, Warm', provider: 'google' },
  { id: 'ar-SA-Neural2-B', name: 'Tariq (SA)', language: 'Arabic (Saudi Arabia)', gender: 'Masculine', description: 'Neural2, High Quality, Confident', provider: 'google' },
  { id: 'ar-SA-Neural2-C', name: 'Salman (SA)', language: 'Arabic (Saudi Arabia)', gender: 'Masculine', description: 'Neural2, High Quality, Smooth', provider: 'google' },
  { id: 'ar-EG-Neural2-A', name: 'Nour (EG)', language: 'Arabic (Egypt)', gender: 'Feminine', description: 'Neural2, High Quality, Expressive', provider: 'google' },
  { id: 'ar-EG-Neural2-B', name: 'Amr (EG)', language: 'Arabic (Egypt)', gender: 'Masculine', description: 'Neural2, High Quality, Engaging', provider: 'google' },
  { id: 'ar-EG-Neural2-C', name: 'Mahmoud (EG)', language: 'Arabic (Egypt)', gender: 'Masculine', description: 'Neural2, High Quality, Clear', provider: 'google' },
  { id: 'ar-XA-Wavenet-A', name: 'Layla (Standard)', language: 'Arabic (Standard)', gender: 'Feminine', description: 'Wavenet, Professional, News', provider: 'google' },
  { id: 'ar-XA-Wavenet-B', name: 'Hamza (Standard)', language: 'Arabic (Standard)', gender: 'Masculine', description: 'Wavenet, Authoritative, Deep', provider: 'google' },
  { id: 'ar-XA-Wavenet-C', name: 'Khalid (Standard)', language: 'Arabic (Standard)', gender: 'Masculine', description: 'Wavenet, Clear, Narrative', provider: 'google' },
  { id: 'ar-XA-Wavenet-D', name: 'Mariam (Standard)', language: 'Arabic (Standard)', gender: 'Feminine', description: 'Wavenet, Smooth, Conversational', provider: 'google' },
  { id: 'ar-XA-Standard-A', name: 'Zahra (Standard)', language: 'Arabic (Standard)', gender: 'Feminine', description: 'Standard, Clear, Simple', provider: 'google' },
  { id: 'ar-XA-Standard-B', name: 'Yasin (Standard)', language: 'Arabic (Standard)', gender: 'Masculine', description: 'Standard, Deep, Simple', provider: 'google' }
];

export const DeepgramTTS: React.FC = () => {
    const [text, setText] = useState('Hello, how can I help you today?');
    const [selectedModel, setSelectedModel] = useState(ALL_TTS_MODELS[0].id);
    const [languageFilter, setLanguageFilter] = useState('All');
    const [genderFilter, setGenderFilter] = useState('All');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const uniqueLanguages = ['All', ...Array.from(new Set(ALL_TTS_MODELS.map(m => m.language)))].sort();
    const uniqueGenders = ['All', ...Array.from(new Set(ALL_TTS_MODELS.map(m => m.gender)))].sort();

    const filteredModels = ALL_TTS_MODELS.filter(model => {
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
            const selectedModelDetails = ALL_TTS_MODELS.find(m => m.id === selectedModel);
            const provider = selectedModelDetails?.provider || 'deepgram';
            const endpoint = provider === 'google' ? '/api/google/tts' : '/api/deepgram/tts';

            const response = await fetch(endpoint, {
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

            const blob = await response.blob();
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

    const selectedModelDetails = ALL_TTS_MODELS.find(m => m.id === selectedModel);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Volume2 className="text-[#0500e2]" size={32} />
                        Text-to-Speech <span className="text-xs bg-[#0500e2]/10 text-[#0500e2] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Beta</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Convert text into highly realistic speech using Deepgram and Google Cloud TTS.
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
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 dark:text-white">{model.name}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium uppercase tracking-wider">
                                                            {model.provider}
                                                        </span>
                                                    </div>
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
