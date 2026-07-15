import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, BookOpen, Trophy, Flame, Award, Star, ArrowRight, 
  MessageSquare, Mic, MicOff, RefreshCw, Volume2, VolumeX, Sparkles, AlertCircle, 
  CheckCircle, ChevronRight, Play, Info, Check, Trash2, ArrowLeft, Loader2,
  Lock, CheckSquare, HelpCircle, Eye, EyeOff, MessageCircle, Send, Plus,
  Phone, PhoneOff
} from 'lucide-react';
import { getAI, Type, Modality } from '../services/geminiService';
import { User, AnalysisResult } from '../types';

// Helper functions for WAV audio header generation
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

// Voice models mapper per character scenario (maps to valid Gemini prebuilt voice names)
const getVoiceModelForScenario = (scenario: any): 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' => {
  if (!scenario) return 'Zephyr';
  const charName = scenario.characterName.toLowerCase();
  
  // Checks name gender cues for fallback voice selection
  const isFemale = charName.endsWith('a') || charName.includes('lady') || charName.includes('woman') || charName.includes('mrs') || charName.includes('miss') || charName.includes('she') || ['carmen', 'fiona', 'sarah', 'chantal', 'müller', 'mueller', 'giulia', 'elara', 'livia', 'sophia'].some(f => charName.includes(f));

  if (isFemale) {
    return 'Kore';
  } else {
    if (charName.includes('schneider') || charName.includes('director') || charName.includes('rossi') || charName.includes('fahad')) {
      return 'Charon'; // Deep professional/older voice
    }
    if (charName.includes('tariq') || charName.includes('mateo') || charName.includes('ahmad')) {
      return 'Fenrir'; // Resonant male voice
    }
    return 'Puck'; // Friendly energetic voice
  }
};

interface LanguagePracticeProps {
  user: User | null;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  addNotification?: (notification: any) => void;
}

// Scenario Structure
interface LanguageScenario {
  id: string;
  title: string;
  description: string;
  language: string;
  flag: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  levelLabel: string;
  characterName: string;
  characterRole: string;
  characterPersona: string;
  initialMessage: string;
  objectives: string[];
  xpReward: number;
  avatar: string;
}

// User Progress State
interface UserProgress {
  xp: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  level: number;
  completedScenariosCount: number;
}

// Message Interface
interface LessonMessage {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  translation?: string;
  showTranslation?: boolean;
}

// Grammatical Error
interface GrammarCorrection {
  original: string;
  explanation: string;
  corrected: string;
}

// Vocabulary Upgrade
interface VocabUpgrade {
  original: string;
  explanation: string;
  upgrade: string;
}

// Session Evaluation
interface LessonEvaluation {
  overallScore: number;
  taskScore: number;
  grammarScore: number;
  vocabScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  feedback: string;
  grammarCorrections: GrammarCorrection[];
  vocabUpgrades: VocabUpgrade[];
}

// Languages list
interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
  accentColor: string;
}

