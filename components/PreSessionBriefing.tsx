import React, { useState, useEffect, useRef } from 'react';
import { TrainingScenario } from '../types';
import { 
  Mic, 
  ArrowLeft, 
  Target, 
  User, 
  Shield, 
  TrendingUp, 
  Wrench, 
  Trophy,
  History,
  Zap,
  Heart,
  Sliders,
  Info,
  Phone,
  MessageSquare,
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';

interface PreSessionBriefingProps {
  scenario: TrainingScenario;
  mode: 'text' | 'voice';
  onStart: (voiceId?: string) => void;
  onBack: () => void;
  bestScore?: number;
  attempts: number;
}

export const CARTESIA_LANG_VOICES: Record<string, { id: string; name: string; gender: 'Female' | 'Male' }[]> = {
  'English': [
    { id: 'c2ad7092-0447-47ea-948b-61fbb6faf153', name: 'Grace (Helpful)', gender: 'Female' },
    { id: '2a12b36c-7f9b-4c3a-9f7a-72731b15323a', name: 'Ella (Scout)', gender: 'Female' },
    { id: '56c7989e-7a5f-4d12-838f-e0f910e7356e', name: 'Tristan (Calm)', gender: 'Male' },
    { id: '3d83e30f-c31b-4f26-b442-7075feafa53a', name: 'Wade (Soul)', gender: 'Male' }
  ],
  'Chinese': [
    { id: '7a5d4663-88ae-47b7-808e-8f9b9ee4127b', name: 'Hua (Friendly)', gender: 'Female' },
    { id: 'bf32f849-7bc9-4b91-8c62-954588efcc30', name: 'Lan (Calm)', gender: 'Female' },
    { id: 'eda5bbff-1ff1-4886-8ef1-4e69a77640a0', name: 'Kai (Professional)', gender: 'Male' },
    { id: '7e2a44d1-76b8-42b8-9507-fedfe3a803c8', name: 'Jian (Steady)', gender: 'Male' }
  ],
  'Dutch': [
    { id: '225ba8cf-9fc2-4371-a78c-fe38ba38898a', name: 'Anneliese (Warm)', gender: 'Female' },
    { id: '0eb213fe-4658-45bc-9442-33a48b24b133', name: 'Sanne (Bright)', gender: 'Female' },
    { id: '4b250449-c635-4b63-bd1d-b654b12ffcd4', name: 'Jeroen (Polished)', gender: 'Male' },
    { id: 'af482421-80f4-4379-b00c-a118def29cde', name: 'Lucas (Direct)', gender: 'Male' }
  ],
  'French': [
    { id: 'b6cbde9b-00e3-4a57-9955-0703001e3231', name: 'Amélie (Sweet)', gender: 'Female' },
    { id: 'c96a7d7d-3457-4979-8665-522f7b3e36fb', name: 'Léa (Helpful)', gender: 'Female' },
    { id: '0418348a-0ca2-4e90-9986-800fb8b3bbc0', name: 'Antoine (Baritone)', gender: 'Male' },
    { id: '93c98a2b-7d15-4f7b-8236-294b1e02b1c0', name: 'Mathieu (Doctor)', gender: 'Male' }
  ],
  'German': [
    { id: 'b9de4a89-2257-424b-94c2-db18ba68c81a', name: 'Viktoria (Sweet)', gender: 'Female' },
    { id: '6d4b1416-8d54-4d94-a788-8a802c086544', name: 'Sabine (Helpful)', gender: 'Female' },
    { id: '42f14755-88c3-4124-aae3-5cc3a9618e8f', name: 'Jan (Baritone)', gender: 'Male' },
    { id: '2be00b67-d53f-4eb5-89e7-96c224d56fbc', name: 'Dieter (Doctor)', gender: 'Male' }
  ],
  'Italian': [
    { id: '90c7d657-9599-4cd0-9ed2-2568359e4d1a', name: 'Sofia (Sweet)', gender: 'Female' },
    { id: '36d94908-c5b9-4014-b521-e69aee5bead0', name: 'Giulia (Helpful)', gender: 'Female' },
    { id: 'e019ed7e-6079-4467-bc7f-b599a5dccf6f', name: 'Luca (Baritone)', gender: 'Male' },
    { id: '88b329db-85d7-47cc-a5c5-98225a756721', name: 'Giuseppe (Doctor)', gender: 'Male' }
  ],
  'Japanese': [
    { id: '31c55968-a9f4-4115-8831-3a16952179c8', name: 'Ayumi (Sweet)', gender: 'Female' },
    { id: '861213b7-f057-45c8-9527-0f4c144f1a03', name: 'Haruka (Helpful)', gender: 'Female' },
    { id: '6b92f628-be90-497c-8f4c-3b035002df71', name: 'Kenji (Baritone)', gender: 'Male' },
    { id: '9436e723-612d-4114-aeb0-fa00d4d639bf', name: 'Katsuya (Doctor)', gender: 'Male' }
  ],
  'Korean': [
    { id: '4dd4630e-19e0-4243-bca0-676ff85119b7', name: 'Haeun (Sweet)', gender: 'Female' },
    { id: 'cac92886-4b7c-4bc1-a524-e0f79c0381be', name: 'Yuna (Helpful)', gender: 'Female' },
    { id: 'f7755efb-1848-4321-aa22-5e5be5d32486', name: 'Ryeowook (Baritone)', gender: 'Male' },
    { id: '537a82ae-4926-4bfb-9aec-aff0b80a12a5', name: 'Minho (Doctor)', gender: 'Male' }
  ],
  'Portuguese': [
    { id: 'c9611be8-aae9-4a93-bb1c-98dd6b7d52a4', name: 'Isabella (Sweet)', gender: 'Female' },
    { id: '2f4d204f-a5dc-4196-81bc-155986b76ab6', name: 'Mirella (Helpful)', gender: 'Female' },
    { id: 'b603811e-54c2-4a0a-8854-09eab9ffa63f', name: 'Bruno (Baritone)', gender: 'Male' },
    { id: '07b6f895-78b9-4921-8e10-8a21c99c2e8a', name: 'Rafael (Doctor)', gender: 'Male' }
  ],
  'Russian': [
    { id: '25b7aaa6-1670-42dc-b791-419322400803', name: 'Daria (Sweet)', gender: 'Female' },
    { id: '7a62541e-5492-410e-95ff-3abd096fce87', name: 'Natalia (Helpful)', gender: 'Female' },
    { id: '1e4176b1-3db9-44d6-a601-4fe68b041942', name: 'Sergei (Baritone)', gender: 'Male' },
    { id: '888b7df4-e165-4852-bfec-0ab2b96aaa46', name: 'Dmitri (Doctor)', gender: 'Male' }
  ],
  'Spanish': [
    { id: '1cc00672-e9d4-455e-b3fb-31dfb7aad231', name: 'Laura (Sweet)', gender: 'Female' },
    { id: 'e5e5c8d7-3924-4ff6-981a-cb667034be29', name: 'Regina (Helpful)', gender: 'Female' },
    { id: '3efb11f3-4c0e-43c2-bad5-85ab99e993e2', name: 'Eduardo (Baritone)', gender: 'Male' },
    { id: '4853bafa-52cc-48c8-86a1-1edf8c76e429', name: 'Alonso (Doctor)', gender: 'Male' }
  ],
  'Turkish': [
    { id: 'bb2347fe-69e9-4810-873f-ffd759fe8420', name: 'Aylin (Sweet)', gender: 'Female' },
    { id: '8036098f-cff4-401e-bfba-f0a6a6e5e49b', name: 'Elif (Helpful)', gender: 'Female' },
    { id: '91e91d74-8eb4-43cd-97d3-7466c21db00d', name: 'Aykut (Baritone)', gender: 'Male' },
    { id: '5a31e4fb-f823-4359-aa91-82c0ae9a991c', name: 'Murat (Doctor)', gender: 'Male' }
  ],
  'Danish': [
    { id: 'c323c793-41f9-47b8-99dc-9b44b0440b84', name: 'Katrine (Sweet)', gender: 'Female' },
    { id: 'eb929394-68e7-4e08-bd2f-e7055728a5e1', name: 'Mette (Helpful)', gender: 'Female' },
    { id: '926e0766-f380-4d77-aeb0-9aa4ebb16b38', name: 'Soren (Baritone)', gender: 'Male' },
    { id: 'a466f9e2-28eb-4bb7-925c-8e8984950700', name: 'Søren (Doctor)', gender: 'Male' }
  ]
};

export const NATIVE_VOICES = [
  { id: 'Puck', name: 'Puck (Male - Energetic)', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Male - Deep)', gender: 'Male' },
  { id: 'Kore', name: 'Kore (Female - Friendly)', gender: 'Female' },
  { id: 'Fenrir', name: 'Fenrir (Male - Steady)', gender: 'Male' },
  { id: 'Aoede', name: 'Aoede (Female - Clear)', gender: 'Female' }
];

export const LOCALIZED_NATIVE_VOICES: Record<string, Record<string, { name: string; trait: string }>> = {
  'English': {
    Puck: { name: 'Parker', trait: 'Energetic' },
    Charon: { name: 'Charles', trait: 'Deep' },
    Kore: { name: 'Kate', trait: 'Friendly' },
    Fenrir: { name: 'Felix', trait: 'Steady' },
    Aoede: { name: 'Audrey', trait: 'Clear' },
  },
  'Chinese': {
    Puck: { name: '小杰', trait: '活力' },
    Charon: { name: '老陈', trait: '浑厚' },
    Kore: { name: '小雅', trait: '亲切' },
    Fenrir: { name: '老何', trait: '沉稳' },
    Aoede: { name: '阿美', trait: '清晰' },
  },
  'French': {
    Puck: { name: 'Pascal', trait: 'Énergique' },
    Charon: { name: 'Charles', trait: 'Grave' },
    Kore: { name: 'Chloé', trait: 'Amicale' },
    Fenrir: { name: 'François', trait: 'Stable' },
    Aoede: { name: 'Alice', trait: 'Claire' },
  },
  'German': {
    Puck: { name: 'Paul', trait: 'Energetisch' },
    Charon: { name: 'Klaus', trait: 'Tief' },
    Kore: { name: 'Karin', trait: 'Freundlich' },
    Fenrir: { name: 'Franz', trait: 'Ruhig' },
    Aoede: { name: 'Anke', trait: 'Klar' },
  },
  'Spanish': {
    Puck: { name: 'Pablo', trait: 'Enérgico' },
    Charon: { name: 'Carlos', trait: 'Profundo' },
    Kore: { name: 'Cristina', trait: 'Amigable' },
    Fenrir: { name: 'Fernando', trait: 'Constante' },
    Aoede: { name: 'Alicia', trait: 'Clara' },
  },
  'Italian': {
    Puck: { name: 'Pietro', trait: 'Energico' },
    Charon: { name: 'Claudio', trait: 'Profondo' },
    Kore: { name: 'Chiara', trait: 'Amichevole' },
    Fenrir: { name: 'Federico', trait: 'Costante' },
    Aoede: { name: 'Alessia', trait: 'Chiaro' },
  },
  'Japanese': {
    Puck: { name: 'タカ', trait: '元気' },
    Charon: { name: 'ケン', trait: '低音' },
    Kore: { name: 'マイ', trait: '親しみやすい' },
    Fenrir: { name: 'ヒロ', trait: '穏やか' },
    Aoede: { name: 'ユキ', trait: '明瞭' },
  },
  'Korean': {
    Puck: { name: '민수', trait: '활기찬' },
    Charon: { name: '상우', trait: '묵직한' },
    Kore: { name: '지은', trait: '친근한' },
    Fenrir: { name: '태현', trait: '차분한' },
    Aoede: { name: '서연', trait: '맑은' },
  },
  'Portuguese': {
    Puck: { name: 'Pedro', trait: 'Enérgico' },
    Charon: { name: 'Carlos', trait: 'Profundo' },
    Kore: { name: 'Camila', trait: 'Amigável' },
    Fenrir: { name: 'Fernando', trait: 'Estável' },
    Aoede: { name: 'Alice', trait: 'Clara' },
  },
  'Russian': {
    Puck: { name: 'Павел', trait: 'Энергичный' },
    Charon: { name: 'Харитон', trait: 'Глубокий' },
    Kore: { name: 'Кира', trait: 'Дружелюбный' },
    Fenrir: { name: 'Федор', trait: 'Спокойный' },
    Aoede: { name: 'Алина', trait: 'Ясный' },
  },
  'Dutch': {
    Puck: { name: 'Pim', trait: 'Energieke' },
    Charon: { name: 'Cas', trait: 'Diepe' },
    Kore: { name: 'Kirsten', trait: 'Vriendelijke' },
    Fenrir: { name: 'Floris', trait: 'Stabiele' },
    Aoede: { name: 'Anouk', trait: 'Heldere' },
  },
  'Turkish': {
    Puck: { name: 'Polat', trait: 'Enerjik' },
    Charon: { name: 'Cem', trait: 'Derin' },
    Kore: { name: 'Kardelen', trait: 'Samimi' },
    Fenrir: { name: 'Fatih', trait: 'Dengeli' },
    Aoede: { name: 'Aslı', trait: 'Net' },
  },
  'Danish': {
    Puck: { name: 'Pelle', trait: 'Energisk' },
    Charon: { name: 'Claus', trait: 'Dyb' },
    Kore: { name: 'Karin', trait: 'Venlig' },
    Fenrir: { name: 'Frederik', trait: 'Stabil' },
    Aoede: { name: 'Astrid', trait: 'Klar' },
  },
  'Arabic': {
    Puck: { name: 'بشير', trait: 'حيوي' },
    Charon: { name: 'كمال', trait: 'عميق' },
    Kore: { name: 'كريمة', trait: 'ودودة' },
    Fenrir: { name: 'فارس', trait: 'هادئ' },
    Aoede: { name: 'أمل', trait: 'واضح' },
  }
};

export const PreSessionBriefing: React.FC<PreSessionBriefingProps> = ({ scenario, mode, onStart, onBack, bestScore = 0, attempts }) => {
  const cleanLang = scenario.language ? scenario.language.split(' ')[0] : 'English';
  const cartesiaOptions = CARTESIA_LANG_VOICES[cleanLang] || CARTESIA_LANG_VOICES['English'];

  // Unified voice collection mapping Name (Gender) format (Cartesia/Premium first, then Native/Default)
  const mergedVoices = [
    ...cartesiaOptions.map(v => ({
      id: v.id,
      displayName: `✨ ${v.name.split(' ')[0]} (${v.gender}) [Premium]`,
      type: 'cartesia' as const
    })),
    ...NATIVE_VOICES.map(v => {
      const langMap = LOCALIZED_NATIVE_VOICES[cleanLang] || LOCALIZED_NATIVE_VOICES['English'];
      const loc = langMap[v.id] || { name: v.id };
      return {
        id: v.id,
        displayName: `${loc.name} (${v.gender})`,
        type: 'native' as const
      };
    })
  ];

  const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
    const firstPremium = mergedVoices.find(v => v.type === 'cartesia');
    if (firstPremium) {
      return firstPremium.id;
    }
    if (scenario.voice && mergedVoices.some(v => v.id === scenario.voice)) {
      return scenario.voice;
    }
    return mergedVoices.find(v => v.id === 'Kore')?.id || mergedVoices[0]?.id || 'Kore';
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVoiceSettingsExpanded, setIsVoiceSettingsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsVoiceSettingsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState<number[]>(new Array(20).fill(0.1));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

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
      let stream: MediaStream | null = null;
      let audioContext: AudioContext | null = null;
      let analyser: AnalyserNode | null = null;
      let source: MediaStreamAudioSourceNode | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64; 
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } catch (mediaError) {
        console.warn("Could not start real microphone capture, using simulated visual response:", mediaError);
      }

      setIsMicTesting(true);

      let angle = 0;
      const updateMeter = () => {
        angle += 0.15;
        const levels = [];
        let hasRealAudio = false;

        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          hasRealAudio = sum > 10;

          const step = Math.floor(dataArray.length / 20);
          for(let i=0; i<20; i++) {
            const val = dataArray[i * step] / 255;
            const waveSim = 0.15 + 0.35 * Math.sin(angle + i * 0.4) * Math.cos(angle * 0.7 + i * 0.2);
            levels.push(hasRealAudio ? Math.max(val, Math.abs(waveSim) * 0.2) : Math.max(0.12, Math.abs(waveSim)));
          }
        } else {
          // Pure simulation if microphone permission is denied or blocked inside the sandbox iframe
          for(let i=0; i<20; i++) {
            const waveSim = 0.15 + 0.5 * Math.sin(angle + i * 0.45) * Math.cos(angle * 0.6 + i * 0.25);
            levels.push(Math.max(0.12, Math.abs(waveSim)));
          }
        }
        
        setMicLevel(levels);
        rafRef.current = requestAnimationFrame(updateMeter);
      };
      
      updateMeter();
    } catch (e) {
      console.error("Mic test setup error:", e);
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

  const Icon = scenario.icon === 'TrendingUp' ? TrendingUp : scenario.icon === 'Wrench' ? Wrench : Shield;

  const levelMap: Record<string, number> = { 'Beginner': 1, 'Intermediate': 3, 'Advanced': 5 };
  const baseLevel = levelMap[scenario.difficulty] || 1;
  const xpReward = baseLevel * 150;

  const objectives = getObjectives();

  // Smartly resolve category labeling to prevent calling "Sales" if the title/description suggests Interview or Custom Roleplay
  const getResolvedCategory = () => {
    const titleLower = scenario.title.toLowerCase();
    const descLower = scenario.description.toLowerCase();
    if (
      titleLower.includes('görüşme') || 
      titleLower.includes('mülakat') || 
      titleLower.includes('interview') || 
      titleLower.includes('görüşmesi') ||
      descLower.includes('mülakat') ||
      descLower.includes('görüşme')
    ) {
      return 'Interview Prep';
    }
    return scenario.category || 'Simulation';
  };

  const resolvedCategory = getResolvedCategory();

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in px-4 sm:px-6 md:px-8 font-sans">
        
        {/* Top Minimal Navigation */}
        <div className="flex items-center justify-between gap-4 mb-8">
            <button 
                onClick={onBack} 
                className="inline-flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all group shadow-sm"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> 
                Back to Scenarios
            </button>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200/55 dark:border-slate-700/50">
                Briefing Room
            </div>
        </div>

        {/* Dynamic & Beautiful Scenario Header Banner (Solid, elegant, no gradients) */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-200/85 dark:border-slate-800 mb-8 relative z-20 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
                <div>
                    <div className="flex items-center gap-3 mb-2.5">
                        <span className={`text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded border ${
                            resolvedCategory === 'Interview Prep' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' :
                            scenario.category === 'Sales' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' : 
                            scenario.category === 'Technical' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' : 
                            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                        }`}>
                            {resolvedCategory}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {scenario.difficulty} Level
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                        {scenario.title}
                    </h1>
                </div>

                <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-slate-950 px-5 py-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Duration</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">~ 5 mins</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Focus Mode</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase">{mode}</div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="max-w-3xl">
                    <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed font-normal">
                        {scenario.description}
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-80 flex flex-col gap-3 relative z-30">
                    <button 
                        onClick={() => onStart(selectedVoiceId)}
                        className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                        {mode === 'voice' ? (
                            <>
                                <Phone size={18} className="animate-pulse" />
                                <span>Start Practice Call</span>
                            </>
                        ) : (
                            <>
                                <MessageSquare size={18} />
                                <span>Start Practice Chat</span>
                            </>
                        )}
                    </button>

                    {mode === 'voice' && (
                        <div className="w-full relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsVoiceSettingsExpanded(!isVoiceSettingsExpanded)}
                                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200/40 dark:border-slate-700/40 text-slate-700 dark:text-slate-200 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer font-bold text-xs shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Sliders size={13} className="text-slate-500 dark:text-slate-400" />
                                    <span>Voice Settings</span>
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isVoiceSettingsExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isVoiceSettingsExpanded && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                                    {/* Mic Check */}
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80">
                                        <div className="flex justify-between items-center mb-2.5">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Mic size={12} className="text-blue-500" /> Microphone Status
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={toggleMicTest}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition-all focus:outline-none"
                                            >
                                                {isMicTesting ? 'Stop Monitor' : 'Test Mic'}
                                            </button>
                                        </div>
                                        <div className="flex items-end justify-between h-10 gap-0.5 bg-slate-100 dark:bg-slate-950 p-2 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                                            {micLevel.map((level, i) => (
                                                <div 
                                                    key={i} 
                                                    className="w-full bg-blue-500 rounded-full"
                                                    style={{ 
                                                        height: `${Math.max(10, level * 100)}%`,
                                                        opacity: isMicTesting ? 1 : 0.15 
                                                    }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Unified Partner Voice Selector */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Partner Voice Profile
                                        </label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="w-full flex items-center justify-between p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white transition-all font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left"
                                            >
                                                <span className="truncate">{(mergedVoices.find(v => v.id === selectedVoiceId) || mergedVoices[0])?.displayName || 'Select a voice...'}</span>
                                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-[180px] overflow-y-auto py-1 custom-scrollbar">
                                                    {mergedVoices.map(v => {
                                                        const isSelected = v.id === selectedVoiceId;
                                                        return (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedVoiceId(v.id);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                                                    isSelected ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/40 dark:bg-blue-950/20' : 'text-slate-700 dark:text-slate-300 font-medium'
                                                                }`}
                                                            >
                                                                <span className="truncate">{v.displayName}</span>
                                                                {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Main 2-Column Grid (Beautifully Balanced & Natural Fit) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* LEFT COLUMN: Mission Objectives & Voice settings */}
            <div className="flex flex-col gap-8">
                
                {/* 1. Mission Objectives Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                            <Target size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Mission Objectives
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Target key milestones to secure high simulator grading.
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-3.5">
                        {objectives.map((obj, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700/80 transition-all">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {i + 1}
                                </div>
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                    {obj}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-3 text-xs text-slate-450 dark:text-slate-500 font-light">
                        <Info size={14} className="shrink-0" />
                        <span>Objectives are checked in real-time during your session.</span>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: Partner Profile & Parameters & History */}
            <div className="flex flex-col gap-8">
                
                {/* 3. Practicing Partner Dossier */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-200/60 dark:border-slate-700">
                            <User size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Practicing Partner Profile
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                System properties for this interactive simulation.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/50 rounded-2xl mb-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                            <User size={22} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                {scenario.title.split(':')[1]?.trim() || scenario.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Partner communication is modeled under <span className="font-semibold text-slate-700 dark:text-slate-300">{scenario.difficulty} Complexity</span>.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-slate-50/30 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                                <Target size={15} />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Partner Goal</div>
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                    {scenario.category === 'Sales' ? 'Evaluate product value' : 
                                     scenario.category === 'Technical' ? 'Resolve technical challenge' : 
                                     scenario.title.toLowerCase().includes('görüşme') || scenario.title.toLowerCase().includes('interview') ? 'Assess qualifications' : 
                                     'Engage in professional roleplay'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 bg-slate-50/30 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                                <Heart size={15} />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Partner Demeanor</div>
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                    {scenario.difficulty === 'Advanced' ? 'Challenging / Strict' : scenario.difficulty === 'Intermediate' ? 'Inquisitive / Moderate' : 'Helpful / Cooperative'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {scenario.difficulty === 'Advanced' && (
                        <div className="mt-5 p-4 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 animate-pulse">
                            <Zap size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Advanced Behavior Notice</h4>
                                <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                                    This partner may ask tough questions, offer pushback, or hold strict criteria. Maintain structured and professional communication.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Performance Track Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-5 flex items-center gap-2">
                        <Trophy size={14} className="text-amber-500" />
                        Parameters & History
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">XP REWARD</div>
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">+{xpReward}</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">BEST SCORE</div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                {bestScore > 0 ? `${bestScore}%` : '—'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <History size={13} className="text-slate-400" />
                            <span>Previous Attempts</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {attempts}
                        </span>
                    </div>
                </div>

            </div>

        </div>
    </div>
  );
};