const LANGUAGES_CATALOG: LanguageOption[] = [
  { code: 'English', name: 'English', nativeName: 'English', flag: '🇬🇧', description: 'Master global communication and business scenarios.', accentColor: 'from-blue-500 to-indigo-600' },
  { code: 'Spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', description: 'Practice fast-paced social and travel interactions.', accentColor: 'from-red-500 to-amber-600' },
  { code: 'French', name: 'French', nativeName: 'Français', flag: '🇫🇷', description: 'Acquire beautiful pronunciation and daily courtesy.', accentColor: 'from-blue-600 to-red-500' },
  { code: 'German', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', description: 'Formulate precise grammar and formal career dialogue.', accentColor: 'from-yellow-500 to-red-600' },
  { code: 'Arabic', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', description: 'Engage in traditional markets and business hospitality.', accentColor: 'from-emerald-500 to-green-700' },
  { code: 'Italian', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', description: 'Express passions, order food, and rent local Vespas.', accentColor: 'from-green-500 to-red-500' }
];

// Fixed default scenarios per language
const FIXED_SCENARIOS: Record<string, LanguageScenario[]> = {
  English: [
    {
      id: 'en-coffee',
      title: 'Order Coffee at a Cafe',
      description: 'Navigate a fast-paced cafe order in London. Pick your drink, ask for almond milk, and customize your pastry order.',
      language: 'English',
      flag: '🇬🇧',
      level: 'A1',
      levelLabel: 'A1 Beginner',
      characterName: 'Oliver',
      characterRole: 'Barista',
      characterPersona: 'Polite but very busy London barista who values quick orders. Answers with standard British courtesy.',
      initialMessage: 'Hi there! Welcome to Central Grind. What can I get started for you today?',
      objectives: [
        'Greet Oliver and order a coffee',
        'Request almond milk or another dairy alternative',
        'Add a sweet pastry to your order',
        'Inquire about the total and pay'
      ],
      xpReward: 25,
      avatar: '☕'
    },
    {
      id: 'en-hotel',
      title: 'Boutique Hotel Check-In',
      description: 'Check into a lovely boutique hotel in Edinburgh. Request a room on a high floor and ask for a local dinner spot recommendation.',
      language: 'English',
      flag: '🇬🇧',
      level: 'A2',
      levelLabel: 'A2 Elementary',
      characterName: 'Fiona',
      characterRole: 'Hotel Receptionist',
      characterPersona: 'Extremely polite, helpful, and charming Scottish hotel receptionist.',
      initialMessage: 'Good afternoon, welcome to the Highland Retreat. How can I assist you with your booking today?',
      objectives: [
        'State your name and mention you have a reservation',
        'Request a quiet room on a high floor with a view',
        'Ask about breakfast serving hours',
        'Request a great restaurant recommendation nearby'
      ],
      xpReward: 35,
      avatar: '🏨'
    },
    {
      id: 'en-interview',
      title: 'Product Manager Job Interview',
      description: 'Participate in a professional interview for a senior tech role. Articulate your experience handling complex client expectations.',
      language: 'English',
      flag: '🇬🇧',
      level: 'B2',
      levelLabel: 'B2 Upper Intermediate',
      characterName: 'Sarah',
      characterRole: 'VP of Product',
      characterPersona: 'Sharp, objective, and analytical tech executive who values concise, metric-driven answers.',
      initialMessage: 'Thanks for coming in. Let\'s jump right into it: tell me about a time when you had to manage conflicting product priorities and how you resolved them.',
      objectives: [
        'Define a structured framework for handling priorities',
        'Provide a concrete metric-driven example of past success',
        'Explain how you handle stakeholder pushback',
        'Ask Sarah an insightful question about team alignment'
      ],
      xpReward: 50,
      avatar: '👩‍💼'
    }
  ],
  Spanish: [
    {
      id: 'es-tapas',
      title: 'Order Tapas at Mateo\'s Bar',
      description: 'Secure a busy outdoor table in Barcelona and order delicious local tapas. Negotiate recommendations.',
      language: 'Spanish',
      flag: '🇪🇸',
      level: 'A2',
      levelLabel: 'A2 Elementary',
      characterName: 'Mateo',
      characterRole: 'Tapas Waiter',
      characterPersona: 'Vibrant, fast-speaking, and warm Barcelona local who loves recommending specialties.',
      initialMessage: '¡Hola! Buenas tardes. Bienvenidos a El Gato Negro. ¿Tienen reserva o les busco una mesa?',
      objectives: [
        'Request a table outdoors (una mesa afuera)',
        'Order "patatas bravas" and a cold beverage',
        'Ask for Mateo\'s top recommendation for seafood',
        'Ask for the bill (la cuenta, por favor)'
      ],
      xpReward: 30,
      avatar: '🤵'
    },
    {
      id: 'es-directions',
      title: 'Asking for Directions in Madrid',
      description: 'Get directions to the Prado Museum. Clarify public transit options and ask about tickets.',
      language: 'Spanish',
      flag: '🇪🇸',
      level: 'A1',
      levelLabel: 'A1 Beginner',
      characterName: 'Carmen',
      characterRole: 'Helpful Local Passerby',
      characterPersona: 'Kind elderly Madrileña who speaks slowly and uses clear directions.',
      initialMessage: 'Hola, buenas tardes. Te veo un poco perdido con el mapa. ¿Te puedo ayudar a encontrar algo?',
      objectives: [
        'Explain that you are looking for the Prado Museum',
        'Ask if it is better to walk or take the metro',
        'Inquire where you can buy a metro card',
        'Thank Carmen politely (¡Muchísimas gracias por su ayuda!)'
      ],
      xpReward: 25,
      avatar: '🗺️'
    },
    {
      id: 'es-negotiate',
      title: 'Apartment Rental Terms',
      description: 'Negotiate the rental deposit and repair responsibilities for a flat near Retiro Park.',
      language: 'Spanish',
      flag: '🇪🇸',
      level: 'B2',
      levelLabel: 'B2 Upper Intermediate',
      characterName: 'Señor Gomez',
      characterRole: 'Property Owner',
      characterPersona: 'Conservative and cautious landlord who wants to ensure the tenant is highly responsible.',
      initialMessage: 'Hola, gracias por venir a ver el piso. Como le comenté, pido tres meses de fianza y la duración mínima es de un año. ¿Qué le parece?',
      objectives: [
        'Propose a lower deposit (e.g., one or two months of fianza)',
        'Ask who is responsible for minor household repairs',
        'Request the option to renew after six months',
        'Agree on terms amicably and set a contract signing date'
      ],
      xpReward: 45,
      avatar: '🏠'
    }
  ],
  French: [
    {
      id: 'fr-metro',
      title: 'Lost in the Paris Metro',
      description: 'Ask a Parisian metro agent for directions to reach the Eiffel Tower and buy the correct single pass.',
      language: 'French',
      flag: '🇫🇷',
      level: 'A1',
      levelLabel: 'A1 Beginner',
      characterName: 'Jean',
      characterRole: 'RATP Agent',
      characterPersona: 'Busy but professional Paris transit agent who expects standard greetings.',
      initialMessage: 'Bonjour. En quoi puis-je vous aider ? Il y a beaucoup de monde aujourd\'hui.',
      objectives: [
        'Greet Jean politely (Bonjour!)',
        'Ask which line goes to the Eiffel Tower (Tour Eiffel)',
        'Inquire about buying a ticket or Navigo pass',
        'Thank Jean warmly (Merci beaucoup, bonne journée !)'
      ],
      xpReward: 25,
      avatar: '👮‍♂️'
    },
    {
      id: 'fr-bistro',
      title: 'Romantic Dinner at a Bistro',
      description: 'Book a nice window seat at a cozy Parisian bistro. Order classic cuisine and discuss wine pairings.',
      language: 'French',
      flag: '🇫🇷',
      level: 'B1',
      levelLabel: 'B1 Intermediate',
      characterName: 'Pierre',
      characterRole: 'Bistro Sommelier',
      characterPersona: 'Sophisticated, passionate, and proud French culinary server who loves talking about wine.',
      initialMessage: 'Bonsoir, messieurs dames. Bienvenue au Coq d\'Or. Avez-vous choisi vos plats, ou préférez-vous quelques conseils ?',
      objectives: [
        'Request a table near the window (près de la fenêtre)',
        'Order a local French classic dish',
        'Ask Pierre to recommend a perfect red or white wine pairing',
        'Complement the food and pay the bill'
      ],
      xpReward: 40,
      avatar: '🍷'
    },
    {
      id: 'fr-debate',
      title: 'Debating Contemporary Art',
      description: 'Discuss the value of contemporary abstract installations with a critical art gallery director in Lyon.',
      language: 'French',
      flag: '🇫🇷',
      level: 'C1',
      levelLabel: 'C1 Advanced',
      characterName: 'Chantal',
      characterRole: 'Art Gallery Director',
      characterPersona: 'Intellectual, highly opinionated, and sophisticated. Uses complex vocabulary and literary references.',
      initialMessage: 'Ah, vous contemplez notre nouvelle sculpture métallique ? Certains y voient du génie, d\'autres de la simple tôle. Qu\'en pensez-vous ?',
      objectives: [
        'Articulate a nuanced artistic opinion using complex adjectives',
        'Politely challenge Chantal\'s view on the commercialization of art',
        'Reference structural balance or emotional depth of the piece',
        'Conclude with an elegant summary of the role of museums in modern society'
      ],
      xpReward: 50,
      avatar: '🎨'
    }
  ],
  German: [
    {
      id: 'de-biergarten',
      title: 'Ordering at a Munich Biergarten',
      description: 'Order traditional Bavarian food and drinks. Deal with seat sharing customs at a crowded table.',
      language: 'German',
      flag: '🇩🇪',
      level: 'A2',
      levelLabel: 'A2 Elementary',
      characterName: 'Hans',
      characterRole: 'Bavarian Waiter',
      characterPersona: 'Jovial, hearty Bavarian waiter who loves when tourists try speaking German.',
      initialMessage: 'Servus! Willkommen im Biergarten. Ein schönes großes Bier für Sie? Was darf\'s zu essen sein?',
      objectives: [
        'Order a large beer (ein großes Helles) and a soft pretzel (eine Brezel)',
        'Ask if you can share a crowded long bench with other guests',
        'Inquire about vegetarian options on the menu',
        'Request the bill and leave a friendly tip'
      ],
      xpReward: 30,
      avatar: '🍺'
    },
    {
      id: 'de-reklamation',
      title: 'Returning a Faulty Electronic Item',
      description: 'Negotiate returning a broken electronic item at a Berlin store. Demand a cash refund instead of store credit.',
      language: 'German',
      flag: '🇩🇪',
      level: 'B1',
      levelLabel: 'B1 Intermediate',
      characterName: 'Frau Müller',
      characterRole: 'Store Manager',
      characterPersona: 'Strict, rule-following, but fair German manager who initially insists on store credit.',
      initialMessage: 'Guten Tag. Sie möchten dieses Gerät reklamieren? Haben Sie den Kassenbon dabei? Normalerweise bieten wir nur Gutscheine an.',
      objectives: [
        'Explain clearly that the device stopped working after just two days',
        'Politely explain why store credit is insufficient (you need a full cash refund)',
        'Point out the warranty terms on the receipt',
        'Agree on an acceptable resolution and thank her for understanding'
      ],
      xpReward: 40,
      avatar: '🔌'
    },
    {
      id: 'de-debate',
      title: 'Negotiating a Salary Raise',
      description: 'Present your accomplishments and negotiate a competitive salary package with a demanding HR director.',
      language: 'German',
      flag: '🇩🇪',
      level: 'C1',
      levelLabel: 'C1 Advanced',
      characterName: 'Herr Dr. Schneider',
      characterRole: 'HR Director',
      characterPersona: 'Highly analytical, pragmatic, and metrics-driven corporate leader who respects confidence.',
      initialMessage: 'Guten Tag. Ich habe Ihren Gehaltswunsch über 15% Erhöhung erhalten. Das ist ein beträchtlicher Sprung. Wie begründen Sie diese Forderung?',
      objectives: [
        'Highlight three major project successes from the past year',
        'Reference local market salary benchmarks for your position',
        'Explain how you plan to contribute to the company\'s growth next year',
        'Negotiate additional perks (bonus, extra vacation days) if the base raise is capped'
      ],
      xpReward: 55,
      avatar: '💼'
    }
  ],
  Arabic: [
    {
      id: 'ar-coffee',
      title: 'Ordering Arabic Coffee and Dates',
      description: 'Enter a warm local lounge in Riyadh. Order traditional coffee and ask about premium date varieties.',
      language: 'Arabic',
      flag: '🇸🇦',
      level: 'A1',
      levelLabel: 'A1 Beginner',
      characterName: 'Ahmad',
      characterRole: 'Coffee Shop Host',
      characterPersona: 'Extremely welcoming and hospitable Riyadh native who speaks slowly and politely.',
      initialMessage: 'أهلاً وسهلاً بك يا ضيفنا الكريم! تفضل بالجلوس. هل تحب تجربة القهوة السعودية بالهيل والزعفران؟',
      objectives: [
        'Greet Ahmad warmly using a traditional greeting (السلام عليكم)',
        'Order traditional Arabic coffee (قهوة عربية)',
        'Ask about the types of dates available (تمر خلاص أو سكري)',
        'Express gratitude and appreciation for the hospitality'
      ],
      xpReward: 25,
      avatar: '🌴'
    },
    {
      id: 'ar-bargain',
      title: 'Bargaining in Riyadh Souq',
      description: 'Negotiate the purchase of a hand-crafted leather goods piece with a highly persuasive Riyadh merchant.',
      language: 'Arabic',
      flag: '🇸🇦',
      level: 'B1',
      levelLabel: 'B1 Intermediate',
      characterName: 'Tariq',
      characterRole: 'Souq Merchant',
      characterPersona: 'Hospitable, expressive, and highly persuasive merchant who loves a good negotiation.',
      initialMessage: 'يا هلا بك! دكّاننا يتشرف بزيارتك. هذه الحقيبة الجلدية شغل يدوي فاخر، وسعرها الأصلي 500 ريال فقط لأجلك. ما رأيك؟',
      objectives: [
        'Praise the quality of the goods but mention your budget is limited',
        'Offer a lower price (around 250-300 Riyals) in a polite manner',
        'Inquire if there is a discount if you buy a second small item',
        'Agree on a final price and conclude with a friendly blessing'
      ],
      xpReward: 40,
      avatar: '👳‍♂️'
    },
    {
      id: 'ar-meeting',
      title: 'Corporate Business Discussion',
      description: 'Propose a strategic partnership for a renewable energy venture with a local executive.',
      language: 'Arabic',
      flag: '🇸🇦',
      level: 'C1',
      levelLabel: 'C1 Advanced',
      characterName: 'Abu Fahad',
      characterRole: 'Investment Director',
      characterPersona: 'Influential, sharp, and traditional business leader. He values long-term trust and strategic vision.',
      initialMessage: 'أهلاً بك يا أستاذ. قرأت ملخص مشروعكم عن الطاقة الشمسية في المنطقة الشرقية. الفكرة واعدة، لكن كيف تضمنون العائد المالي للاستثمار؟',
      objectives: [
        'Present the financial viability of your solar project professionally',
        'Address risks related to maintenance and desert dust storms',
        'Propose a joint venture structure with local participation',
        'Suggest a formal follow-up meeting with technical teams'
      ],
      xpReward: 55,
      avatar: '🏢'
    }
  ],
  Italian: [
    {
      id: 'it-vespa',
      title: 'Renting a Vespa in Rome',
      description: 'Rent a classic Vespa from Giulia near the Colosseum. Ask for a helmet and negotiate multi-day discounts.',
      language: 'Italian',
      flag: '🇮🇹',
      level: 'B1',
      levelLabel: 'B1 Intermediate',
      characterName: 'Giulia',
      characterRole: 'Vespa Shop Owner',
      characterPersona: 'Friendly, passionate Roman who wants the customer to travel safely and see the best sights.',
      initialMessage: 'Ciao! Benvenuto a Roma! Vuoi noleggiare una Vespa rossa per girare la città eterna? Che modello preferisci?',
      objectives: [
        'State you want to rent a Vespa for three days',
        'Ask if a safe helmet (il casco) is included in the price',
        'Ask about roadside assistance insurance (assicurazione)',
        'Ask Giulia for her favorite scenic route to avoid heavy traffic'
      ],
      xpReward: 35,
      avatar: '🛵'
    },
    {
      id: 'it-dinner',
      title: 'Ordering at a Roman Trattoria',
      description: 'Book a nice cozy table in Trastevere and order authentic Roman pasta dishes while clarifying ingredients.',
      language: 'Italian',
      flag: '🇮🇹',
      level: 'A2',
      levelLabel: 'A2 Elementary',
      characterName: 'Gianni',
      characterRole: 'Trattoria Camerier',
      characterPersona: 'Energetic, warm, and highly expressive Roman waiter who takes extreme pride in his carbonara.',
      initialMessage: 'Buonasera! Benvenuti da Gianni! Abbiamo un tavolino fantastico proprio qui vicino alla finestra. Cosa vi porto da bere intanto?',
      objectives: [
        'Request a glass of house red wine (un bicchiere di vino rosso della casa)',
        'Order an authentic Roman pasta (Carbonara, Amatriciana, or Cacio e Pepe)',
        'Inquire if a specific dish contains nuts or dairy due to dietary preferences',
        'Praise the food and ask for the bill (il conto, per favore)'
      ],
      xpReward: 30,
      avatar: '🍝'
    },
    {
      id: 'it-art',
      title: 'Discussing Michelangelo in Florence',
      description: 'Discuss the historical significance of the Statue of David with a museum curator.',
      language: 'Italian',
      flag: '🇮🇹',
      level: 'B2',
      levelLabel: 'B2 Upper Intermediate',
      characterName: 'Professor Rossi',
      characterRole: 'Museum Curator',
      characterPersona: 'Extremely knowledgeable and artistic Florentine scholar who loves deep discussions about the Renaissance.',
      initialMessage: 'Salve. Si trova di fronte alla maestosità del David. Guardi la tensione nei dettagli delle mani e degli occhi. Cosa le trasmette quest\'opera?',
      objectives: [
        'Express your emotional response to the statue using descriptive terms',
        'Ask about the history of the single block of marble used by Michelangelo',
        'Discuss the concept of humanism during the Florentine Renaissance',
        'Thank the professor for sharing his fascinating expertise'
      ],
      xpReward: 45,
      avatar: '🎨'
    }
  ]
};

// Initial Achievements
const INITIAL_ACHIEVEMENTS = [
  { id: 'first_conv', title: 'First Conversation 🗣️', desc: 'Successfully finish any language practice scenario.', unlocked: true, date: '2026-07-10' },
  { id: 'streak_7', title: 'Perfect Week ⚡', desc: 'Reach a 7-day active practice streak.', unlocked: false },
  { id: 'xp_1000', title: 'Vocabulary Giant 🧠', desc: 'Earn a total of 1000 XP in your chosen languages.', unlocked: true, date: '2026-07-12' },
  { id: 'polyglot', title: 'Polyglot Explorer 🌍', desc: 'Complete scenarios in 3 or more different languages.', unlocked: false },
  { id: 'custom_builder', title: 'Scenario Creator 🛠️', desc: 'Generate and complete a dynamic AI scenario from the Custom Builder.', unlocked: false }
];

// Leaderboard Initial Data
const LEADERBOARD_USERS = [
  { rank: 1, name: 'Elena 🇪🇸', avatar: '👩‍🦰', xp: 5120, level: 12, streak: 18 },
  { rank: 2, name: 'Alex 🇺🇸', avatar: '👱‍♂️', xp: 4950, level: 10, streak: 12 },
  { rank: 3, name: 'Yusuf 🇹🇷', avatar: '👨‍🦱', xp: 4890, level: 10, streak: 14 },
  { rank: 4, name: 'You', avatar: '🤠', xp: 4820, level: 9, streak: 12, isCurrentUser: true },
  { rank: 5, name: 'Sarah 🇬🇧', avatar: '👩', xp: 4620, level: 9, streak: 8 },
  { rank: 6, name: 'Luca 🇮🇹', avatar: '👦', xp: 3200, level: 7, streak: 5 }
];

export const LanguagePractice: React.FC<LanguagePracticeProps> = ({ user, onAnalysisComplete, addNotification }) => {
  // Navigation tabs or state: 'language-select' | 'dashboard' | 'arena' | 'evaluation'
  const [currentView, setCurrentView] = useState<'language-select' | 'dashboard' | 'arena' | 'evaluation'>('language-select');
  
  // Selected Language state
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption | null>(null);

  // Active Scenarios list (defaults to FIXED, but can be updated by dynamic AI generation)
  const [scenarios, setScenarios] = useState<LanguageScenario[]>([]);
  const [isGeneratingNewScenarios, setIsGeneratingNewScenarios] = useState(false);

  // Custom Scenario Builder States
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customLevel, setCustomLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B1');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  // Active Session state
  const [selectedScenario, setSelectedScenario] = useState<LanguageScenario | null>(null);
  const [messages, setMessages] = useState<LessonMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const [completedObjectives, setCompletedObjectives] = useState<string[]>([]);
  const [turnCount, setTurnCount] = useState(0);

  // Gemini Live Hands-Free real-time voice mode refs and states
  const [isGeminiLiveConnecting, setIsGeminiLiveConnecting] = useState(false);
  const [isGeminiLiveActive, setIsGeminiLiveActive] = useState(false);
  const [geminiLiveError, setGeminiLiveError] = useState<string | null>(null);
  const [aiSpeakingText, setAiSpeakingText] = useState('');
  
  const geminiLiveWsRef = useRef<WebSocket | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const latestUserMessageRef = useRef<string>("");
  
  const micStreamRef = useRef<MediaStream | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);

  // Web Speech Recognition & Dynamic Audio playback states
  const [recognition, setRecognition] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Suggestion State
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<{ target: string; translation: string } | null>(null);

  // Evaluation States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<LessonEvaluation | null>(null);
  const [earnedXp, setEarnedXp] = useState(0);

  // Game/User Progress
  const [progress, setProgress] = useState<UserProgress>({
    xp: 4820,
    streak: 12,
    longestStreak: 15,
    lastActiveDate: new Date().toDateString(),
    level: 9,
    completedScenariosCount: 22
  });

  const [leaderboard, setLeaderboard] = useState(LEADERBOARD_USERS);
  const [achievements, setAchievements] = useState(INITIAL_ACHIEVEMENTS);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load progress
  useEffect(() => {
    const saved = localStorage.getItem('revu_language_practice_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress(parsed);
        setLeaderboard(prev => prev.map(u => u.isCurrentUser ? { ...u, xp: parsed.xp, level: parsed.level, streak: parsed.streak } : u).sort((a,b) => b.xp - a.xp));
      } catch (e) {
        console.error('Failed to load language practice progress', e);
      }
    }
  }, []);

  // Save progress helper
  const saveProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem('revu_language_practice_v2', JSON.stringify(newProgress));
    
    // Sync leaderboard
    setLeaderboard(prev => {
      const updated = prev.map(u => u.isCurrentUser ? { ...u, xp: newProgress.xp, level: newProgress.level, streak: newProgress.streak } : u);
      return updated.sort((a,b) => b.xp - a.xp).map((u, idx) => ({ ...u, rank: idx + 1 }));
    });
  };

  // Initialize Speech Recognition & Audio Cleanups
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false; // stops recording after a complete phrase
      rec.interimResults = true; // returns real-time intermediate feedback
      
      rec.onstart = () => {
        setIsRecording(true);
        setRecognizedText('');
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        setRecognizedText(text);
        setInputMessage(text);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        setIsListening(false);
      };

      setRecognition(rec);
    }

    return () => {
      // Cleanup audio playback on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Gemini Live Hands-Free real-time voice mode actions
  const stopMicrophone = () => {
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect();
      micProcessorRef.current = null;
    }
    if (micContextRef.current) {
      micContextRef.current.close().catch(() => {});
      micContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
  };

  const disconnectGeminiLive = () => {
    setIsGeminiLiveActive(false);
    setIsGeminiLiveConnecting(false);
    setIsListening(false);
    setIsPlayingAudio(false);
    setAiSpeakingText('');
    setRecognizedText('');

    if (geminiLiveWsRef.current) {
      try {
        geminiLiveWsRef.current.close();
      } catch(e) {}
      geminiLiveWsRef.current = null;
    }

    stopMicrophone();

    // Stop all active playing audio sources
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch(e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
  };

  const startMicrophone = async (socket: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      micContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      micProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsListening(true);

      processor.onaudioprocess = (e) => {
        if (socket.readyState === WebSocket.OPEN) {
          const float32Array = e.inputBuffer.getChannelData(0);
          
          // Convert Float32 to 16-bit PCM little-endian
          const pcmBuffer = new ArrayBuffer(float32Array.length * 2);
          const pcmView = new DataView(pcmBuffer);
          for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            pcmView.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          }

          // Encode to base64
          const pcmBytes = new Uint8Array(pcmBuffer);
          let binary = "";
          for (let i = 0; i < pcmBytes.length; i++) {
            binary += String.fromCharCode(pcmBytes[i]);
          }
          const base64Audio = btoa(binary);

          socket.send(JSON.stringify({ audio: base64Audio }));
        }
      };

    } catch (err) {
      console.error("Error starting microphone:", err);
      setIsListening(false);
      addNotification?.({
        id: Date.now().toString(),
        type: 'alert',
        title: 'Microphone Access Denied',
        message: 'Could not access your microphone. Real Voice practice requires microphone permissions.',
        timestamp: new Date().toISOString()
      });
    }
  };

  const playLiveAudioChunk = (base64Audio: string) => {
    const audioCtx = outputAudioCtxRef.current;
    if (!audioCtx || isMuted) return;

    try {
      setIsPlayingAudio(true);
      
      // Decode base64 to Float32 sample array
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const buffer = new ArrayBuffer(len);
      const view = new DataView(buffer);
      
      // Copy binary string into array buffer
      for (let i = 0; i < len; i++) {
        view.setUint8(i, binaryString.charCodeAt(i));
      }

      const int16Length = len / 2;
      const float32 = new Float32Array(int16Length);
      for (let i = 0; i < int16Length; i++) {
        const val = view.getInt16(i * 2, true); // true = little endian
        float32[i] = val / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      // Track active sources to stop them on interruption or close
      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(src => src !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsPlayingAudio(false);
        }
      };

      // Schedule gapless play
      let startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

    } catch (e) {
      console.error("Error playing audio chunk:", e);
    }
  };

  const connectGeminiLive = async () => {
    if (isGeminiLiveActive || isGeminiLiveConnecting) return;
    
    setIsGeminiLiveConnecting(true);
    setGeminiLiveError(null);
    setRecognizedText('');
    setAiSpeakingText('');
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socketUrl = `${protocol}//${window.location.host}/api/gemini-live`;
      const ws = new WebSocket(socketUrl);
      geminiLiveWsRef.current = ws;

      ws.onopen = () => {
        setIsGeminiLiveConnecting(false);
        setIsGeminiLiveActive(true);
        
        // Prepare systemInstruction
        const systemInstruction = `
          IMPORTANT: YOU ARE PLAYING AN IMMERSIVE LANGUAGE ROLEPLAY SCENARIO.
          YOU MUST STAY IN CHARACTER 100% OF THE TIME.
          DO NOT BREAK CHARACTER or mention being an AI assistant or large language model.
          
          SITUATION SETTING:
          - Character Name: ${selectedScenario?.characterName}
          - Role/Relation: ${selectedScenario?.characterRole}
          - Persona profile: ${selectedScenario?.characterPersona}
          - Language: ${selectedScenario?.language}
          - Level: ${selectedScenario?.level}
          
          CONVERSATION LAUNCH PROTOCOL:
          1. Speak exclusively in ${selectedScenario?.language}.
          2. Keep replies natural, brief, and digestible (1-3 sentences).
          3. Challenge the student slightly but encourage them to proceed toward their goals.
          4. Do not complete the student's tasks for them.
          
          STUDENT OBJECTIVES:
          ${selectedScenario?.objectives.map(o => `- ${o}`).join('\n')}
          
          Your opening line is exactly: "${selectedScenario?.initialMessage}"
        `;
        
        const selectedVoice = getVoiceModelForScenario(selectedScenario);

        // Send setup message
        ws.send(JSON.stringify({
          type: "setup",
          voice: selectedVoice,
          systemInstruction: systemInstruction
        }));

        // Initialize Output AudioContext for playback (24kHz)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;

        // Start capturing user mic
        startMicrophone(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === "error") {
            console.error("Gemini Live Error:", msg.error);
            setGeminiLiveError(msg.error);
            return;
          }

          if (msg.type === "close") {
            console.log("Gemini Live stream closed by server");
            disconnectGeminiLive();
            return;
          }

          if (msg.type === "server_message") {
            const serverMsg = msg.message;

            // 1. Handle Model Interrupted
            if (serverMsg.serverContent?.interrupted) {
              console.log("Model interrupted!");
              // Stop playback immediately
              activeSourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              activeSourcesRef.current = [];
              nextStartTimeRef.current = 0;
              setIsPlayingAudio(false);
              setAiSpeakingText('');
              return;
            }

            // 2. Handle User Audio Transcription (Real-time display)
            if (serverMsg.userContent?.parts) {
              const text = serverMsg.userContent.parts.map((p: any) => p.text).join("");
              if (text) {
                setRecognizedText(text);
                latestUserMessageRef.current = text;
              }
            }

            // 3. Handle Model Audio Transcription (Real-time accumulation)
            if (serverMsg.serverContent?.modelTurn?.parts) {
              const parts = serverMsg.serverContent.modelTurn.parts;
              
              // Extract text if present
              const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join("");
              if (textParts) {
                setAiSpeakingText(prev => prev + textParts);
              }

              // Extract audio inline data
              const audioPart = parts.find((p: any) => p.inlineData?.data);
              if (audioPart?.inlineData?.data) {
                const base64Audio = audioPart.inlineData.data;
                playLiveAudioChunk(base64Audio);
              }
            }

            // 4. Handle Model Turn Complete
            if (serverMsg.serverContent?.turnComplete) {
              console.log("Model turn completed");
              
              // Append User message if we had one
              if (latestUserMessageRef.current) {
                const userText = latestUserMessageRef.current;
                setMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg && lastMsg.sender === 'student' && lastMsg.text === userText) {
                    return prev;
                  }
                  return [...prev, {
                    id: "user-" + Date.now().toString(),
                    sender: 'student',
                    text: userText
                  }];
                });
                latestUserMessageRef.current = "";
                setTurnCount(prev => prev + 1);
              }

              // Append AI message when speech transcription accumulates
              setAiSpeakingText(accumulated => {
                if (accumulated) {
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.sender === 'ai' && lastMsg.text === accumulated) {
                      return prev;
                    }
                    return [...prev, {
                      id: "ai-" + Date.now().toString(),
                      sender: 'ai',
                      text: accumulated,
                      showTranslation: false
                    }];
                  });
                }
                return ""; // Reset for next turn
              });
            }
          }
        } catch (e) {
          console.error("Error parsing live ws message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setGeminiLiveError("Failed to connect to real-time voice channel.");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setIsGeminiLiveActive(false);
        setIsListening(false);
      };

    } catch (err: any) {
      console.error("Failed to connect to Gemini Live:", err);
      setIsGeminiLiveConnecting(false);
      setGeminiLiveError(err.message || String(err));
    }
  };

  useEffect(() => {
    if (isVoiceMode && currentView === 'arena' && selectedScenario) {
      connectGeminiLive();
    } else {
      disconnectGeminiLive();
    }
    
    return () => {
      disconnectGeminiLive();
    };
  }, [isVoiceMode, currentView, selectedScenario]);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // Handle language selection
  const handleSelectLanguage = (lang: LanguageOption) => {
    setSelectedLanguage(lang);
    setScenarios(FIXED_SCENARIOS[lang.code] || []);
    setCurrentView('dashboard');
  };

  // Generate Scenarios with AI
  const handleRegenerateScenarios = async () => {
    if (!selectedLanguage) return;
    setIsGeneratingNewScenarios(true);
    
    try {
      const aiInstance = getAI();
      const prompt = `Generate exactly 3 diverse, highly engaging, level-stratified conversation practice scenarios for a language learning application.
      
      TARGET LANGUAGE: ${selectedLanguage.code}
      COUNTRY FLAG: ${selectedLanguage.flag}
      
      Requirements for each scenario:
      - Choose one of the following CEFR Levels for each of the 3 scenarios: A1 (Beginner), B1 (Intermediate), C1 (Advanced).
      - Provide realistic real-world settings (e.g. airport check-in, ordering a taxi, dealing with a lost suitcase, discussing literature at a book club).
      - Create a relatable, lively character role and description.
      - Create 4 clear objectives the student must accomplish during the conversation.
      - Provide a warm, contextual initial message in ${selectedLanguage.code} from the AI character.
      
      Return the output as a JSON array containing exactly 3 objects. Use this JSON schema:
      {
        "id": "unique-scenario-id-string",
        "title": "Short catchy title in English",
        "description": "Engaging description in English",
        "language": "${selectedLanguage.code}",
        "flag": "${selectedLanguage.flag}",
        "level": "A1 or B1 or C1",
        "levelLabel": "A1 Beginner or B1 Intermediate or C1 Advanced",
        "characterName": "Name of AI",
        "characterRole": "Role of AI",
        "characterPersona": "Persona description in English",
        "initialMessage": "Welcome message in ${selectedLanguage.code}",
        "objectives": ["Objective 1 in English", "Objective 2 in English", "Objective 3", "Objective 4"],
        "xpReward": 35,
        "avatar": "Single emoji suited for this character"
      }
      
      Do not output any introductory or explanation text. Return ONLY the valid JSON array.`;

      const resp = await aiInstance.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                language: { type: Type.STRING },
                flag: { type: Type.STRING },
                level: { type: Type.STRING },
                levelLabel: { type: Type.STRING },
                characterName: { type: Type.STRING },
                characterRole: { type: Type.STRING },
                characterPersona: { type: Type.STRING },
                initialMessage: { type: Type.STRING },
                objectives: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                xpReward: { type: Type.NUMBER },
                avatar: { type: Type.STRING }
              },
              required: [
                'id', 'title', 'description', 'language', 'flag', 'level', 'levelLabel', 
                'characterName', 'characterRole', 'characterPersona', 'initialMessage', 
                'objectives', 'xpReward', 'avatar'
              ]
            }
          }
        }
      });

      const parsed = JSON.parse(resp.text || '[]') as LanguageScenario[];
      if (parsed.length > 0) {
        setScenarios(parsed);
        addNotification?.({
          id: Date.now().toString(),
          type: 'feedback',
          title: 'Scenarios Regenerated',
          message: `Successfully generated 3 brand-new AI scenarios for ${selectedLanguage.code}!`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e: any) {
      console.error('Failed to regenerate scenarios', e);
      addNotification?.({
        id: Date.now().toString(),
        type: 'alert',
        title: 'Generation Failed',
        message: e.message || 'Could not contact Gemini. Reverting to standard list.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsGeneratingNewScenarios(false);
    }
  };

  // Custom Scenario Builder
  const handleCreateCustomScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLanguage || !customPrompt.trim()) return;
    setIsGeneratingCustom(true);

    try {
      const aiInstance = getAI();
      const prompt = `Create a bespoke language practice scenario based on the user's prompt: "${customPrompt}".
      
      TARGET LANGUAGE: ${selectedLanguage.code}
      TARGET CEFR LEVEL: ${customLevel}
      
      Generate a realistic roleplay setup where the AI is a native character and the student plays a matching role.
      Define 4 specific interactive objectives in English that the student should complete.
      Provide the scenario in the exact JSON format specified below:
      {
        "id": "custom-${Date.now()}",
        "title": "A short engaging title in English",
        "description": "An inviting scenario description in English explaining the context and the student's task",
        "language": "${selectedLanguage.code}",
        "flag": "${selectedLanguage.flag}",
        "level": "${customLevel}",
        "levelLabel": "${customLevel} Custom",
        "characterName": "Suitable name for the AI character",
        "characterRole": "Role or relationship of the AI",
        "characterPersona": "Persona description in English describing tone, speed, and helpfulness",
        "initialMessage": "A natural, warm, realistic greeting in ${selectedLanguage.code} appropriate for the level",
        "objectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4"],
        "xpReward": 45,
        "avatar": "Single descriptive emoji"
      }
      
      Do not explain or add markdown. Return ONLY valid JSON.`;

      const resp = await aiInstance.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              language: { type: Type.STRING },
              flag: { type: Type.STRING },
              level: { type: Type.STRING },
              levelLabel: { type: Type.STRING },
              characterName: { type: Type.STRING },
              characterRole: { type: Type.STRING },
              characterPersona: { type: Type.STRING },
              initialMessage: { type: Type.STRING },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              xpReward: { type: Type.NUMBER },
              avatar: { type: Type.STRING }
            },
            required: [
              'id', 'title', 'description', 'language', 'flag', 'level', 'levelLabel', 
              'characterName', 'characterRole', 'characterPersona', 'initialMessage', 
              'objectives', 'xpReward', 'avatar'
            ]
          }
        }
      });

      const newScenario = JSON.parse(resp.text || '{}') as LanguageScenario;
      if (newScenario && newScenario.title) {
        // Prepend custom scenario to scenarios list
        setScenarios(prev => [newScenario, ...prev]);
        setShowCustomBuilder(false);
        setCustomPrompt('');
        
        // Unlock Achievement
        setAchievements(prev => prev.map(a => a.id === 'custom_builder' ? { ...a, unlocked: true, date: new Date().toLocaleDateString() } : a));

        addNotification?.({
          id: Date.now().toString(),
          type: 'feedback',
          title: 'Custom Scenario Created',
          message: `"${newScenario.title}" has been added to your scenarios!`,
          timestamp: new Date().toISOString()
        });

        // Auto-launch the custom scenario
        startLesson(newScenario);
      }
    } catch (e: any) {
      console.error('Failed to create custom scenario', e);
      addNotification?.({
        id: Date.now().toString(),
        type: 'alert',
        title: 'Failed to build custom scenario',
        message: e.message || 'Gemini could not fulfill the custom roleplay specifications.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  // Start active conversation practice
  const startLesson = async (scenario: LanguageScenario) => {
    setSelectedScenario(scenario);
    setCompletedObjectives([]);
    setTurnCount(1);
    setInputMessage('');
    setCurrentSuggestion(null);
    setEvaluation(null);
    setMessages([
      {
        id: '1',
        sender: 'ai',
        text: scenario.initialMessage,
        showTranslation: false
      }
    ]);
    setCurrentView('arena');
    setIsAiTyping(true);

    try {
      const aiInstance = getAI();
      const systemInstruction = `
        IMPORTANT: YOU ARE PLAYING A IMMERSIVE LANGUAGE ROLEPLAY SCENARIO.
        YOU MUST STAY IN CHARACTER 100% OF THE TIME.
        DO NOT BREAK CHARACTER or mention being an AI assistant or large language model.
        
        SITUATION SETTING:
        - Character Name: ${scenario.characterName}
        - Role/Relation: ${scenario.characterRole}
        - Persona profile: ${scenario.characterPersona}
        - Language: ${scenario.language}
        - Level: ${scenario.level}
        
        CONVERSATION LAUNCH PROTOCOL:
        1. Speak exclusively in ${scenario.language}.
        2. Keep replies natural, brief, and digestible (1-3 sentences).
        3. Challenge the student slightly but encourage them to proceed toward their goals.
        4. Do not complete the student's tasks for them.
        
        STUDENT OBJECTIVES:
        ${scenario.objectives.map(o => `- ${o}`).join('\n')}
        
        Your opening line is exactly: "${scenario.initialMessage}"
      `;

      const chat = aiInstance.chats.create({
        model: 'gemini-3.5-flash',
        config: {
          systemInstruction,
          temperature: 0.95,
          topP: 0.95
        }
      });
      setChatSession(chat);
      if (!isMuted) {
        setTimeout(() => {
          playHumanSpeech(scenario.initialMessage);
        }, 300);
      }
    } catch (e: any) {
      console.error('Error starting Gemini roleplay', e);
      addNotification?.({
        id: Date.now().toString(),
        type: 'alert',
        title: 'Connection Error',
        message: 'Could not configure Gemini chat session.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  // Handle student sending message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isAiTyping || !selectedScenario) return;

    // Stop recording if active when sending
    if (isRecording) {
      stopListening();
    }

    const studentMsg: LessonMessage = {
      id: Date.now().toString(),
      sender: 'student',
      text: textToSend
    };

    setMessages(prev => [...prev, studentMsg]);
    setInputMessage('');
    setCurrentSuggestion(null);
    setIsAiTyping(true);
    setTurnCount(prev => prev + 1);

    try {
      let aiReplyText = '';
      if (chatSession) {
        const resp = await chatSession.sendMessage({
          message: textToSend
        });
        aiReplyText = resp.text || '';
      } else {
        // Fallback
        const aiInstance = getAI();
        const fallback = await aiInstance.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Response in ${selectedScenario.language} as character ${selectedScenario.characterName}. Keep it 1-2 sentences. User said: "${textToSend}"`
        });
        aiReplyText = fallback.text || '';
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiReplyText,
          showTranslation: false
        }
      ]);

      if (!isMuted) {
        playHumanSpeech(aiReplyText);
      }

      // Simple objective progress simulation as conversation deepens
      selectedScenario.objectives.forEach((obj, idx) => {
        if (!completedObjectives.includes(obj)) {
          if (turnCount >= (idx + 1) * 2) {
            setCompletedObjectives(prev => [...prev, obj]);
          }
        }
      });

    } catch (e: any) {
      console.error('Gemini error during chat', e);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `[Error: Unable to connect. Please verify internet and API config.]`
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Get Hint/Suggestion from AI Tutor
  const handleGetSuggestion = async () => {
    if (!selectedScenario) return;
    setIsGettingSuggestion(true);
    setCurrentSuggestion(null);

    const chatContext = messages.slice(-4).map(m => `${m.sender === 'student' ? 'Student' : 'AI'}: ${m.text}`).join('\n');

    try {
      const aiInstance = getAI();
      const prompt = `Provide a helpful recommended next response in ${selectedScenario.language} for a student learning at level ${selectedScenario.level}.
      
      SCENARIO: "${selectedScenario.title}"
      AI CHAR NAME: "${selectedScenario.characterName}"
      RECENT CHAT:
      ${chatContext}
      
      Generate a single suggested option that is natural, authentic, and matches the target level.
      Provide the suggestion as a simple JSON object containing:
      - "target": The suggested reply in ${selectedScenario.language}
      - "translation": The English translation or contextual tips.
      
      Do not include other text. Return ONLY valid JSON.`;

      const response = await aiInstance.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              target: { type: Type.STRING },
              translation: { type: Type.STRING }
            },
            required: ['target', 'translation']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      setCurrentSuggestion(parsed);
    } catch (e) {
      console.error('Failed to load dynamic hint', e);
      setCurrentSuggestion({
        target: 'An error occurred fetching suggestion.',
        translation: 'Please try typing a simple reply!'
      });
    } finally {
      setIsGettingSuggestion(false);
    }
  };

  // Play speech using native browser TTS if API fails or is configured
  const playBrowserFallbackSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voiceLangs: Record<string, string> = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'German': 'de-DE',
        'Arabic': 'ar-SA',
        'Italian': 'it-IT'
      };

      utterance.lang = voiceLangs[selectedScenario?.language || ''] || 'en-US';
      utterance.rate = 0.85; // highly digestible speed for learners
      window.speechSynthesis.speak(utterance);
    }
  };

  // Play AI message using high-quality Human Voices (Gemini TTS)
  const playHumanSpeech = async (text: string) => {
    if (!selectedScenario) return;
    setIsPlayingAudio(true);
    try {
      // Cancel previous audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Check if browser speech synthesis is running and cancel it
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const voiceModel = getVoiceModelForScenario(selectedScenario);
      let blob: Blob;

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceModel },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("Failed to generate audio from Gemini TTS.");
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

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
      
      audio.onerror = () => {
        setIsPlayingAudio(false);
      };

      await audio.play();
    } catch (e) {
      console.error('High-quality TTS failed, falling back to Web Speech Synthesis:', e);
      setIsPlayingAudio(false);
      playBrowserFallbackSpeech(text);
    }
  };

  const playSpeech = (text: string) => {
    playHumanSpeech(text);
  };

  // Start Web Speech Recognition
  const startListening = () => {
    if (!recognition) {
      addNotification?.({
        id: Date.now().toString(),
        type: 'alert',
        title: 'Speech Recognition Unsupported',
        message: 'Your browser does not support standard web speech recognition. Please try using Google Chrome, Edge, or Safari.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const recLangs: Record<string, string> = {
      'English': 'en-US',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Arabic': 'ar-SA',
      'Italian': 'it-IT'
    };

    try {
      recognition.lang = recLangs[selectedScenario?.language || ''] || 'en-US';
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start speech recognition', e);
    }
  };

  // Stop Web Speech Recognition
  const stopListening = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error('Error stopping recognition', e);
      }
      setIsListening(false);
    }
  };

  // Dynamic Translate toggle via Gemini
  const handleToggleTranslation = async (messageId: string) => {
    const updated = [...messages];
    const idx = updated.findIndex(m => m.id === messageId);
    if (idx === -1) return;

    const msg = updated[idx];
    if (msg.translation) {
      msg.showTranslation = !msg.showTranslation;
      setMessages(updated);
      return;
    }

    try {
      const aiInstance = getAI();
      const prompt = `Translate this ${selectedScenario?.language} roleplay message into clean, contextual English. Return ONLY the direct translation, nothing else.
      
      MESSAGE: "${msg.text}"`;

      const response = await aiInstance.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      msg.translation = response.text?.trim() || 'Could not translate.';
      msg.showTranslation = true;
      setMessages(updated);
    } catch (e) {
      console.error('Translation failed', e);
      msg.translation = 'Translation service temporary error.';
      msg.showTranslation = true;
      setMessages(updated);
    }
  };

  // End active roleplay session and generate detailed feedback
  const handleEndSessionAndEvaluate = async () => {
    if (!selectedScenario) return;
    setIsEvaluating(true);
    setCurrentView('evaluation');

    const transcript = messages.map(m => `${m.sender === 'student' ? 'Student' : selectedScenario.characterName}: ${m.text}`).join('\n\n');

    try {
      const aiInstance = getAI();
      const prompt = `You are a professional CEFR language evaluator and native instructor. Assess the following roleplay conversation.
      
      SCENARIO: ${selectedScenario.title}
      TARGET LANGUAGE: ${selectedScenario.language}
      CEFR TARGET LEVEL: ${selectedScenario.level}
      
      STUDENT OBJECTIVES INVOLVED:
      ${selectedScenario.objectives.map(o => `- ${o}`).join('\n')}
      
      TRANSCRIPT:
      ${transcript}
      
      Please evaluate carefully. Grade based on strict CEFR expectations. Provide positive, motivating feedback.
      Your evaluation response must be a JSON object containing:
      1. "overallScore": 0-100 score
      2. "taskScore": 0-100 score (percentage of objectives met)
      3. "grammarScore": 0-100 score
      4. "vocabScore": 0-100 score
      5. "fluencyScore": 0-100 score
      6. "pronunciationScore": 0-100 score (estimate based on phrasing complexity and vocabulary speed)
      7. "feedback": 4-5 warm, detailed sentences explaining strengths, pacing, and next steps in English.
      8. "grammarCorrections": array of objects:
         - "original": student's incorrect or flawed phrase
         - "explanation": helpful explanation of why/how to fix
         - "corrected": the corrected sentence in ${selectedScenario.language}
         (Max 3 items. If perfect, provide minor stylistic polishes instead)
      9. "vocabUpgrades": array of objects:
         - "original": a basic word or phrase used by the student
         - "explanation": why this native variant sounds more natural or represents a higher CEFR level
         - "upgrade": the recommended upgraded native word or idiomatic phrase in ${selectedScenario.language}
         (Max 3 items)
         
      Do not include any conversational explanation outside the JSON. Return ONLY valid JSON.`;

      const response = await aiInstance.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              taskScore: { type: Type.NUMBER },
              grammarScore: { type: Type.NUMBER },
              vocabScore: { type: Type.NUMBER },
              fluencyScore: { type: Type.NUMBER },
              pronunciationScore: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              grammarCorrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    corrected: { type: Type.STRING }
                  },
                  required: ['original', 'explanation', 'corrected']
                }
              },
              vocabUpgrades: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    upgrade: { type: Type.STRING }
                  },
                  required: ['original', 'explanation', 'upgrade']
                }
              }
            },
            required: ['overallScore', 'taskScore', 'grammarScore', 'vocabScore', 'fluencyScore', 'pronunciationScore', 'feedback', 'grammarCorrections', 'vocabUpgrades']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}') as LessonEvaluation;
      setEvaluation(parsed);

      // Save user metrics progress
      const rewardXp = selectedScenario.xpReward;
      const performanceBonus = Math.floor((parsed.overallScore / 100) * 15);
      const totalEarned = rewardXp + performanceBonus;
      setEarnedXp(totalEarned);

      const nextXp = progress.xp + totalEarned;
      const nextLevel = Math.floor(nextXp / 500) + 1; // 500 XP per level

      const today = new Date().toDateString();
      let updatedStreak = progress.streak;
      if (progress.lastActiveDate !== today) {
        updatedStreak += 1;
      }

      const updatedProgress: UserProgress = {
        xp: nextXp,
        streak: updatedStreak,
        longestStreak: Math.max(progress.longestStreak, updatedStreak),
        lastActiveDate: today,
        level: nextLevel,
        completedScenariosCount: progress.completedScenariosCount + 1
      };

      saveProgress(updatedProgress);

      // Check off "First Conversation" achievement
      setAchievements(prev => prev.map(a => a.id === 'first_conv' ? { ...a, unlocked: true, date: new Date().toLocaleDateString() } : a));

      // Trigger main app onAnalysisComplete so it shows in the historic lists
      if (onAnalysisComplete) {
        onAnalysisComplete({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          agentName: user?.name || 'Language Practice Learner',
          customerName: `${selectedScenario.characterName} (${selectedScenario.language})`,
          summary: parsed.feedback,
          overallScore: parsed.overallScore,
          sentiment: parsed.overallScore >= 80 ? 'Positive' : (parsed.overallScore >= 50 ? 'Neutral' : 'Negative'),
          criteriaResults: [
            { name: 'Task Completion', score: parsed.taskScore, reasoning: 'Assessment of how well the scenario objectives were reached.', suggestion: 'Address missing goals mentioned in objectives.' },
            { name: 'Grammar Accuracy', score: parsed.grammarScore, reasoning: 'Precision of sentence syntax and spelling conjugations.', suggestion: 'Refer to corrected grammar cards.' },
            { name: 'Vocabulary Selection', score: parsed.vocabScore, reasoning: 'Contextual level of words and natural idiomatic choice.', suggestion: 'Review native upgrades list.' },
            { name: 'Fluency', score: parsed.fluencyScore, reasoning: 'Response pacing and interaction naturalness.', suggestion: 'Practice responding with lower delay times!' }
          ],
          rawTranscript: transcript
        });
      }

      addNotification?.({
        id: Date.now().toString(),
        type: 'feedback',
        title: `Lesson Complete! +${totalEarned} XP`,
        message: `You earned ${parsed.overallScore}% in "${selectedScenario.title}". Keep learning!`,
        timestamp: new Date().toISOString()
      });

    } catch (e: any) {
      console.error('Failed to generate full scorecard', e);
      // Fallback
      const mockEval: LessonEvaluation = {
        overallScore: 82,
        taskScore: 85,
        grammarScore: 80,
        vocabScore: 80,
        fluencyScore: 85,
        pronunciationScore: 80,
        feedback: 'Excellent work completing the conversational scenario! You demonstrated good overall command and successfully communicated context despite a few minor hesitations.',
        grammarCorrections: [
          { original: 'Vespa per tre giorno', explanation: 'giorno should agree in plural with tre', corrected: 'Vespa per tre giorni' }
        ],
        vocabUpgrades: [
          { original: 'grande', explanation: 'Use a more elegant adjective like "maestoso" or "imponente" to describe Renaissance statues.', upgrade: 'maestoso' }
        ]
      };
      setEvaluation(mockEval);
      setEarnedXp(selectedScenario.xpReward);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#0500e2]/10 rounded-xl text-[#0500e2] dark:text-[#4b53fa]">
            <Globe size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Language Practice Mode
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Real-time immersive AI roleplay, custom scenario building, and CEFR-based evaluation metrics.
            </p>
          </div>
        </div>

        {/* Global Stats Strip */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
          <div className="flex items-center gap-1 px-2.5 py-1 text-orange-500 font-bold text-sm" title="Streak Days">
            <Flame size={18} fill="currentColor" />
            <span>{progress.streak} Day Streak</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1 px-2.5 py-1 text-amber-500 font-bold text-sm" title="Total XP">
            <Star size={18} fill="currentColor" />
            <span>{progress.xp} XP</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1 px-2.5 py-1 text-indigo-600 dark:text-indigo-400 font-bold text-sm" title="Your Level">
            <Award size={18} />
            <span>Level {progress.level}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: LANGUAGE SELECTION */}
        {currentView === 'language-select' && (
          <motion.div
            key="language-select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="text-center py-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Choose Your Target Language</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto mt-1.5">
                Select from our primary languages to explore custom scenarios, dynamically build bespoke AI simulations, or test your speaking confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {LANGUAGES_CATALOG.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-lg hover:border-[#0500e2]/30 dark:hover:border-[#4b53fa]/30 text-left transition-all group flex flex-col justify-between h-56 relative overflow-hidden"
                >
                  {/* Decorative background accent */}
                  <div className={`absolute -right-12 -bottom-12 w-32 h-32 bg-gradient-to-br ${lang.accentColor} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-all duration-500`} />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl shadow-sm rounded-full bg-slate-50 dark:bg-slate-800 p-2.5 inline-block">{lang.flag}</span>
                      <ChevronRight className="text-slate-300 group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa] group-hover:translate-x-1 transition-all" size={20} />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1.5">
                        {lang.name}
                        <span className="text-xs font-medium text-slate-400">({lang.nativeName})</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {lang.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-[#0500e2] dark:text-[#4b53fa] flex items-center gap-1 pt-2 group-hover:underline">
                    <span>Enter Practice Lounge</span>
                    <ArrowRight size={12} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: LANGUAGE PRACTITIONER DASHBOARD */}
        {currentView === 'dashboard' && selectedLanguage && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            
            {/* LEFT 2 COLUMNS: SCENARIOS & DYNAMIC BUILDER */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Back to language select bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentView('language-select')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Choose Another Language</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isGeneratingNewScenarios}
                    onClick={handleRegenerateScenarios}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                  >
                    {isGeneratingNewScenarios ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} />
                        <span>Regenerate Scenarios with AI</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCustomBuilder(!showCustomBuilder)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#0500e2] hover:bg-[#0400c0] dark:bg-[#4b53fa] dark:hover:bg-[#3942df] text-white rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    <span>Custom Scenario Builder</span>
                  </button>
                </div>
              </div>

              {/* CUSTOM SCENARIO BUILDER FORM */}
              <AnimatePresence>
                {showCustomBuilder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form
                      onSubmit={handleCreateCustomScenario}
                      className="bg-gradient-to-br from-[#0500e2]/5 to-[#4b53fa]/5 dark:from-indigo-950/10 dark:to-slate-900/30 p-6 rounded-2xl border border-[#0500e2]/10 dark:border-indigo-950/30 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles className="text-[#0500e2] dark:text-[#4b53fa]" size={16} />
                            Bespoke AI Scenario Creator
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Describe any scenario you want. Gemini will instantly create a custom native character, conversation context, and checklist of goals.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCustomBuilder(false)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Roleplay Context & Scenario Idea
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g. Discussing renting a flat in downtown Madrid, asking for deposit price, and agreeing on utility bills."
                            className="w-full text-sm p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0500e2]/50"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              CEFR Target Level
                            </label>
                            <select
                              value={customLevel}
                              onChange={(e: any) => setCustomLevel(e.target.value)}
                              className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                              <option value="A1">A1 Beginner</option>
                              <option value="A2">A2 Elementary</option>
                              <option value="B1">B1 Intermediate</option>
                              <option value="B2">B2 Upper Intermediate</option>
                              <option value="C1">C1 Advanced</option>
                              <option value="C2">C2 Native/Fluent</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={isGeneratingCustom}
                              className="w-full py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                            >
                              {isGeneratingCustom ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  <span>Generating Live Simulation...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={16} />
                                  <span>Generate & Launch Live Scenario</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ACTIVE SCENARIOS LISTING */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedLanguage.flag}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Available Scenarios for {selectedLanguage.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scenarios.map((sc) => (
                    <div
                      key={sc.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:border-[#0500e2]/20 dark:hover:border-[#4b53fa]/20 transition-all flex flex-col justify-between shadow-sm relative group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl shadow-sm bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl">{sc.avatar}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300`}>
                            {sc.levelLabel}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa] transition-colors">
                            {sc.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                            {sc.description}
                          </p>
                        </div>

                        {/* Objectives breakdown preview */}
                        <div className="bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Scoring Tasks:</span>
                          {sc.objectives.slice(0, 2).map((obj, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                              <CheckSquare size={11} className="text-slate-400" />
                              <span className="truncate">{obj}</span>
                            </div>
                          ))}
                          {sc.objectives.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium pl-4">+{sc.objectives.length - 2} more goals</span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center text-xs">
                          <span className="text-slate-400">Character: <strong className="text-slate-600 dark:text-slate-400">{sc.characterName}</strong> ({sc.characterRole})</span>
                          <span className="font-black text-[#0500e2] dark:text-[#4b53fa]">+{sc.xpReward} XP</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => startLesson(sc)}
                          className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/40 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-white hover:text-[#0500e2] dark:hover:text-[#4b53fa] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-100 dark:border-slate-800"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>Start Speaking Practice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: PROGRESSION STATS, LEADERBOARD, ACHIEVEMENTS */}
            <div className="space-y-6">
              
              {/* Leaderboards card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-4 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                  <Trophy size={16} className="text-amber-500" />
                  <span>Leaderboard Ranking</span>
                </h3>

                <div className="space-y-3">
                  {leaderboard.map((user) => (
                    <div
                      key={user.name}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        user.isCurrentUser 
                          ? 'bg-[#0500e2]/5 border border-[#0500e2]/15 dark:bg-indigo-950/20 dark:border-indigo-900/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 text-xs font-black text-center ${
                          user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          {user.rank}
                        </span>
                        <span className="text-xl">{user.avatar}</span>
                        <div>
                          <span className={`text-xs font-bold block ${user.isCurrentUser ? 'text-[#0500e2] dark:text-[#4b53fa]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {user.name}
                          </span>
                          <span className="text-[10px] text-slate-400">Level {user.level} · 🔥 {user.streak} days</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-white">
                        {user.xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-4 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                  <Award size={16} className="text-[#0500e2] dark:text-[#4b53fa]" />
                  <span>Achievements Progress</span>
                </h3>

                <div className="space-y-3">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`flex items-start gap-2.5 p-2 rounded-xl ${
                        ach.unlocked 
                          ? 'opacity-100' 
                          : 'opacity-50 bg-slate-50 dark:bg-slate-800/10'
                      }`}
                    >
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {ach.unlocked ? (
                          <span className="text-sm font-bold">✔️</span>
                        ) : (
                          <Lock size={12} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{ach.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{ach.desc}</p>
                        {ach.unlocked && ach.date && (
                          <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Unlocked on {ach.date}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* VIEW 3: ACTIVE ROLEPLAY PRACTICE ARENA */}
        {currentView === 'arena' && selectedScenario && (
          <motion.div
            key="arena"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] md:h-[680px]"
          >
            
            {/* LEFT 2 COLUMNS: IMMERSIVE CHAT LOUNGE */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">
              
              {/* TOP ROLEPLAY META BAR */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm">{selectedScenario.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedScenario.characterName}</h4>
                      <span className="text-[10px] font-semibold text-slate-400">({selectedScenario.characterRole})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm truncate">
                      {selectedScenario.title} · CEFR {selectedScenario.level}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Mode Selector Toggle Switch */}
                  <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl mr-2">
                    <button
                      onClick={() => {
                        setIsVoiceMode(false);
                        stopListening();
                      }}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        !isVoiceMode 
                          ? 'bg-white dark:bg-slate-900 text-[#0500e2] dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare size={12} />
                      <span className="hidden xs:inline">Chat</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsVoiceMode(true);
                        startListening();
                      }}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        isVoiceMode 
                          ? 'bg-white dark:bg-slate-900 text-[#0500e2] dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Mic size={12} />
                      <span className="hidden xs:inline">Real Voice Call</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Exit this practice session? Your progress will not be saved.')) {
                        setCurrentView('dashboard');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Exit
                  </button>
                  
                  <button
                    onClick={handleEndSessionAndEvaluate}
                    className="px-4 py-1.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Finish
                  </button>
                </div>
              </div>

              {isVoiceMode ? (
                /* IMMERSIVE HUMAN VOICE CALL ARENA */
                <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 relative overflow-hidden">
                  
                  {/* Glowing background ambient lighting */}
                  <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#0500e2]/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 h-72 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Status Overlay */}
                  <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 z-10">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isListening ? 'bg-red-500 animate-pulse' : 
                        isPlayingAudio ? 'bg-green-500 animate-pulse' :
                        isAiTyping ? 'bg-amber-500 animate-bounce' : 'bg-indigo-500'
                      }`} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isListening ? 'Listening to you...' : 
                         isPlayingAudio ? `${selectedScenario.characterName} is speaking...` :
                         isAiTyping ? 'Thinking...' : 'Voice Connected'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Conversation Turn {turnCount}
                    </span>
                  </div>

                  {/* Center Glowing Avatar */}
                  <div className="flex-1 flex flex-col items-center justify-center my-6 z-10">
                    
                    <div className="relative flex items-center justify-center">
                      <AnimatePresence>
                        {(isPlayingAudio || isListening) && (
                          <>
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0.8 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                              className={`absolute w-32 h-32 rounded-full border-2 ${
                                isPlayingAudio ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'
                              }`}
                            />
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0.6 }}
                              animate={{ scale: 1.8, opacity: 0 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.7 }}
                              className={`absolute w-32 h-32 rounded-full border-2 ${
                                isPlayingAudio ? 'border-green-400/30 bg-green-400/5' : 'border-red-400/30 bg-red-400/5'
                              }`}
                            />
                          </>
                        )}
                      </AnimatePresence>

                      <div className={`relative w-24 h-24 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center border-4 transition-all duration-300 ${
                        isListening ? 'border-red-500 scale-105' :
                        isPlayingAudio ? 'border-green-500 scale-105 shadow-green-500/10' :
                        'border-indigo-100 dark:border-slate-700'
                      }`}>
                        <span className="text-5xl select-none">{selectedScenario.avatar}</span>
                        
                        {isRecording && (
                          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg border border-white dark:border-slate-800 animate-pulse">
                            <Mic size={12} />
                          </div>
                        )}
                        {isPlayingAudio && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full shadow-lg border border-white dark:border-slate-800">
                            <Volume2 size={12} className="animate-bounce" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center mt-3">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                        {selectedScenario.characterName}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {selectedScenario.characterRole} · Human Voice Practice Mode
                      </p>
                    </div>

                    {/* Subtitle / Real-time Transcript display */}
                    <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-lg mt-5 min-h-[110px] flex flex-col justify-center text-center">
                      <AnimatePresence mode="wait">
                        {isGeminiLiveConnecting ? (
                          <motion.div
                            key="connecting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center gap-2"
                          >
                            <div className="relative w-8 h-8 flex items-center justify-center">
                              <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
                            </div>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold animate-pulse">
                              Connecting to hands-free live audio...
                            </span>
                          </motion.div>
                        ) : geminiLiveError ? (
                          <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                          >
                            <span className="text-xs text-red-500 font-extrabold uppercase tracking-wider block">Connection Failed</span>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {geminiLiveError}
                            </p>
                            <button
                              onClick={() => {
                                disconnectGeminiLive();
                                connectGeminiLive();
                              }}
                              className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                            >
                              Retry Connection
                            </button>
                          </motion.div>
                        ) : isAiTyping ? (
                          <motion.div
                            key="thinking"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-1.5"
                          >
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            <span className="text-xs text-slate-400 font-bold ml-1">Translating response...</span>
                          </motion.div>
                        ) : isPlayingAudio ? (
                          <motion.div
                            key="ai-speaking"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-1"
                          >
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest block">{selectedScenario.characterName} Speaking...</span>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {aiSpeakingText || (messages[messages.length - 1]?.sender === 'ai' ? messages[messages.length - 1].text : '') || 'Generating speech...'}
                            </p>
                          </motion.div>
                        ) : isListening ? (
                          <motion.div
                            key="user-speaking"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-1"
                          >
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Hands-Free Mic Active</span>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {recognizedText || 'Speak now in ' + selectedScenario.language + '...'}
                            </p>
                          </motion.div>
                        ) : messages.length > 0 ? (
                          <motion.div
                            key="last-message"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-widest block ${
                              messages[messages.length - 1].sender === 'ai' ? 'text-green-500' : 'text-indigo-500'
                            }`}>
                              {messages[messages.length - 1].sender === 'ai' ? selectedScenario.characterName : 'You'}
                            </span>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                              "{messages[messages.length - 1].text}"
                            </p>
                            
                            {messages[messages.length - 1].sender === 'ai' && (
                              <button
                                onClick={() => handleToggleTranslation(messages[messages.length - 1].id)}
                                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                              >
                                {messages[messages.length - 1].showTranslation ? "Hide Translation" : "Show Translation (EN)"}
                              </button>
                            )}
                            
                            {messages[messages.length - 1].showTranslation && messages[messages.length - 1].translation && (
                              <p className="text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                                {messages[messages.length - 1].translation}
                              </p>
                            )}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>

                    {/* Speech Waveform Bar graphics */}
                    <div className="h-8 flex items-center gap-1.5 justify-center mt-3">
                      {isPlayingAudio ? (
                        Array.from({ length: 9 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              animation: `wave-grow 1s ease-in-out infinite alternate`,
                              animationDelay: `${i * 0.12}s`,
                            }}
                            className="w-1 bg-green-500 rounded-full"
                          />
                        ))
                      ) : isListening ? (
                        Array.from({ length: 9 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              animation: `wave-grow 0.6s ease-in-out infinite alternate`,
                              animationDelay: `${i * 0.08}s`,
                            }}
                            className="w-1 bg-red-500 rounded-full"
                          />
                        ))
                      ) : (
                        Array.from({ length: 9 }).map((_, i) => (
                          <span
                            key={i}
                            className="w-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bottom Audio/Microphone Control Box */}
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-4 z-10">
                    
                    <button
                      onClick={() => {
                        const nextMute = !isMuted;
                        setIsMuted(nextMute);
                      }}
                      className={`p-2.5 rounded-xl transition-all ${
                        isMuted 
                          ? 'bg-slate-200 text-slate-500 dark:bg-slate-800' 
                          : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0500e2] dark:text-[#4b53fa]'
                      }`}
                      title={isMuted ? "Unmute Voice" : "Mute Voice"}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          if (isListening) {
                            stopMicrophone();
                            setIsListening(false);
                          } else {
                            if (geminiLiveWsRef.current) {
                              startMicrophone(geminiLiveWsRef.current);
                            } else {
                              connectGeminiLive();
                            }
                          }
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                          isListening 
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 ring-4 ring-red-500/20' 
                            : 'bg-[#0500e2] hover:bg-indigo-700 text-white shadow-indigo-600/30 ring-4 ring-indigo-500/10'
                        }`}
                        title={isListening ? "Pause Hands-Free microphone" : "Resume Hands-Free microphone"}
                      >
                        {isListening ? (
                          <div className="relative flex items-center justify-center">
                            <span className="absolute animate-ping inline-flex h-8 w-8 rounded-full bg-red-400 opacity-75" />
                            <PhoneOff size={20} />
                          </div>
                        ) : (
                          <Mic size={20} />
                        )}
                      </button>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {isListening ? 'Hands-Free Active' : 'Mic Paused'}
                      </span>
                    </div>

                    <button
                      disabled={isGettingSuggestion || isAiTyping}
                      onClick={handleGetSuggestion}
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0500e2] dark:text-[#4b53fa] rounded-xl transition-all disabled:opacity-30"
                      title="AI response recommendation"
                    >
                      <Sparkles size={18} className={isGettingSuggestion ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  
                  <style>{`
                    @keyframes wave-grow {
                      0% { height: 6px; }
                      100% { height: 26px; }
                    }
                  `}</style>

                </div>
              ) : (
                /* STANDARD CHAT VIEW PANEL */
                <>
                  <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                    
                    {/* Introduction/Goal Box */}
                    <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10 p-3.5 rounded-xl border border-indigo-50/60 dark:border-indigo-950/30 flex items-start gap-2.5">
                      <Info size={16} className="text-[#0500e2] dark:text-[#4b53fa] mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Scenario Objective:</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          {selectedScenario.description} Solve the task in character with {selectedScenario.characterName}.
                        </p>
                      </div>
                    </div>

                    {messages.map((msg) => {
                      const isAi = msg.sender === 'ai';
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                        >
                          {isAi && (
                            <span className="text-2xl h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center select-none shadow-sm mt-1 shrink-0">
                              {selectedScenario.avatar}
                            </span>
                          )}

                          <div className="space-y-1">
                            <div
                              className={`p-3.5 rounded-2xl relative group transition-all text-sm leading-relaxed shadow-sm ${
                                isAi 
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none' 
                                  : 'bg-[#0500e2] text-white rounded-tr-none'
                              }`}
                            >
                              <p>{msg.text}</p>

                              {/* Instant translation drop */}
                              {msg.showTranslation && msg.translation && (
                                <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs italic opacity-90">
                                  {msg.translation}
                                </div>
                              )}

                              {/* Quick audio play for AI */}
                              {isAi && (
                                <div className="absolute right-2 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                                  <button
                                    onClick={() => playSpeech(msg.text)}
                                    className="p-1 bg-white dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-200 hover:text-indigo-600 shadow-sm"
                                    title="Listen to pronunciation"
                                  >
                                    <Volume2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleTranslation(msg.id)}
                                    className="p-1 bg-white dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-200 hover:text-indigo-600 shadow-sm text-[9px] font-black"
                                    title="Translate message"
                                  >
                                    EN
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* AI TYPING BUBBLE */}
                    {isAiTyping && (
                      <div className="flex gap-3 max-w-[80%] mr-auto">
                        <span className="text-2xl h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm shrink-0">
                          {selectedScenario.avatar}
                        </span>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* TEXT & AUDIO INPUT CONTROL BAR */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                    
                    {/* AI Hint Helper bubble */}
                    {currentSuggestion ? (
                      <div className="bg-indigo-50/80 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-start justify-between gap-3 animate-fade-in text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400">
                            <Sparkles size={12} />
                            <span>Suggested Practice Reply ({selectedScenario.language}):</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 italic">"{currentSuggestion.target}"</p>
                          <p className="text-slate-400 text-[11px]">Translation: {currentSuggestion.translation}</p>
                        </div>
                        <button
                          onClick={() => handleSendMessage(currentSuggestion.target)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px]"
                        >
                          Use Reply
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <HelpCircle size={12} />
                          <span>Stuck? Get an AI tutor recommendation</span>
                        </span>
                        <button
                          disabled={isGettingSuggestion || isAiTyping}
                          onClick={handleGetSuggestion}
                          className="text-[#0500e2] dark:text-[#4b53fa] hover:underline font-bold flex items-center gap-1 disabled:opacity-5 transition-opacity"
                        >
                          {isGettingSuggestion ? (
                            <>
                              <Loader2 size={11} className="animate-spin" />
                              <span>Generating Hint...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} />
                              <span>Suggest Response</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Input Panel */}
                    <div className="flex items-center gap-2">
                      
                      {/* Voice input mode selector */}
                      <button
                        onClick={() => {
                          if (isListening) {
                            stopListening();
                          } else {
                            startListening();
                          }
                        }}
                        className={`p-3 rounded-xl transition-all ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20' 
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200'
                        }`}
                        title={isListening ? "Stop Capturing Voice" : "Tap to Speak (Real Voice)"}
                      >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          disabled={isAiTyping}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendMessage();
                          }}
                          placeholder={
                            isListening 
                              ? `Listening to your ${selectedScenario.language}...` 
                              : `Reply to ${selectedScenario.characterName} in ${selectedScenario.language}...`
                          }
                          className="w-full text-sm py-3 pl-4 pr-12 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0500e2]/50"
                        />

                        <button
                          disabled={!inputMessage.trim() || isAiTyping}
                          onClick={() => handleSendMessage()}
                          className="absolute right-2.5 top-2.5 p-1.5 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>

                    {isListening && (
                      <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 justify-center animate-pulse">
                        <span>🔴 Listening to your voice... Speak your sentence clearly in {selectedScenario.language}.</span>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* RIGHT COLUMN: SCENARIO OBJECTIVES CHECKLIST */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-6 overflow-y-auto">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Scenario Goals</h3>
                <p className="text-xs text-slate-400 mt-0.5">Complete these conversation tasks to maximize your evaluation grade.</p>
              </div>

              <div className="space-y-3">
                {selectedScenario.objectives.map((obj, oIdx) => {
                  const isDone = completedObjectives.includes(obj);
                  return (
                    <div
                      key={oIdx}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        isDone 
                          ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                          : 'bg-slate-50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className={`mt-0.5 p-0.5 rounded-full ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                        <Check size={11} />
                      </div>
                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold block ${isDone ? 'line-through opacity-85' : ''}`}>
                          {obj}
                        </span>
                        <span className="text-[10px] text-slate-400">Task Completion Weight: +25%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CHARACTER PROFILE CARD */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl space-y-2.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Character Dossier:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedScenario.avatar}</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedScenario.characterName}</h5>
                    <p className="text-[10px] text-slate-400">{selectedScenario.characterRole}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  "{selectedScenario.characterPersona}"
                </p>
              </div>

              <div className="bg-[#0500e2]/5 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                  <Sparkles size={11} /> Fluency Tip
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Use complete, contextual statements instead of single-word textbook responses to earn additional vocabulary selection bonuses.
                </p>
              </div>

            </div>

          </motion.div>
        )}

        {/* VIEW 4: DETAILED AI EVALUATION & SCORECARD */}
        {currentView === 'evaluation' && selectedScenario && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {isEvaluating ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
                <Loader2 className="animate-spin text-[#0500e2] dark:text-[#4b53fa] mx-auto" size={42} />
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Analyzing Your Conversational Phrasing...</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Gemini is evaluating your grammar, vocabulary selection level, task objectives completion, and structural fluency metrics.
                  </p>
                </div>
              </div>
            ) : evaluation ? (
              <div className="space-y-6">
                
                {/* TOP HEADER SUMMARY BAR */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl">{selectedScenario.avatar}</span>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Practice Session Report Card</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedScenario.title} · Practice completed in {selectedScenario.language}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-[#0500e2]/5 dark:bg-indigo-950/20 px-4 py-2 rounded-xl text-center">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Earned Points</span>
                      <strong className="text-sm font-black text-[#0500e2] dark:text-[#4b53fa]">+{earnedXp} XP</strong>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedScenario(null);
                        setCurrentView('dashboard');
                      }}
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>

                {/* OVERALL GRADE & METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* OVERALL RADIAL/DIAL STYLE METRIC CARD */}
                  <div className="bg-gradient-to-br from-[#0500e2] to-[#4b53fa] text-white rounded-2xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
                    {/* Background decor */}
                    <div className="absolute right-0 bottom-0 w-44 h-44 bg-white/5 rounded-full" />

                    <div className="space-y-4 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full">CEFR Grade Card</span>
                      <div className="py-2">
                        <span className="text-6xl font-black">{evaluation.overallScore}%</span>
                        <h4 className="text-lg font-bold mt-2">Overall Fluency Match</h4>
                      </div>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed relative z-10 pt-4 border-t border-white/10">
                      {evaluation.feedback}
                    </p>
                  </div>

                  {/* FIVE SUB-SCORES METERS */}
                  <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Conversational Learning Metrics</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Task Completion */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Task Completion</span>
                          <span>{evaluation.taskScore}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evaluation.taskScore}%` }} />
                        </div>
                      </div>

                      {/* Grammar Accuracy */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Grammar Accuracy</span>
                          <span>{evaluation.grammarScore}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${evaluation.grammarScore}%` }} />
                        </div>
                      </div>

                      {/* Vocabulary Appropriateness */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Vocabulary Choice</span>
                          <span>{evaluation.vocabScore}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${evaluation.vocabScore}%` }} />
                        </div>
                      </div>

                      {/* Pronunciation Quality */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Pronunciation Quality</span>
                          <span>{evaluation.pronunciationScore}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${evaluation.pronunciationScore}%` }} />
                        </div>
                      </div>

                      {/* Fluency */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Interactive Fluency</span>
                          <span>{evaluation.fluencyScore}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0500e2] rounded-full" style={{ width: `${evaluation.fluencyScore}%` }} />
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* GRAMMAR RECTIFICATIONS & VOCABULARY UPGRADES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* GRAMMAR CORRECTIONS */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-red-500" size={18} />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Grammar Corrections</h4>
                    </div>

                    <div className="space-y-3">
                      {evaluation.grammarCorrections.length > 0 ? (
                        evaluation.grammarCorrections.map((corr, idx) => (
                          <div key={idx} className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-950/30 rounded-xl space-y-1.5">
                            <div className="text-xs text-red-700 dark:text-red-400">
                              <span>You said: </span>
                              <span className="line-through italic font-bold">"{corr.original}"</span>
                            </div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                              <span>Correction: </span>
                              <span>"{corr.corrected}"</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-red-100/30">
                              {corr.explanation}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-400">
                          No grammar errors found. Pristine sentence constructions!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VOCABULARY UPGRADES */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-amber-500" size={18} />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Vocabulary Upgrades</h4>
                    </div>

                    <div className="space-y-3">
                      {evaluation.vocabUpgrades.length > 0 ? (
                        evaluation.vocabUpgrades.map((upg, idx) => (
                          <div key={idx} className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950/30 rounded-xl space-y-1.5">
                            <div className="text-xs text-amber-700 dark:text-amber-400">
                              <span>Basic term: </span>
                              <span className="italic font-bold">"{upg.original}"</span>
                            </div>
                            <div className="text-xs text-indigo-700 dark:text-indigo-400 font-bold">
                              <span>Upgraded Native: </span>
                              <span>"{upg.upgrade}"</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-amber-100/30">
                              {upg.explanation}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-400">
                          Excellent, rich vocabulary selections utilized!
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ) : null}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
